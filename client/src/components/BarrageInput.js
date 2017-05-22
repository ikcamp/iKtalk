import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import MakeSocket from '../lib/MakeSocket'

export default class BarrageInput extends Component {
    constructor(props) {
      super(props)
    }
    sendMessage() {
      let cid = this.props.channel.id
      let barrage = ReactDOM.findDOMNode(this.refs.barrageMessage)
      if (cid && barrage.value) {
        let aSocket = new MakeSocket(cid)
        aSocket.sendBarrage(barrage.value)
        barrage.value = ''
      }
    }
    render() {
      return (
        <div className="barrage-input-container">
          <input type="text" className="barrage-input-text" ref="barrageMessage" placeholder="吐个槽呗"/>
          <input type="button" value="发送弹幕" onClick={e => this.sendMessage(e)} className="barrage-input-submit"/>
        </div>
      )
    }
}
