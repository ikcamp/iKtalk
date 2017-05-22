import React, { Component } from 'react'
import { connect } from 'react-redux'
import Room from '../components/VisitorRoom'
import Hls from 'hls.js'
import fetch from '../fetch'
import config from '../config'
import { VISITOR_ROOM_ERROR_STATUS } from '../consts'

const { httpServer, httpsServer, httpsHost, httpsPort } = config

class RoomContainer extends Component {

  componentDidMount() {
    const { match } = this.props
     this.getChannel(match.params.id)
  }

  getChannel(id) {
    console.debug('get channel info', id)
    return new Promise((resolve, reject) =>{
      this.setState({
        roomStatus: ''
      })
      fetch(`/channel/${id}`)
      .then(res=>res.json())
      .then(({ status, message, data })=>{
        console.debug('channel info', data)
        if (status !== 0) {
          reject({ status, message })
          this.setState({
            roomError: { status, message }
          })
        } else {
          this.setState({
            channelInfo: data,
            playUrl: `${httpServer}${data.playUrl}`
          })
          resolve(data)
        }
      }).catch((e, r)=>{
        reject(e)
        this.setState({
          roomStatus: VISITOR_ROOM_ERROR_STATUS.NETWORK
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
    return (
      <Room
        {...this.props}
        {...this.state}
         onExitRoom={handleExit}
      />
    )
  }
}

export default connect(state=>({
  user: state.user
}))(RoomContainer)
