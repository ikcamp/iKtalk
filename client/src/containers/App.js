import React, { Component } from 'react'
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom'
import { Provider } from 'react-redux'
import store from '../store'
import Home from './Home'
import Config from './Config'
import Room from './Room'
import MyRoom from './MyRoom'
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
    fetch('http://localhost:4412/user', {
      method: 'POST',
      body: 'id=zoei',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data; charset=utf-8',
      }
    }).then(res=>res.json()).then(({ data })=>{
      console.log('data', data)
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
    fetch(`http://localhost:4412/user/${userId}`, {
      mode: 'cors'
    }).then(res=>res.json())
      .then(({ data })=>{
        console.log('getUser', data)
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
          <div>
            <Route exact path="/" component={Home}/>
            <Route path="/room/my" component={MyRoom}/>
            <Route path={`/room/${user.id}`} component={MyRoom}/>
            <Route path="/room/:id" component={Room}/>
            <Route path="/config" component={Config}/>
          </div>
        </Router>
      </Provider>
    )
  }
}

export default App
