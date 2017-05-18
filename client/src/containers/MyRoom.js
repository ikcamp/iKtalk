import React, { Component } from 'react'
import { connect } from 'react-redux'
import MediaStreamRecorder from 'msr'
// import MediaStreamRecorder from '../lib/MediaStreamRecorder'
import MediaStreamTransfer from '../lib/MediaStreamTransfer'
import fetch from '../fetch'
import config from '../config'

const { httpServer, httpsServer, httpsHost, httpsPort } = config
const CLIENT_WIDTH = document.documentElement.clientWidth
const CLIENT_HEIGHT = document.documentElement.clientHeight

const mediaConstraints = {
  audio: true,
  video: {
    mandatory: {
      minWidth: CLIENT_WIDTH,
      minHeight: CLIENT_HEIGHT,
      minFrameRate: 30
    }
  }
}

class MyRoom extends Component {

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
      status: MyRoom.LIVE_STATUS.IDLE
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
    this.getLocalStream(stream => {
      this.setState({
        stream: window.URL.createObjectURL(stream)
      })
    })
  }

  componentWillUnmount() {
    this.end()
  }

  getLocalStream(callback) {
    // let mediaRecorder = this.mediaRecorder = new MediaStreamRecorder()
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(stream=>{
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
          if (this.state.status === MyRoom.LIVE_STATUS.SOCKET_CONNECTED) {
            this.setState({ status: MyRoom.LIVE_STATUS.LIVING })
          }
          if (this.state.status === MyRoom.LIVE_STATUS.SOCKET_CONNECTED || this.state.status === MyRoom.LIVE_STATUS.LIVING) {
            if (this.mediaStreamTransfer && this.mediaStreamTransfer.isConnected) this.mediaStreamTransfer.upload(blob)
          }
        }
        mediaRecorder.start(3000)
      } catch(e) {
        console.error(e)
      }
    })
    .catch((e)=>{
      console.error('media error', e) 
    })
  }

  begin(id) {
    if (this.state.status !== MyRoom.LIVE_STATUS.IDLE) return
    this.getChannel(id).then(()=>{
      fetch(`/channel/${id}/begin`)
      .then(res=>res.json())
      .then(({ status }) => {
        if (status === 0) {
          this.setState({
            status: MyRoom.LIVE_STATUS.BEGIN
          }, ()=>this.connectServer(id))
        } else {
          window.alert('开始直播异常')
        }
      })
    }).catch(e=>console.log('get channel error', e))
  }

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

  connectServer(id) {
    let mediaStreamTransfer = this.mediaStreamTransfer = new MediaStreamTransfer({ server: httpServer })
    mediaStreamTransfer.connect(id)
    this.setState({ status: MyRoom.LIVE_STATUS.SOCKET_CONNECTED })
  }

  end() {
    this.mediaRecorder && this.mediaRecorder.stop()
    const { user, history } = this.props
    // if (this.state.status !== MyRoom.LIVE_STATUS.SOCKET_CONNECTED) return
    fetch(`/channel/${user.id}/end`)
    .then(res=>res.json())
    .then(({ status }) => {
      if (status === 0) {
        this.setState({ status: MyRoom.LIVE_STATUS.END })
        history.goBack(-1)
      } else {
        window.alert('结束直播异常')
      }
    })
  }

  render() {
    return (
      <div>
        <video src={this.state.stream} autoPlay style={{ width: '100%', height: `${CLIENT_HEIGHT}px` }}></video>
        <div style={{ position: 'absolute' }}>
          <a onClick={this.end.bind(this)}>结束直播</a>
        </div>
      </div>
    )
  }
}

export default connect(state=>({
  user: state.user
}))(MyRoom)
