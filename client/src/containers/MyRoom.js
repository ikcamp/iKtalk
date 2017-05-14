import React, { Component } from 'react'
import * as webRTCServices from '../lib/services'

class MyRoom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stream: '',
    }
  }

  componentDidMount() {
    webRTCServices.getLocalStream(true, (stream) => {
      this.setState({
        stream: window.URL.createObjectURL(stream)
      })
    });
  }

  render() {
    return (
      <div>
        <video src={this.state.stream} autoPlay></video>
      </div>
    )
  }
}

export default MyRoom
