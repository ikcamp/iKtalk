import config from '../config'
import io from 'socket.io-client'
export default class MakeSocket {
  constructor(id) {
    this.socket = io(`${config.httpServer}/${id}`)
  }
  sendBarrage(message) {
    this.socket.emit('new message', message);
  }
}
