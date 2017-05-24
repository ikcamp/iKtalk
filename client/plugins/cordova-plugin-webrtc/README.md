
WebRTC Plugin for Cordova
=================================

[![Dependency Status](https://david-dm.org/remotium/cordova-plugin-webrtc.svg)](https://david-dm.org/remotium/cordova-plugin-webrtc)


### NOTE: This project is not production ready.
This project aims to implement the full WebRTC API on Cordova.

- Shim implementations:
	- WebRTC
		- RTCPeerConnection
		- RTCICECandidate
		- RTCSessionDescription
		- RTCDataChannel
	- getUserMedia (not really part of WebRTC, but needed to get for audio/video input)
		- MediaStream
		- MediaTrack

## Supported Platforms
- __iOS6+__
- __Android 4.0+__ coming soon

## Installation

```shell
cordova plugin add cordova-plugin-webrtc
```

## Usage
Just use exactly the same WebRTC code as you would be using for a browser page!
Bear in mind the following quirks:

- Only use the WebRTC related APIs after getting cordova's *deviceReady* event.
- Use `<webrtc-video>` tag instead of `<video>` if you dont want any video player skin to be shown. If you do that, you'll need to use el.setAttribute('src', ...) instead of el.src for the MutableObserver to detect changes in the 'src' element.
Example:

```javascript
// ------- for <video> tags -------
navigator.getUserMedia({video: true},
   function(stream) {
      var video = document.querySelector('video');
      video.src = URL.createObjectURL(stream);
   }, ...}
);
// ------- for <webrtc-video> tags -------
navigator.getUserMedia({video: true},
   function(stream) {
      var video = document.querySelector('webrtc-video');
      video.setAttribute('src', URL.createObjectURL(stream));
   }, ...}
);
```

- Use pc.dispose() to clear the native peer connection object after closing it.

### Current Limitations
- Canvas operations not supported over the WebRTC video elements.
- getUserMedia only returns front camera.
- getUserMedia overrides native implementation (if it exists). Do not use it for anything else.
- Audio tracks will be enabled even if the video tag is not in the DOM.
- No MediaStream callbacks
- Cannot detect javascript object garbage collection, thus everything has to be disposed manually (use obj.dispose() for that).

### Implementation details
To make this implementation work *almost* seamless with the WebRTC standard, we use some *hacks* that allow us to overlay the native WebRTC video views on the page.

- Use MutationObserver to listen for changing <video> tags.
- Implement MediaStream on top of Blob, so it is compatible with URL.createObjectURL.

## How to build for development
You shall already have the *npm* tool (required for cordova). Just do:

```
npm install
bower install
gulp build
```

#### WebRTC working samples (tested)
As a mid-term goal, we aim to support all WebRTC samples from [here](https://github.com/webrtc/samples), as well as the javascript AppRTC demo.

Note, the samples were only modified for its scripts only execute after cordova's *deviceReady* event is triggered.

Currently tested and working samples:

- getUserMedia
	- Basic getUserMedia demo
- RTCPeerConnection
	- Audio-only peer connection
- RTCDataChannel
	- Transmit text

## Contributing

We use the github issue tracker and pull request frameworks to accept contributions.

### To do list
- All kinds of tests
- Support for other platforms
- Better object cleanup
- ...

## License

This software is released under the Apache 2.0 License.

© 2015 Remotium, Inc. All rights reserved