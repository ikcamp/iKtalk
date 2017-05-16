import MediaStreamRecorder from 'msr';
import io from 'socket.io-client'
import ss from 'socket.io-stream'
const mediaConstraints = {
  audio: true,
  video: {
    mandatory: {
      minWidth: 500, // Provide your own width, height and frame rate here
      minHeight: 300,
      minFrameRate: 30
    }
  }
}
let streamCb = null;

let socket
function connect(id, onConnected) {
  socket = io(`https://192.168.37.118:5801/${id}`)
  // socket = io(`https://localhost:4413/${id}`)
  socket.on('connect', () => {
    console.log('socket connected')
    socket.emit('login', { id })
    onConnected()
  })
}

function uploadStream(blob) {
  if (!socket) return
  // POST/PUT "Blob" using FormData/XHR2
  let sr = ss.createStream()
  ss(socket).emit('upload', sr)
  console.log('upload')
  ss.createBlobReadStream(blob).pipe(sr)
}

export {
  connect,
  getLocalStream,
  uploadStream
}