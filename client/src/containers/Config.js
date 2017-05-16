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
      fetch(`/channel/${user.id}`)
      .then(res=>res.json())
      .then(({ status, message, data })=>{
        console.log('channel info', data)
        if (status !== 0) {
          fetch('/channel', {
            body: { id: user.id }
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
    const { user, history } = this.props
    fetch(`/channel/${user.id}/begin`)
    .then(res=>res.json())
    .then(({ status }) => {
      if (status === 0) {
        // history.push(`/room/${user.id}`)
        history.push(`/room/my`)
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
