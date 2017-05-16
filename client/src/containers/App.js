import React, { Component } from 'react'
import {
  BrowserRouter as Router,
  Route,
  Switch
} from 'react-router-dom'
import { Provider } from 'react-redux'
import store from '../store'
import Home from './Home'
import Config from './Config'
import Room from './Room'
import MyRoom from './MyRoom'
import fetch from '../fetch'
import '../style/App.css'

class App extends Component {

  constructor(props) {
    super(props)
    this.state = { user: {} }
  }

  componentDidMount() {
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

  addUser() {
    fetch('/user', {
      body: { id: 'testuser' }
    }).then(res=>res.json()).then(({ data })=>{
      this.setState({ user: data })
      store.dispatch({
        type: 'UPDATE_USER',
        payload: data
      })
      localStorage.setItem('user', JSON.stringify(data))
      console.debug('new user', data)
    })
  }

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
        localStorage.setItem('user', JSON.stringify(data))
        console.debug('user from cache', data)
      })
  }

  render() {
    const { user = {} } = this.state
    return (
      <Provider store={store}>
        <Router>
          <Switch>
            <Route exact path="/" component={Home}/>
            <Route path="/room/my" component={MyRoom}/>
            <Route path="/room/:id" component={Room}/>
            <Route path="/config" component={Config}/>
          </Switch>
        </Router>
      </Provider>
    )
  }
}

export default App
