import React, { Component } from 'react'
import * as webRTCServices from '../lib/services'
import { connect } from 'react-redux'
import MediaStreamRecorder from 'msr'
import fetch from '../fetch'

const mediaConstraints = {
  audio: true,
  video: {
    mandatory: {
      minWidth: 500, // Provide your own width, height and frame rate here
      minHeight: 300,
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
    navigator.mediaDevices.getUserMedia(mediaConstraints)
      .then((stream) => {
        callback(stream)
        var mediaRecorder = new MediaStreamRecorder(stream)
        mediaRecorder.mimeType = 'video/webm'
        mediaRecorder.ondataavailable = (blob) => {
          if (this.state.status === MyRoom.LIVE_STATUS.SOCKET_CONNECTED) {
            this.setState({ status: MyRoom.LIVE_STATUS.LIVING })
          }
          if (this.state.status === MyRoom.LIVE_STATUS.SOCKET_CONNECTED || this.state.status === MyRoom.LIVE_STATUS.LIVING) {
            webRTCServices.uploadStream(blob)
          }
        }
        mediaRecorder.start(3000)
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
            console.log(status, data)
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
    webRTCServices.connect(id, ()=>{
      this.setState({ status: MyRoom.LIVE_STATUS.SOCKET_CONNECTED })
      console.log('server connected')
    })
  }

  end() {
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
        <video src={this.state.stream} autoPlay></video>
        <a onClick={this.end.bind(this)}>结束直播</a>
      </div>
    )
  }
}

export default connect(state=>({
  user: state.user
}))(MyRoom)
