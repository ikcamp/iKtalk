import React, { Component } from 'react'
import { connect } from 'react-redux'
import Room from '../components/VisitorRoom'
import Hls from 'hls.js'
import LiveSocket from '../lib/LiveSocket'
import fetch from '../fetch'
import config from '../config'
import { VISITOR_ROOM_ERROR_STATUS } from '../consts'

const { httpServer, httpsServer, httpsHost, httpsPort } = config
const LIVE_STATUS = {
  IDLE: 0, // 空闲中
  CHANNEL_READY: 1, // 开始直播
  SOCKET_CONNECTED: 2, // socket已连接
  LIVING: 3, // 直播中
  END: 4 // 直播结束
}

class VisitorRoomContainer extends Component {

  constructor(props) {
    super(props)
    const { match } = props
    this.state = { channelId: match.params.id, status: LIVE_STATUS.IDLE }
  }

  componentDidMount() {
    const { channelId } = this.state
    this.getChannel(channelId).then(()=>this.connectSocketServer(channelId))
  }

  getChannel(id) {
    return new Promise((resolve, reject) =>{
      this.setState({
        roomError: ''
      })
      fetch(`/channel/${id}`)
      .then(res=>res.json())
      .then(({ status, message, data })=>{
        if (status !== 0) {
          reject({ status, message })
          this.setState({
            roomError: { status, message }
          })
        } else {
          this.setState({
            channelInfo: data,
            playUrl: `${httpServer}${data.playUrl}`,
            status: LIVE_STATUS.CHANNEL_READY
          })
          resolve(data)
        }
      }).catch((e, r)=>{
        reject(e)
        this.setState({
          roomError: VISITOR_ROOM_ERROR_STATUS.NETWORK
        })
      })
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
   * 后退
   *
   * @memberof MyRoomContainer
   */
  handleExit = () => {
    this.props.history.goBack(-1)
  }

  render() {
    const { handleExit } = this
    const { roomError } = this.state
    return (
      <Room
        {...this.props}
        {...this.state}
        onExitRoom={handleExit}
        roomError={roomError}
      />
    )
  }
}

export default connect(state=>({
  user: state.user
}))(VisitorRoomContainer)
