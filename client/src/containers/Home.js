import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

class Home extends Component {

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    fetch('http://localhost:4412/channel', {
      mode: 'cors'
    })
  }

  render() {
    const { user = {} } = this.props
    return (
      <div>
        <Link to="/config">我的房间</Link>
        <ul>
          <li><Link to="/room/1">观看直播1</Link></li>
          <li><Link to="/room/2">观看直播2</Link></li>
          <li><Link to="/room/3">观看直播3</Link></li>
          <li><Link to="/room/4">观看直播4</Link></li>
        </ul>
      </div>
    )
  }
}

export default connect(state=>({
  user: state.user
}))(Home)
