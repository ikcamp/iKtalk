import React, { Component } from 'react'
import MakeSocket from '../lib/MakeSocket'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'

export default class BarrageList extends Component {
    constructor(props) {
      super(props)
      this.state = {barrages: []}
      this.addBarrage = this.addBarrage.bind(this)
    }
    componentWillReceiveProps(nextProps) {
      if (!this.props.channel && nextProps.channel) {
        let cid = nextProps.channel
        console.log(cid, 'aaaaaaaaaaa')
        let aSocket = new MakeSocket(cid)
        console.log(aSocket, "bbbbbbb")

        aSocket.socket.on('new message', (data)=>{
          console.log(data, 'ccccc');
          this.addBarrage(data);
        });
      }
    }
    componentDidMount() {
      if(this.props.channel){
        console.log("1111111")
        let cid = this.props.channel.id
        let aSocket = new MakeSocket(cid)
        aSocket.socket.on('new message', (data)=>{
          this.addBarrage(data);
        });
      }
    }
    addBarrage(item) {
      const newBarrage = this.state.barrages.concat([item.message]);
      this.setState({barrages: newBarrage});
    }
    render() {
      const barrages = this.state.barrages.map((barrage, index) => (
        <div key={barrage} className={`barrage-${index % 8}`}>
          {barrage}
        </div>
      ))
      return (
        <div className="barrages">
          <ReactCSSTransitionGroup
            transitionName="barrage"
            transitionEnterTimeout={4000}
            transitionLeave={false}>
            {barrages}
          </ReactCSSTransitionGroup>
        </div>
      )
    }
}
