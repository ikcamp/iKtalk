import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import Toast from './Toast'
import Hls from 'hls.js'
import BarrageList from './BarrageList'
import BarrageInput from './BarrageInput'

const videoSrc = require('../containers/3.mp4')
const CLIENT_WIDTH = document.documentElement.clientWidth
const CLIENT_HEIGHT = document.documentElement.clientHeight

const styles = {
  room: {
    width: `${CLIENT_WIDTH}px`,
    height: `${CLIENT_HEIGHT}px`
  },
  video: {
    objectFit: 'cover',
    width: '100%',
    height: '100%'
  },
  controlPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: '#fff',
    transition: 'visibility .5s'
  },
  backBtn: {
    display: 'inline-block',
    width: '24px',
    height: '24px',
    backgroundSize: '100% auto',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    backgroundImage: `url(${require('./images/over@2x.png')})`,
    position: 'absolute',
    top: '15px',
    left: '15px',
    cursor: 'pointer'
  },
  toggleCameraBtn: {
    display: 'inline-block',
    width: '31px',
    height: '26px',
    backgroundSize: '100% auto',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    backgroundImage: `url(${require('./images/toggle-camera@2x.png')})`,
    position: 'absolute',
    top: '15px',
    right: '15px',
    cursor: 'pointer'
  }
}

export default class MyRoom extends Component {

  constructor(props) {
    super(props)
    this.state = {
      controlPanelVisible: true
    }
  }

  componentDidMount() {
    const { playUrl } = this.props
    this.hideTimer = setTimeout(()=>{
      this.setState({ controlPanelVisible: false })
    }, 3000)
    let video = this.video = ReactDOM.findDOMNode(this.refs.video)
    playUrl && this.loadSource(playUrl)
    this.showToast('连接中...', 99999)
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.playUrl !== this.props.playUrl) {
      this.loadSource(nextProps.playUrl)
    }
  }

  loadSource(playUrl) {
    if (!playUrl) return
    let video = this.video || ReactDOM.findDOMNode(this.refs.video)
    var hls = new Hls()
    hls.loadSource(playUrl)
    hls.attachMedia(video)
    hls.on(Hls.Events.MANIFEST_PARSED,function() {
      video.play()
    })
    hls.on(Hls.Events.ERROR, (e, err)=>{
      if (err.type === 'networkError') {
        this.showToast('解析地址出错')
      }
      console.debug(e, err)
    })
    this.showToast('连接成功', 2000)
  }

  handleTouch = () => {
    this.hideTimer && clearTimeout(this.hideTimer)
    this.setState({
      controlPanelVisible: true
    }, ()=>{
      this.hideTimer = setTimeout(()=>{
        this.setState({ controlPanelVisible: false })
        this.showToast('触碰屏幕显示菜单')
      }, 3000)
    })

  }

  componentWillUnmount() {
    this.unmounted = true
    clearTimeout(this.hideTimer)
  }

  showToast = (message) => {
    this.refs.toast && this.refs.toast.show(message)
  }

  render() {
    const { handleTouch } = this
    const { controlPanelVisible } = this.state
    const { onExitRoom, stream,  showToast } = this.props
    return (
      <div style={styles.room} onClick={handleTouch}>
        <video src={videoSrc} autoPlay style={styles.video} ref="video"></video>
         <div style={{ ...styles.controlPanel, visibility: controlPanelVisible ? 'visible' : 'hidden' }}>
          <a onClick={onExitRoom} style={styles.backBtn}></a>
        </div>
        <Toast duration={2000} ref="toast" />
        <BarrageList user={this.props.match.params}/>
        <BarrageInput user={this.props.match.params}/>
      </div>
    )
  }
}
