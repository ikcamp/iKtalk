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
      // if (!this.props.user && nextProps.user) {
      //   let uid = nextProps.user.id
      //   let aSocket = new MakeSocket(uid)
      //   aSocket.socket.on('new message', (data)=>{
      //     console.log(data)
      //   })
      // }
    }
    componentDidMount() {
      if(this.props.user){
        let uid = this.props.user.id
        let aSocket = new MakeSocket(uid)
        aSocket.socket.on('new message', (data)=>{
          this.addBarrage(data)
        })
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
            transitionEnterTimeout={4000}>
            {barrages}
          </ReactCSSTransitionGroup>
        </div>
      )
    }
}
