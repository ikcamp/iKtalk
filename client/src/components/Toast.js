import React, { Component } from 'react'
import PropTypes from 'prop-types'

const styles = {
  maskContainer: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    zIndex: '999',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: '0',
    transition: 'opacity .8s ease'
  },
  toastContainer: {
    borderRadius: '12px',
    background: 'rgba(0,0,0,.5)',
    color: '#fff',
    fontSize: '12px',
    padding: '5px 10px'
  },
  fadeIn: {
    display: 'flex',
    opacity: '1'
  },
  fadeOut: {
    display: 'none',
    opacity: '0'
  }
}

/**
 * Toast组件
 *
 * @export
 * @class Toast
 * @extends {Component}
 */
export default class Toast extends Component {

  /**
   * 属性类型
   *
   * @prop className: string
   * @prop style: object
   * @prop duration: number
   * @static
   */
  static propTypes = {
    className: PropTypes.object,
    style: PropTypes.object,
    duration: PropTypes.number // 显示持续时间
  }

  /**
   * 属性默认值
   *
   * @static
   */
  static defaultProps = {
    className: { mask: '', toast: '' },
    duration: 3000
  }

  constructor(props) {
    super(props)

    this.state = {
      visible: false,
      timer: 0
    }
  }

  /**
   * 显示组件
   * @public
   *
   * @param message 消息内容
   * @param [duration] 持续时间
   */
  show = (message, duration = this.props.duration) => {
    this.hide()
    this.setState({
      visible: !!message,
      message: message,
      timer: setTimeout(()=>{
        this.setState({ visible: false })
      }, duration)
    })
  }

  hide = () => {
    clearTimeout(this.state.timer)
    this.setState({ visible: false })
  }

  render() {
    let { visible, message } = this.state
    let { className } = this.props
    if (!visible) return null
    return (
      <div style={{ ...styles.maskContainer, ...(visible ? styles.fadeIn : styles.fadeOut) }} onClick={this.hide}>
        <div style={styles.toastContainer}>
          { message }
        </div>
      </div>
    )
  }
}