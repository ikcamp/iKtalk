import React, { Component } from 'react';
import {StyleSheet, Text, TouchableHighlight, View, ListView, Image, TextInput} from 'react-native';
import {RTCView} from 'react-native-webrtc';
import FullScreenVideo from "./components/FullScreenVideo.js";
import Commons from "./lib/commons.js";
import styles from "./style/app.js";
import config from "./config/app.js";
import * as webRTCServices from "./lib/services.js";

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      stream: {},
    }
  }

  componentDidMount() {
    webRTCServices.getLocalStream(true, (stream) => {
      this.setState({
        stream: {
          url: stream.toURL()
        }
      })
    });
  }

  render() {
    return <View style={styles.container}>
      <FullScreenVideo streamURL={this.state.stream.url} />
    </View>
  } 
}
