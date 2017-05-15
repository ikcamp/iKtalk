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

let socket = io('https://192.168.37.118:5801/test')
// let socket = io('https://localhost:4413/test')

socket.on('connect', () => {
  socket.emit('login', {
    id: '705730534'
  })
})

function getLocalStream(isFront, callback) {
  streamCb = callback;
  navigator.mediaDevices.getUserMedia(mediaConstraints)
    .then(onMediaSuccess)
    .catch(onMediaError)
}

function onMediaSuccess(stream) {
  streamCb(stream);
  var mediaRecorder = new MediaStreamRecorder(stream);
  mediaRecorder.mimeType = 'video/webm';
  mediaRecorder.ondataavailable = function (blob) {
    // POST/PUT "Blob" using FormData/XHR2
    let sr = ss.createStream()
    ss(socket).emit('upload', sr)
    ss.createBlobReadStream(blob).pipe(sr)
    // var blobURL = URL.createObjectURL(blob);
    // window.open(blobURL);
  };
  mediaRecorder.start(3000);
}

function onMediaError(e) {
  console.error('media error', e);
}

export {
  getLocalStream
}