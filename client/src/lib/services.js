import MediaStreamRecorder from 'msr';
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
      var blobURL = URL.createObjectURL(blob);
      window.open(blobURL);
  };
  mediaRecorder.start(5000);
}

function onMediaError(e) {
    console.error('media error', e);
}

export {
  getLocalStream
}