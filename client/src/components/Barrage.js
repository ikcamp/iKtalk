import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import MakeSocket from '../lib/MakeSocket'
import BarrageList from './BarrageList'
import BarrageInput from './BarrageInput'

export default class Barrage extends Component {
    constructor(props) {
      super(props)
      if(this.props.channel){
        let cid = this.props.channel.id
        let instanceSocket = this.socket = new MakeSocket(cid)
        instanceSocket.socket.on('new message', (data)=>{
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
      this.socket && this.socket.sendBarrage(barrage)
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
