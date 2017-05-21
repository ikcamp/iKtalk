import React, { Component } from 'react'
import Toast from './Toast'
import BarrageInput from './BarrageInput'
import BarrageList from './BarrageList'
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

export default class HostRoom extends Component {

  constructor(props) {
    super(props)
    this.state = {
      controlPanelVisible: true
    }
  }

  componentWillReceiveProps(nextProps) {
    if(this.props.stream && nextProps.stream !== this.props.stream) {
      this.setState({
        _loading_: true
      }, ()=>this.setState({ _loading_: false }))
    }
  }

  componentDidMount() {
    this.hideTimer = setTimeout(()=>{
      this.setState({ controlPanelVisible: false })
    }, 3000)
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
    const { _loading_, controlPanelVisible } = this.state
    const { stream, cameras = [], onExitRoom, onToggleCamera } = this.props
    return (
      <div style={styles.room} onClick={handleTouch}>
        { !_loading_ && <video src={stream} autoPlay style={styles.video}></video> }
        <div style={{ ...styles.controlPanel, visibility: controlPanelVisible ? 'visible' : 'hidden' }}>
          <a onClick={onExitRoom} style={styles.backBtn}></a>
          { cameras.length >= 2 && <a onClick={onToggleCamera} style={styles.toggleCameraBtn}></a> }
        </div>
        <Toast duration={2000} ref="toast" />
        <BarrageInput user={this.props.user} />
        <BarrageList user={this.props.user} />
      </div>
    )
  }
}
