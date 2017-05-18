import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import Hls from 'hls.js'
import fetch from '../fetch'
import config from '../config'

const { httpServer, httpsServer, httpsHost, httpsPort } = config

class Room extends Component {

  componentDidMount() {
    const { match } = this.props
    if(Hls.isSupported()) {
      this.getChannel(match.params.id).then(({ playUrl }) => {
        var video = ReactDOM.findDOMNode(this.refs.video)
        var hls = new Hls()
        hls.loadSource(`${httpServer}${playUrl}`)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED,function() {
          video.play()
        })
        hls.on(Hls.Events.ERROR, (e, err)=>{
          console.log(e, err)
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

  render() {
    return (
      <div>
        <video autoPlay controls ref="video" width="100%" height="100%"></video>
      </div>
    )
  }
}

export default Room
