import React, { Component } from 'react'
import * as webRTCServices from '../lib/services'

class Room extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stream: '',
    }
  }

  componentDidMount() {
  }

  render() {
    return (
      <div>
        <video src={this.state.stream} autoPlay></video>
      </div>
    )
  }
}

export default Room
