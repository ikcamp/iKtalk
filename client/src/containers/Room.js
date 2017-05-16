import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import Hls from 'hls.js'
import fetch from '../fetch'

class Room extends Component {

  componentDidMount() {
    const { match } = this.props
    if(Hls.isSupported()) {
      var video = ReactDOM.findDOMNode(this.refs.video)
      var hls = new Hls()
      hls.loadSource(`https://192.168.37.118:5801/channel/${match.params.id}/playlist`)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED,function() {
        video.play()
      })
      hls.on(Hls.Events.ERROR, (e, err)=>{
        console.log(e, err)
      })
    }
  }

  render() {
    return (
      <div>
        <video autoPlay controls ref="video" width="500" height="300"></video>
      </div>
    )
  }
}

export default Room
