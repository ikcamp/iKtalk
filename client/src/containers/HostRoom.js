import React, { Component } from 'react'
import { connect } from 'react-redux'
import HostRoom from '../components/HostRoom'
import MediaStreamRecorder from 'msr'
// import MediaStreamRecorder from '../lib/MediaStreamRecorder'
import LiveSocket from '../lib/LiveSocket'
import fetch from '../fetch'
import config from '../config'

const { httpServer, httpsServer, httpsHost, httpsPort } = config
const CLIENT_WIDTH = document.documentElement.clientWidth
const CLIENT_HEIGHT = document.documentElement.clientHeight

export const LIVE_STATUS = {
  IDLE: 0, // 空闲中
  BEGIN: 1, // 开始直播
  SOCKET_CONNECTED: 2, // socket已连接
  LIVING: 3, // 直播中
  END: 4 // 直播结束
}

class HostRoomContainer extends Component {

  constructor(props) {
    super(props)
    this.state = {
      status: LIVE_STATUS.IDLE,
      mediaConstraints: {
        audio: false,
        video: {
          width: CLIENT_WIDTH,
          height: CLIENT_HEIGHT,
          frameRate: 30
        }
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.user && nextProps.user) {
      this.begin(nextProps.user.id)
    }
  }

  componentDidMount() {
    if (this.props.user) {
      this.begin(this.props.user.id)
    }
    this.initMedias()
  }

  /**
   * 退出的时候，结束直播
   *
   *
   * @memberof HostRoomContainer
   */
  componentWillUnmount() {
    this.handleLiveOver()
  }

  /**
   * 切换前后摄像头
   *
   * @memberof HostRoomContainer
   */
  toggleCamera = () => {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop()
    }
    const mediaConstraints = this.state.mediaConstraints
    const { cameras, cameraIndex } = this.state
    let newCameraIndex = cameraIndex ? 0 : 1
    let newCamera = cameras[newCameraIndex]
    this.getLocalStream({
      ...mediaConstraints,
      video: {
        ...mediaConstraints.video,
        deviceId: newCamera.deviceId
      },
    }, stream => {
      this.setState({
        cameraIndex: newCameraIndex,
        stream: window.URL.createObjectURL(stream)
      })
    })
  }

