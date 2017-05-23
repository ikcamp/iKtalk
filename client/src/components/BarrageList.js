import React, { Component } from 'react'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
export default class BarrageList extends Component {
    constructor(props) {
      super(props)
      this.state = {barrages: this.props.barrages}
    }
    componentWillReceiveProps(nextProps) {
        this.setState({barrages: nextProps.barrages})
    }
    render() {
      const barrages = this.state.barrages ? this.state.barrages.map((barrage, index) => (
        <div key={index} className={`barrage-${index % 8}`}>
          {barrage}
        </div>
      )) : []
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
