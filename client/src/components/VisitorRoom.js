import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { Link } from 'react-router-dom'
import Toast from './Toast'
import Hls from 'hls.js'
import Barrage from './Barrage'
import { VISITOR_ROOM_ERROR_STATUS, VISITOR_ROOM_ERROR_MESSAGE } from '../consts'
import '../style/room.css'
import cx from 'classnames'

const CLIENT_WIDTH = document.documentElement.clientWidth
const CLIENT_HEIGHT = document.documentElement.clientHeight
const { NOT_FOUND } = VISITOR_ROOM_ERROR_STATUS

const styles = {
  room: {
    width: `${CLIENT_WIDTH}px`,
    height: `${CLIENT_HEIGHT}px`
  },
  roomError: {
    width: `${CLIENT_WIDTH}px`,
    height: `${CLIENT_HEIGHT}px`
  }
}

const RoomError = ({ status }) => {
  return (
    <div style={styles.roomError}>
      <div>{VISITOR_ROOM_ERROR_MESSAGE[status]}</div>
      <Link style={{ marginTop: '100px' }} to="/" >返回</Link>
    </div>
  )
}

export default class VisitorRoom extends Component {

  static STATUS = {
    CONNECTING: 0,
    LIVING: 1,
    NOT_FOUND: -1,
    LIVE_OVER: -2,
  }

  constructor(props) {
    super(props)
    this.state = {
      controlPanelVisible: true,
      isFullScreen: false
    }
  }

  componentDidMount() {
    const { playUrl } = this.props
    this.hideTimer = setTimeout(()=>{
      this.setState({ controlPanelVisible: false })
    }, 3000)
    let video = this.video = ReactDOM.findDOMNode(this.refs.video)
    playUrl && this.loadSource(playUrl)
    this.showToast('努力连接中...', 99999)
    this.initEventListeners(video)
  }

  initEventListeners = (video) => {
    video.addEventListener('webkitfullscreenchange', this.onFullScreenChange)
    video.addEventListener('volumechange', this.onVolumeChange)
  }

  removeEventListeners = (video) => {
    video.removeEventListener('webkitfullscreenchange', this.onFullScreenChange)
    video.removeEventListener('volumechange', this.onVolumeChange)
  }

  onFullScreenChange = () => {
    this.setState({ isFullScreen: !this.state.isFullScreen })
  }

  onVolumeChange = () => {
    this.setState({ isMuted: !this.state.isMuted })
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

  componentWillUnmount() {
    this.unmounted = true
    clearTimeout(this.hideTimer)
  }

  handleTouch = () => {
    this.hideTimer && clearTimeout(this.hideTimer)
    this.setState({
      controlPanelVisible: true
    }, ()=>{
      this.hideTimer = setTimeout(()=>{
        this.setState({ controlPanelVisible: false })
      }, 3000)
    })

  }

  toggleFullScreen = () => {
    let isFullScreen = this.state.isFullScreen
    if (isFullScreen) {
      this.video && this.video.exitFullscreen()
    } else {
      this.video && this.video.webkitRequestFullScreen()
    }
  }

  toggleMute = () => {
    this.video.volume = this.video.volume ? 0 : 1
  }

  showToast = (message, duration) => {
    this.refs.toast && this.refs.toast.show(message, duration)
  }

  renderError({ status }) {
    if(status === NOT_FOUND) {
      return (
        <div style={styles.roomError}>
          您要找的房间好像不存在哦
        </div>
      )
    }
  }

  render() {
    const { showToast, handleTouch, toggleFullScreen, toggleMute } = this
    const { controlPanelVisible, isFullScreen, isMuted } = this.state
    const {
      user, stream, liveCount = 0, roomStatus, roomError,
      isMute = false,
    } = this.props

    if (roomError) return <RoomError {...roomError}/>

    return (
      <div className="room" style={styles.room}>
        <video autoPlay className="video" ref="video"></video>
        <div className="float-layer" onClick={handleTouch}>
          <div className="live-count">
            <img src={require('./images/user@2x.png')}/>{liveCount}
          </div>
          <div className={cx('control-bar', { moveout: !controlPanelVisible })}>
            <Link to="/" className="icon back-btn"/>
            <a onClick={toggleFullScreen} className={cx('icon', 'full-screen', { 'full-screen-exit': isFullScreen, 'full-screen-enter': !isFullScreen })}></a>
            <a onClick={toggleMute} className={cx('icon', 'vol', { 'vol-mute': isMuted, 'vol-normal': !isMuted })}></a>
          </div>
        </div>
        <Toast duration={2000} ref="toast" />
        <Barrage channel={this.props.match.params}/>
      </div>
    )
  }
}
