import React, { Component } from 'react'
import { Link } from 'react-router-dom'

class Config extends Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    fetch('http://localhost:4412/add')
  }

  render() {
    return (
      <div>
        <input type="text" placeholder="房间名称"/>
        <Link to="/room/my">开始直播</Link>
      </div>
    );
  }
}

export default Config
