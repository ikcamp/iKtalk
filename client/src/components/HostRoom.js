import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import Toast from './Toast'
import Barrage from './Barrage'
const CLIENT_WIDTH = document.documentElement.clientWidth
const CLIENT_HEIGHT = document.documentElement.clientHeight
import '../style/room.css'
import cx from 'classnames'

const styles = {
  room: {
    width: `${CLIENT_WIDTH}px`,
    height: `${CLIENT_HEIGHT}px`
  }
}

export default class HostRoom extends Component {

  constructor(props) {
    super(props)
    this.state = {
      controlPanelVisible: true
    }
  }

  componentDidMount() {
    this.hideTimer = setTimeout(()=>{
      this.setState({ controlPanelVisible: false })
    }, 3000)
  }

  handleTouch = () => {
    this.hideTimer && clearTimeout(this.hideTimer)
    this.setState({
      controlPanelVisible: true
    }, ()=>{
      this.hideTimer = setTimeout(()=>{
        this.setState({ controlPanelVisible: false })
      }, 3000)
    })

  }

  componentWillUnmount() {
    this.unmounted = true
    clearTimeout(this.hideTimer)
  }

  showToast = (message) => {
    this.refs.toast && this.refs.toast.show(message)
  }

  render() {
    const { handleTouch } = this
    const { controlPanelVisible } = this.state
    const {
      user, stream, cameras = [], liveCount = 0,
      isMuted, onExitRoom, onToggleMute, onToggleCamera
    } = this.props
    return (
      <div className="room" style={styles.room}>
        <video src={stream} autoPlay className="video"></video>
        <div className="float-layer" onClick={handleTouch}>
          <div className="live-count"><span className="icon icon-user"/>{liveCount}</div>
          <div className={cx('control-bar', { moveout: !controlPanelVisible })}>
            <Link to="/" className="icon icon-close"/>
            { cameras.length >= 2 && <a onClick={onToggleCamera} className="icon icon-camera"></a> }
            <a onClick={onToggleMute} className={cx('icon', 'icon-vol', { 'vol-mute': isMuted, 'vol-normal': !isMuted })}></a>
          </div>
        </div>
        <Toast duration={2000} ref="toast" />
        <Barrage channel={this.props.user}/>
      </div>
    )
  }
}
