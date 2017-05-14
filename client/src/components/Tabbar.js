import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import c from 'classnames'
import '../style/Bar.css'

export default class Tabbar extends Component {

  constructor(props) {
    super(props)
    this.state = {
      activeTab: props.activeTab || 'Home'
    }
  }

  changeTab(tab) {
    this.setState({ activeTab: tab })
  }

  render() {
    const { activeTab } = this.state
    return (
      <nav className="bar bar-tab">
        <Link className={c('tab-item', { active: activeTab === 'Home' })} to="/" onClick={()=>{this.changeTab('Home')}}>
          正在直播
        </Link>
        <Link className={c('tab-item', { active: activeTab === 'Config' })} to="/config" onClick={()=>{this.changeTab('Config')}}>
          我的房间
        </Link>
      </nav>
    )
  }
}
