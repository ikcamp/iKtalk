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
        //当监听到弹幕信息后调用addBarrage方法
        this.socket.on('new message', (data)=>{
          this.addBarrage(data);
        });
      }
      this.state = {barrages: []}
    }
    /**
     * 改变弹幕state
     * @param {Object} barrage 弹幕对象
     * @return
     */
    addBarrage(barrage) {
      const newBarrage = this.state.barrages.concat([barrage.message])
      this.setState({barrages: newBarrage})
    }
    /**
    * 发送弹幕信息
    * @param {Object} barrage 弹幕对象
    * @return
    */
    sendBarrage(barrage) {
      this.socket && this.socket.emit('new message', barrage)
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
