import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import fetch from '../fetch'

class Config extends Component {

  constructor(props) {
    super(props)
    this.state = {
      liveStatus: 0,
      channelInfo: {}
    }
  }

  componentDidMount() {
    const { user } = this.props
    if (user) {
      fetch(`http://localhost:4412/channel/${user.id}`)
      .then(res=>res.json())
      .then(({ status, message, data })=>{
        console.log('channel info', data)
        if (status !== 0) {
          this.setState({
            liveStatus: 0
          })
        } else {
          this.setState({
            liveStatus: 1,
            channelInfo: data
          })
        }
      })
    }
  }

  begin() {
    const { user } = this.props
    fetch('http://localhost:4412/channel', {
      body: {
        id: user.id
      }
    })
  }

  render() {
    const { liveStatus } = this.state
    return (
      <div>
        <input type="text" placeholder="房间名称"/>
        <a onClick={this.begin.bind(this)}>{ liveStatus ? '回到直播' : '开始直播'}</a>
      </div>
    );
  }
}

export default connect(state=>({
  user: state.user
}))(Config)
