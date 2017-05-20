import React, { Component } from 'react'
import {
  BrowserRouter as Router,
  Route,
  Switch
} from 'react-router-dom'
import { Provider } from 'react-redux'
import store from '../store'
import Home from './Home'
import HostRoom from './HostRoom'
import VisitorRoom from './VisitorRoom'
import fetch from '../fetch'

class App extends Component {

  constructor(props) {
    super(props)
    this.state = { user: {} }
  }

  componentDidMount() {
    // 从localStorage中获取用户登录状态
    let userStr = localStorage.getItem('user')
    if (!userStr) {
      this.addUser()
    } else {
      try {
        let lastLoginUser = JSON.parse(userStr)
        this.setState({ user: lastLoginUser })
        store.dispatch({
          type: 'UPDATE_USER',
          payload: lastLoginUser
        })
      } catch (e) {
        console.log(e)
        this.addUser()
      }
    }
  }

  /**
   * 创建用户
   * 
   * 
   * @memberof App
   */
  addUser() {
    fetch('/user', {
      body: {}
    }).then(res=>res.json()).then(({ data })=>{
      this.setState({ user: data })
      store.dispatch({
        type: 'UPDATE_USER',
        payload: data
      })
      // 保存用户登录状态到localStorage中
      localStorage.setItem('user', JSON.stringify(data))
      console.debug('new user', data)
    })
  }

  /**
   * 获取用户
   * 
   * @param {any} userId 
   * 
   * @memberof App
   */
  getUser(userId) {
    fetch(`/user/${userId}`, {
      mode: 'cors'
    }).then(res=>res.json())
      .then(({ data })=>{
        this.setState({ user: data })
        store.dispatch({
          type: 'UPDATE_USER',
          payload: data
        })
        // 保存用户登录状态到localStorage中
        localStorage.setItem('user', JSON.stringify(data))
        console.debug('user from cache', data)
      })
  }

  render() {
    return (
      <Provider store={store}>
        <Router>
          <Switch>
            <Route exact path="/" component={Home}/>
            <Route path="/room/host" component={HostRoom}/>
            <Route path="/room/:id" component={VisitorRoom}/>
          </Switch>
        </Router>
      </Provider>
    )
  }
}

export default App
