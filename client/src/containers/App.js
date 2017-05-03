import React, { Component } from 'react';
import * as webRTCServices from '../lib/services';
import '../style/App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stream: '',
    }
  }

  componentDidMount() {
    webRTCServices.getLocalStream(true, (stream) => {
      this.setState({
        stream: window.URL.createObjectURL(stream)
      })
    });
  }

  render() {
    return (
      <video src={this.state.stream} autoPlay></video>
    );
  }
}

export default App;
