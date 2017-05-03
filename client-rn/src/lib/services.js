import { MediaStreamTrack, getUserMedia } from 'react-native-webrtc';
const mediaConstraints = {
  audio: true,
  video: true
}
const options = {
  mimeType: 'video/webm',
  audioBitsPerSecond : 256 * 8 * 1024,
  videoBitsPerSecond : 256 * 8 * 1024,
  bitsPerSecond: 256 * 8 * 1024,  // if this is provided, skip above two
  checkForInactiveTracks: true,
  timeSlice: 1000 // concatenate intervals based blobs
}
let streamCb = null

function getLocalStream(isFront, callback) {
  streamCb = callback;
  MediaStreamTrack.getSources(sourceInfos => {
    getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);
  });
}

function onMediaSuccess(stream) {
  streamCb(stream);
}

function onMediaError(e) {
    console.error('media error', e);
}

export {
  getLocalStream
}