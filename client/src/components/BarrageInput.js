import React, { Component } from 'react'
import ReactDOM from 'react-dom';
export default class BarrageInput extends Component {
    constructor(props) {
      super(props)
    }
    componentDidMount() {
      let barrage = ReactDOM.findDOMNode(this.refs.barrageMessage)
      barrage.addEventListener('keydown', (e)=>{
        if (e.keyCode === 13) this.sendBarrage()
      }, false)
    }
    sendBarrage() {
      let barrage = ReactDOM.findDOMNode(this.refs.barrageMessage)
      if (barrage.value) {
        this.props.onBarrageSend(barrage.value)
        barrage.value = ''
      }
    }
    render() {
      return (
        <div className="barrage-input-container">
          <input type="text" className="barrage-input-text" ref="barrageMessage" placeholder="吐个槽呗" maxLength="10"/>
          <input type="button" value="发送弹幕" onClick={e => this.sendBarrage(e)} className="barrage-input-submit"/>
        </div>
      )
    }
}
