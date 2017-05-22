import config from '../config'
import io from 'socket.io-client'
import React, { Component } from 'react'
import BarrageList from './BarrageList'
import BarrageInput from './BarrageInput'

export default class Barrage extends Component {
    constructor(props) {
      super(props)
      if(this.props.channel){
        let cid = this.props.channel.id
        this.socket = io(`${config.httpServer}/${cid}`)
        this.socket.on('new message', (data)=>{
          this.addBarrage(data);
        });
      }
      this.state = {barrages: []}
    }
    addBarrage(item) {
      const newBarrage = this.state.barrages.concat([item.message]);
      this.setState({barrages: newBarrage});
    }
    sendBarrage(barrage) {
      this.socket && this.socket.emit('new message', barrage);
    }
    render() {
      return (
        <div>
          <BarrageList barrages={this.state.barrages} />
          <BarrageInput onBarrageSend={this.sendBarrage.bind(this)} />
        </div>
      )
    }
}
