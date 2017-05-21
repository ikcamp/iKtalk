import React, { Component } from 'react'
import { connect } from 'react-redux'
import HostRoom from '../components/HostRoom'
import MediaStreamRecorder from 'msr'
// import MediaStreamRecorder from '../lib/MediaStreamRecorder'
import MediaStreamTransfer from '../lib/MediaStreamTransfer'
import fetch from '../fetch'
import config from '../config'

const { httpServer, httpsServer, httpsHost, httpsPort } = config
const CLIENT_WIDTH = document.documentElement.clientWidth
const CLIENT_HEIGHT = document.documentElement.clientHeight

const mediaConstraints = {
  audio: false,
  video: {
    width: CLIENT_WIDTH,
    height: CLIENT_HEIGHT,
    frameRate: 30,
    // facingMode: { exact: 'environment' }
    // facingMode: 'user',
    // mandatory: {
    //   minWidth: CLIENT_WIDTH,
    //   minHeight: CLIENT_HEIGHT,
    //   minFrameRate: 30
    // }
  }
}

class HostRoomContainer extends Component {

  static LIVE_STATUS = {
    IDLE: 0, // 空闲中
    BEGIN: 1, // 开始直播
    SOCKET_CONNECTED: 2, // socket已连接
    LIVING: 3, // 直播中
    END: 4 // 直播结束
  }

  constructor(props) {
    super(props)
    this.state = {
      status: HostRoomContainer.LIVE_STATUS.IDLE
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
        _loading_: true,
        cameraIndex: newCameraIndex,
        stream: window.URL.createObjectURL(stream)
      }, ()=>this.setState({ _loading_: false }))
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
    this.getLocalStream(mediaConstraints, stream => {
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
          if (this.state.status === HostRoomContainer.LIVE_STATUS.SOCKET_CONNECTED) {
            this.setState({ status: HostRoomContainer.LIVE_STATUS.LIVING })
          }
          if (this.state.status === HostRoomContainer.LIVE_STATUS.SOCKET_CONNECTED || this.state.status === HostRoomContainer.LIVE_STATUS.LIVING) {
            if (this.mediaStreamTransfer && this.mediaStreamTransfer.isConnected) this.mediaStreamTransfer.upload(blob)
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
    if (this.state.status !== HostRoomContainer.LIVE_STATUS.IDLE) return
    this.getChannel(id).then(()=>{
      fetch(`/channel/${id}/begin`)
      .then(res=>res.json())
      .then(({ status }) => {
        if (status === 0) {
          this.setState({
            status: HostRoomContainer.LIVE_STATUS.BEGIN
          }, ()=>this.connectServer(id))
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
  connectServer(id) {
    let mediaStreamTransfer = this.mediaStreamTransfer = new MediaStreamTransfer({ server: httpServer })
    mediaStreamTransfer.connect(id)
    this.setState({ status: HostRoomContainer.LIVE_STATUS.SOCKET_CONNECTED })
  }

  /**
   * 直播结束时，通知服务器结束
   *
   *
   * @memberof HostRoomContainer
   */
  handleLiveOver = () => {
    this.mediaRecorder && this.mediaRecorder.stop()
    const { user, history } = this.props
    // if (this.state.status !== HostRoomContainer.LIVE_STATUS.SOCKET_CONNECTED) return
    fetch(`/channel/${user.id}/end`)
    .then(res=>res.json())
    .then(({ status }) => {
      if (status === 0) {
        // this.setState({ status: HostRoomContainer.LIVE_STATUS.END })
        // history.goBack(-1)
      } else {
        window.alert('结束直播异常')
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
    const { toggleCamera, handleExit } = this
    return (
      <HostRoom
        {...this.props}
        {...this.state}
        onToggleCamera={toggleCamera}
        onExitRoom={handleExit}
      />
    )
  }
}

export default connect(state=>({
  user: state.user
}))(HostRoomContainer)
