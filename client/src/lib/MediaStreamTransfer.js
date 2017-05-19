import io from 'socket.io-client'
import ss from 'socket.io-stream'

export default class MediaStreamTransfer {

  constructor({ server, host, port }) {
    this.server = server
    this.host = host
    this.port = port
    this.isConnected = false
  }

  connect(id) {
    return new Promise((resolve, reject) => {
      const { server, host, port } = this
      let connectTimer = setTimeout(reject, 10000)
      console.debug('connecting socket', id)
      const socket = this.socket = io(`${server}/${id}` || `http://${host}:${port}/${id}`)
      socket.on('connect', () => {
        this.isConnected = true
        console.log('socket connected')
        socket.emit('login', { id })
        clearTimeout(connectTimer)
        resolve()
      })
    })
  }

  upload(blob) {
    if (!this.isConnected) return
    let sr = ss.createStream()
    ss(this.socket).emit('upload', sr)
    let d = ss.createBlobReadStream(blob)
    d.pipe(sr)
    console.log('upload stream')
  }
}