  /**
   * 切换音频
   * 
   * 
   * @memberof HostRoomContainer
   */
  toggleAudio = () => {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop()
    }
    const mediaConstraints = this.state.mediaConstraints
    this.getLocalStream({
      ...mediaConstraints,
      audio: !mediaConstraints.audio
    }, stream => {
      this.setState({
        mediaConstraints: {
          ...mediaConstraints,
          audio: !mediaConstraints.audio
        },
        stream: window.URL.createObjectURL(stream)
      })
    })
  }


  /**
   * 初始化媒体设备
   *
   *
   * @memberof HostRoomContainer
   */
  initMedias() {
    this.getCameras()
    this.getLocalStream(this.state.mediaConstraints, stream => {
      this.setState({
        cameraIndex: 0,
        stream: window.URL.createObjectURL(stream)
      })
    })
  }


  /**
   * 获取支持的摄像头列表
   *
   *
   * @memberof HostRoomContainer
   */
  getCameras() {
    let cameras = []
    navigator.mediaDevices.enumerateDevices().then((mediaDeviceInfos) => {
      for (var i = 0; i != mediaDeviceInfos.length; ++i) {
        var mediaDeviceInfo = mediaDeviceInfos[i];
        //这里会遍历audio,video，所以要加以区分
        if (mediaDeviceInfo.kind === 'videoinput') {
           cameras.push(mediaDeviceInfo)
        }
      }
      this.setState({
        cameras
      })
    })
  }

  /**
   * 获取本地媒体流
   *
   * @param {any} constraints
   * @param {any} callback
   *
   * @memberof HostRoomContainer
   */
  getLocalStream(constraints, callback) {
    // let mediaRecorder = this.mediaRecorder = new MediaStreamRecorder()
    navigator.mediaDevices.getUserMedia(constraints).then(stream=>{
      callback(stream)
      try {
        let mediaRecorder = this.mediaRecorder = new MediaStreamRecorder(stream)
        mediaRecorder.mimeType = 'video/webm'
        mediaRecorder.canvas = {
          width: CLIENT_WIDTH,
          height: CLIENT_HEIGHT
        }
        mediaRecorder.ondataavailable = (blob) => {
        // mediaRecorder.onDataAvailable = (blob) => {
          if (this.state.status === LIVE_STATUS.SOCKET_CONNECTED) {
            this.setState({ status: LIVE_STATUS.LIVING })
          }
          if (this.state.status === LIVE_STATUS.SOCKET_CONNECTED || this.state.status === LIVE_STATUS.LIVING) {
            if (this.liveSocket && this.liveSocket.isConnected) this.liveSocket.upload(blob)
          }
        }
        mediaRecorder.start(3000)
      } catch(e) {
        alert(e)
      }
    })
    .catch((e)=>{
      console.error('media error', e)
    })
  }

  /**
   * 通知服务器开始直播，如果频道不存在，则创建频道
   *
   * @param {any} id
   *
   * @memberof HostRoomContainer
   */
  begin(id) {
    if (this.state.status !== LIVE_STATUS.IDLE) return
    this.getChannel(id).then(()=>{
      fetch(`/channel/${id}/begin`)
      .then(res=>res.json())
      .then(({ status }) => {
        if (status === 0) {
          this.setState({
            status: LIVE_STATUS.BEGIN
          }, ()=>this.connectSocketServer(id))
        } else {
          window.alert('开始直播异常')
        }
      })
    }).catch(e=>console.log('get channel error', e))
  }

  /**
   * 获取频道信息
   *
   * @param {any} id
   * @returns
   *
   * @memberof HostRoomContainer
   */
  getChannel(id) {
    return new Promise((resolve, reject) =>{
      fetch(`/channel/${id}`)
      .then(res=>res.json())
      .then(({ status, message, data })=>{
        console.log('channel info', data)
        if (status !== 0) {
          fetch('/channel', {
            body: { id }
          })
          .then(res=>res.json())
          .then(({ status, data }) => {
            resolve()
          }).catch(reject)
        } else {
          this.setState({
            channelInfo: data
          })
          resolve()
        }
      }).catch(reject)
    })
  }

  /**
   * 连接Socket服务器
   *
   * @param {any} id
   *
   * @memberof HostRoomContainer
   */
  connectSocketServer(id) {
    let liveSocket = this.liveSocket = new LiveSocket({ server: httpServer })
    liveSocket.connect(id).then(()=>{
      this.setState({ status: LIVE_STATUS.SOCKET_CONNECTED })
      liveSocket.on('online', (count)=>{
        this.setState({
          liveCount: count
        })
      })
    })
  }

  /**
   * 直播结束时，通知服务器结束
   *
   *
   * @memberof HostRoomContainer
   */
  handleLiveOver = () => {
    if(this.mediaRecorder) {
      this.mediaRecorder.ondataavailable = ()=>{}
      this.mediaRecorder.stop()
    }
    if (this.liveSocket) {
      this.liveSocket.disconnect()
    }
    const { user, history } = this.props
    fetch(`/channel/${user.id}/end`)
    .then(res=>res.json())
    .then(({ status }) => {
      if (status !== 0) {
        console.debug('结束直播异常')
      }
    })
  }

  /**
   * 退出房间
   *
   *
   * @memberof HostRoomContainer
   */
  handleExit = () => {
    const { history } = this.props
    history.goBack(-1)
  }

  render() {
    const { toggleCamera, toggleAudio, handleExit } = this
    const { mediaConstraints } = this.state
    return (
      <HostRoom
        {...this.props}
        {...this.state}
        isMuted={!mediaConstraints.audio}
        onToggleCamera={toggleCamera}
        onToggleMute={toggleAudio}
        onExitRoom={handleExit}
      />
    )
  }
}

export default connect(state=>({
  user: state.user
}))(HostRoomContainer)
