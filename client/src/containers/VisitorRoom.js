import React, { Component } from 'react'
import Room from '../components/VisitorRoom'
import Hls from 'hls.js'
import fetch from '../fetch'
import config from '../config'

const { httpServer, httpsServer, httpsHost, httpsPort } = config

class RoomContainer extends Component {

  componentDidMount() {
    const { match } = this.props
    if(Hls.isSupported()) {
      this.getChannel(match.params.id).then(({ playUrl }) => {
        this.setState({
          playUrl: `${httpServer}${playUrl}`
        })
      })
    }
  }

  getChannel(id) {
    console.debug('get channel info', id)
    return new Promise((resolve, reject) =>{
      fetch(`/channel/${id}`)
      .then(res=>res.json())
      .then(({ status, message, data })=>{
        console.debug('channel info', data)
        if (status !== 0) {
          reject()
        } else {
          this.setState({
            channelInfo: data
          })
          resolve(data)
        }
      }).catch(reject)
    })
  }

  /**
   * 后退
   * 
   * 
   * @memberof MyRoomContainer
   */
  handleExit = () => {
    const { history } = this.props
    history.goBack(-1)
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

export default RoomContainer
