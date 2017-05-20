import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import fetch from '../fetch'

class Home extends Component {

  constructor(props) {
    super(props)
    this.state = {
      channelList: []
    }
  }

  componentDidMount() {
    fetch('/channel', {
      mode: 'cors'
    })
    .then(res=>res.json())
    .then(({ data })=>{
      this.setState({ channelList: data })
    })
  }

  render() {
    const { channelList } = this.state
    return (
      <div>
        <Link to="/room/host">直播+</Link>
        <ul>
          {
            channelList.map(({ id, })=>(
              <li key={id}><Link to={`/room/${id}`}>{id}</Link></li>
            ))
          }
        </ul>
      </div>
    )
  }
}

export default connect(state=>({
  user: state.user
}))(Home)
