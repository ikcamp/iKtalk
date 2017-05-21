import React, { Component } from 'react'
import MakeSocket from '../lib/MakeSocket'

export default class BarrageList extends Component {
    constructor(props) {
      super(props)
    }
    componentWillReceiveProps(nextProps) {
      if (!this.props.user && nextProps.user) {
        let uid = nextProps.user.id
        let aSocket = new MakeSocket(uid)
        aSocket.socket.on('new message', (data)=>{
          console.log(data)
        })
      }
    }
    componentDidMount() {
      if(this.props.user){
        let uid = this.props.user.id
        let aSocket = new MakeSocket(uid)
        aSocket.socket.on('new message', (data)=>{
          console.log(data)
        })
      }
    }
    render() {
      return (
        <ul>
          <li>TODO</li>
        </ul>
      )
    }
}
