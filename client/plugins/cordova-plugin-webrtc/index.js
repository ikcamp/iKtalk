/**
 * Remotium, Inc. 2014 All Rights Reserved
 * Jose Pereira <jose@remotium.com>
 *
 * Main entry.
 * We export all objects to window as they'll be globally accessible just like
 * the standard. We export with a webkit prefix as we're using the same webrtc
 * version as chrome, for compatibility with the commonly used webrtc adapter.js.
 *
 * Note: adapter.js must be loaded after the cordova plugins to make the detection.
 */

window.RTCIceCandidate = require('./app/rtcicecandidate.js');
window.RTCSessionDescription = require('./app/rtcsessiondescription.js');

var getUserMedia = require('./app/getusermedia.js');
window.getUserMedia =
    navigator.webkitGetUserMedia = getUserMedia.bind(navigator);

window.webkitRTCPeerConnection =
    window.RTCPeerConnection =
    require('./app/rtcpeerconnection.js');

window.RTCDataChannel = require('./app/rtcdatachannel.js');