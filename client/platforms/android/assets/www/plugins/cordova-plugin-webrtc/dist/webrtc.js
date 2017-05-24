cordova.define("cordova-plugin-webrtc.WebRTC", function(require, exports, module) {
module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = ".";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

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

	window.RTCIceCandidate = __webpack_require__(1);
	window.RTCSessionDescription = __webpack_require__(2);

	var getUserMedia = __webpack_require__(3);
	window.getUserMedia =
	    navigator.webkitGetUserMedia = getUserMedia.bind(navigator);

	window.webkitRTCPeerConnection =
	    window.RTCPeerConnection =
	    __webpack_require__(4);

	window.RTCDataChannel = __webpack_require__(5);

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Remotium, Inc. 2014 All Rights Reserved
	 * Jose Pereira <jose@remotium.com>
	 *
	 * Implementation of RTCIceCandidate, just a dictionary at this point.
	 * Reference: http://www.w3.org/TR/webrtc/#rtcicecandidate-type
	 *
	 * TODO
	 * - Validation of candidate/sdpMid/sdpMLineIndex keys on constructor and setters
	 * - Should we back it with a native object?
	 * - Implement toJSON()
	 */
	(function (global) {
	    'use strict';

	    var RTCIceCandidate = function () {
	        return Object.apply(this, arguments);
	    };

	    module.exports = RTCIceCandidate;
	})(this);

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Remotium, Inc. 2014 All Rights Reserved
	 * Jose Pereira <jose@remotium.com>
	 *
	 * Implementation of RTCSessionDescription, just a dictionary at this point.
	 * Reference: http://www.w3.org/TR/webrtc/#rtcsessiondescription-class
	 * TODO
	 * - Validation of sdp/type keys on constructor and setters
	 * - Should we back it with a native object?
	 * - Implement toJSON()
	 */
	(function (global) {
	    'use strict';

	    var RTCSessionDescription = function () {
	        return Object.apply(this, arguments);
	    };

	    module.exports = RTCSessionDescription;
	})(this);

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Remotium, Inc. 2014 All Rights Reserved
	 * Jose Pereira <jose@remotium.com>
	 *
	 * Implementation of getUserMedia.
	 * We use MutationObservers to listen for event changes on video tags to
	 * make the webrtc view seamlessly working with generic video tags.
	 * We use polymer/MutationObservers for backwards compatible shim.
	 */
	(function (global) {
	    'use strict';

	    var exec = __webpack_require__(6),
	        RTCUtils = __webpack_require__(7),
	        MediaStream = __webpack_require__(8);

	    //weakmap is a MutationObservers dependency without CommonJS/AMD support.
	    //We load it here to make itself available to global namespace.
	    //MutationObserver on the other hand is loaded to variable.
	    __webpack_require__(10);
	    var MutationObserver = window.MutationObserver ||
	        __webpack_require__(9).MutationObserver;

	    // create an observer instance
	    var videoTags = [];
	    //video tags currently attached to native webrtc view.
	    //key = video tag, value = associated streamId
	    var attachedVideoTags = {};

	    var mediaBlobs = {};

	    /**
	     * Convert the URL created with URL.createObjecttURL back to a blob
	     */
	    var streamIdFromUrl = function (blob, fn) {
	        var xhr = new XMLHttpRequest();
	        xhr.open('GET', blob, true);
	        xhr.responseType = 'blob';
	        xhr.onload = function () {
	            if (this.status !== 200) {
	                return;
	            }
	            var blob = this.response;
	            var streamId;
	            if (blob.size === 1) {
	                /* && blob.type === 'stream' // Android is returning text/plain for some odd reason*/
	                RTCUtils.blobContent(blob, function (err, streamId) {
	                    fn(err, streamId);
	                });
	            } else {
	                //ios6 seems to put value directly in response
	                streamId = blob;
	                fn(undefined, streamId);
	            }
	        };
	        xhr.send();
	    };

	    var removeVideoStream = function (videoEl) {
	        for (var streamId in attachedVideoTags) {
	            if (attachedVideoTags[streamId] === videoEl) {
	                exec(null, null, 'WebRTCPlugin', 'removeVideoStreamSrc', [Number(streamId)]);
	                delete attachedVideoTags[streamId];
	            }
	        }
	    };

	    var checkVideoTagAddRemoveStream = function (videoEl) {
	        var addVideoStream = function (err, streamId) {
	            if (err) {
	                console.log(err);
	                return;
	            }
	            //attach the video to the stream id
	            console.log('stream start id:' + streamId);
	            exec(null, null, 'WebRTCPlugin', 'addVideoStreamSrc', [Number(streamId),
	                getLayoutParams(videoEl),
	                getComputedStyle(videoEl).visibility === 'visible'
	            ]);
	            attachedVideoTags[streamId] = videoEl;

	            //hide original video element to show the native webrtc one
	            videoEl.style.opacity = 0;
	            videoEl.style['background-color'] =
	                document.body.style['background-color'] = 'transparent';
	        };

	        var src = videoEl.getAttribute('src');
	        if (src) {
	            if (src.indexOf('blob:') === 0) {
	                //stream added
	                streamIdFromUrl(src, addVideoStream);
	            } else if (src.indexOf('stream:' === 0)) {
	                addVideoStream(null, src.substring('stream:'.length));
	            }
	        } else {
	            removeVideoStream(videoEl);
	        }
	    };

	    var checkVideoTagVisibility = function (videoEl) {
	        var src = videoEl.getAttribute('src');
	        if (!src) {
	            console.log('Video tag src is null');
	            return;
	        }
	        streamIdFromUrl(src, function (err, streamId) {
	            if (err) {
	                console.log(err);
	                return;
	            }
	            //XXX ideally we should be listening for visibility changes in all parent
	            //elements. Unfortunally I could not find an efficient solution for that.
	            exec(null, null, 'WebRTCPlugin', 'setVideoStreamVisibility', [Number(streamId),
	                getComputedStyle(videoEl).visibility === 'visible'
	            ]);
	        });
	    };

	    var videoTagMutated = function (mutation) {
	        console.log('Video tag mutated');
	        console.log(mutation);
	        //if source changes let's enable media stream on that object
	        //TODO support for srcObject = stream 
	        if (mutation.type === 'attributes') {
	            //TODO check if a stream was removed either with src or srcObject before add
	            if (mutation.attributeName === 'src') {
	                checkVideoTagAddRemoveStream(mutation.target);
	            } else if (mutation.attributeName === 'style') {
	                checkVideoTagVisibility(mutation.target);
	            }
	        }
	    };

	    /**
	     * Adds the video tag to the list and observes it.
	     */
	    var addVideoTag = function (tag) {
	        console.log('addVideoTag');

	        if (tag.tagName !== 'VIDEO' && tag.tagName !== 'WEBRTC-VIDEO') {
	            return;
	        }

	        //make sure we didn't add it yet
	        for (var i = 0; i < videoTags.length; i++) {
	            if (videoTags[i].element === tag) {
	                return;
	            }
	        }

	        var observer = new MutationObserver(function (mutations) {
	            mutations.forEach(function (mutation) {
	                videoTagMutated(mutation);
	            });
	        });

	        observer.observe(tag, {
	            attributes: true,
	            attributeFilter: ['style', 'src', 'srcObject']
	        });
	        videoTags.push({
	            element: tag,
	            observer: observer
	        });
	        console.log('Video tag added ' + videoTags.length);
	        checkVideoTagAddRemoveStream(tag);
	    };

	    /**
	     * Removes video tag from the video list and stops observing it.
	     */
	    var removeVideoTag = function (tag) {
	        console.log('removeVideoTag');

	        if (tag.tagName !== 'VIDEO' && tag.tagName !== 'WEBRTC-VIDEO') {
	            return;
	        }

	        for (var i = 0; i < videoTags.length; i++) {
	            if (videoTags[i].element === tag) {
	                var observer = videoTags[i].observer;
	                if (observer) {
	                    observer.disconnect();
	                } else {
	                    console.log('ERROR tag not found!');
	                }
	                videoTags.splice(i, 1);
	                break;
	            }
	        }
	        console.log('Tag removed ' + videoTags.length);
	        removeVideoStream(tag);
	    };

	    //TODO change got this from phonertc
	    var getLayoutParams = function (videoElement) {
	        var boundingRect = videoElement.getBoundingClientRect();
	        if (cordova.platformId === 'android') {
	            return {
	                devicePixelRatio: window.devicePixelRatio || 2,
	                // get these values by doing a lookup on the dom
	                x: boundingRect.left + window.scrollX,
	                y: boundingRect.top + window.scrollY,
	                width: videoElement.offsetWidth,
	                height: videoElement.offsetHeight
	            };
	        }
	        return {
	            // get these values by doing a lookup on the dom
	            x: boundingRect.left,
	            y: boundingRect.top,
	            width: videoElement.offsetWidth,
	            height: videoElement.offsetHeight
	        };
	    };

	    var handleMutation = function (mutations) {
	        var getVideoElems = function (node) {
	            var videoElems = Array.prototype.slice.call(
	                node.getElementsByTagName('VIDEO'));
	            var webrtcElems = Array.prototype.slice.call(
	                node.getElementsByTagName('WEBRTC-VIDEO'));
	            return videoElems.concat(webrtcElems);
	        };

	        mutations.forEach(function (mutation) {
	            if (mutation.type === 'childList') {
	                var addedNodes = Array.prototype.slice.call(mutation.addedNodes);
	                addedNodes.forEach(function (node) {
	                    if (!node.getElementsByTagName) {
	                        return;
	                    }
	                    getVideoElems(node).forEach(function (elem) {
	                        addVideoTag(elem);
	                    });
	                });
	                var removedNodes = Array.prototype.slice.call(mutation.removedNodes);
	                removedNodes.forEach(function (node) {
	                    if (!node.getElementsByTagName) {
	                        return;
	                    }
	                    getVideoElems(node).forEach(function (elem) {
	                        removeVideoTag(elem);
	                    });
	                });
	            }
	        });
	    };

	    //send element position updates.
	    var reportVideoTagPosition = function () {
	        for (var streamId in attachedVideoTags) {
	            exec(null, null, 'WebRTCPlugin', 'setVideoStreamPosition', [
	                Number(streamId),
	                getLayoutParams(attachedVideoTags[streamId])
	            ]);
	        }
	    };

	    //listen for scroll changes, and update the native views position.
	    //XXX test on android
	    //TODO use an element position event listener to report positions
	    //https://github.com/sdecima/javascript-detect-element-resize
	    if (cordova.platformId !== 'android') {
	        document.addEventListener('touchmove', function () {
	            reportVideoTagPosition();
	        });
	        //scroll events are fired on end of scroll for mobile safari.
	        //this is good in case the user 'throws' the scrollview and we stop
	        //get touch events.
	        document.addEventListener('scroll', function () {
	            reportVideoTagPosition();
	        });
	    }

	    //getUserMedia implementation
	    var getUserMedia = function (constraints, successCallback, errorCallback) {
	        exec(function (res) {
	            
	            console.log(res);
	            
	            //we're supposed to return a MediaStream
	            // note that MediaStream has Blob constructor
	            var mediaBlob = new MediaStream([res.id], {
	                type: 'stream',
	            });
	            
	            //extend the stream with what we received
	            for (var key in res) {
	                if (res.hasOwnProperty(key)) {
	                    mediaBlob[key] = res[key];
	                }
	            }

	            mediaBlobs[mediaBlob.id] = mediaBlob;
	            successCallback(mediaBlob);
	        }, errorCallback, 'WebRTCPlugin', 'getUserMedia', [constraints]);
	    };

	    document.addEventListener('deviceReady', function e() {
	        //append already existing tags when device is ready
	        var videoTags = Array.prototype.slice.call(
	            document.querySelectorAll('video'));
	        var webrtcTags = Array.prototype.slice.call(
	            document.querySelectorAll('webrtc-video'));
	        var existingVideoTags = videoTags.concat(webrtcTags);
	        existingVideoTags.forEach(function (tag) {
	            addVideoTag(tag);
	        });

	        //save a reference to the observer so it doesn't get gc'ed
	        getUserMedia.videoTagObserver = new MutationObserver(handleMutation);

	        // pass in the target node, as well as the videoTagObserver options
	        getUserMedia.videoTagObserver.observe(document.body, {
	            childList: true,
	            subtree: true
	        });
	        document.removeEventListener('deviceReady', e);
	    }, false);

	    module.exports = getUserMedia;
	})(this);

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Remotium, Inc. 2014 All Rights Reserved
	 * Jose Pereira <jose@remotium.com>
	 *
	 * Implementation of getUserMedia
	 *
	 */
	(function (global) {
	    'use strict';

	    var exec = __webpack_require__(6),
	        RTCDataChannel = __webpack_require__(5),
	        RTCUtils = __webpack_require__(7);

	    var RTCPeerConnection = function (iceServers, constraints) {
	        this.id = RTCPeerConnection.ID++;

	        //initial states
	        this.iceConnectionState = 'new';
	        this.iceGatheringState = 'new';
	        this.signalingState = 'stable';

	        exec(function (res) {
	            //update states
	            if (res.cmd === 'signalingstatechange') {
	                this.signalingState = res.args.state;
	            } else if (res.cmd === 'iceconnectionstatechange') {
	                this.iceConnectionState = res.args.state;
	            } else if (res.cmd === 'icegatheringchange') {
	                this.iceGatheringState = res.args.state;
	            } else if (res.cmd === 'addstream') {
	                //we need to replace the stream id with a fake blob
	                var streamId = res.args.stream;
	                //if (window.Blob && !window.WebKitBlobBuilder) {
	                //    res.args.stream = new Blob([streamId], {
	                //        type: 'stream'
	                //    });
	                //} else {
	                res.args.stream = 'stream:' + streamId;
	                //}
	            } else if (res.cmd === 'removestream') {
	                //do we need anything?
	            } else if (res.cmd === 'datachannel') {
	                var channel = new RTCDataChannel(this.id, res.args.id);
	                console.log('NEW DATAC');
	                console.log(res)
	                console.log(channel);

	                //extend the data channel
	                for (var key in res.args) {
	                    if (res.args.hasOwnProperty(key)) {
	                        channel[key] = res.args[key];
	                    }
	                }

	                res.args.channel = channel;
	                //force trigger remote channel open
	                // RTCUtils.createEventAndTrigger('open', {state: 'open'}, channel);
	            }

	            RTCUtils.createEventAndTrigger(res.cmd, res.args, this);

	        }.bind(this), function () {
	            throw 'Error creating peer connection';
	        }, 'WebRTCPlugin', 'rtcPeerConnection_new', [this.id, iceServers, constraints]);
	    };

	    RTCPeerConnection.ID = 1;

	    RTCPeerConnection.prototype.createOffer = function (
	        successCallback, errorCallback, constraints) {
	        exec(successCallback, errorCallback, 'WebRTCPlugin',
	            'rtcPeerConnectionCreateOffer', [this.id, constraints]);
	    };

	    RTCPeerConnection.prototype.createAnswer = function (
	        successCallback, errorCallback, constraints) {
	        exec(successCallback, errorCallback, 'WebRTCPlugin',
	            'rtcPeerConnectionCreateAnswer', [this.id, constraints]);
	    };

	    RTCPeerConnection.prototype.addIceCandidate = function (candidate,
	        successCallback, errorCallback) {
	        exec(successCallback, errorCallback, 'WebRTCPlugin',
	            'rtcPeerConnectionAddIceCandidate', [this.id, candidate]);
	    };

	    RTCPeerConnection.prototype.updateIce = function (configuration, constraints) {
	        exec(null, null, 'WebRTCPlugin',
	            'rtcPeerConnectionUpdateIce', [this.id, configuration, constraints]);
	    };

	    RTCPeerConnection.prototype.createDataChannel = function (label, dataChannelDict) {
	        return new RTCDataChannel(this, label, dataChannelDict);
	    };

	    RTCPeerConnection.prototype.setLocalDescription = function (sessionDescription,
	        successCallback, errorCallback) {
	        this.localDescription = sessionDescription;
	        exec(successCallback, errorCallback, 'WebRTCPlugin',
	            'rtcPeerConnectionSetLocalDescription', [this.id, sessionDescription]);
	    };

	    RTCPeerConnection.prototype.setRemoteDescription = function (sessionDescription,
	        successCallback, errorCallback) {
	        this.remoteDescription = sessionDescription.dict;
	        exec(successCallback, errorCallback, 'WebRTCPlugin',
	            'rtcPeerConnectionSetRemoteDescription', [this.id, sessionDescription]);
	    };

	    RTCPeerConnection.prototype.addStream = function (stream) {
	        exec(null, null, 'WebRTCPlugin',
	            'rtcPeerConnectionAddStream', [this.id, stream.id]);
	    };

	    RTCPeerConnection.prototype.removeStream = function (stream) {
	        exec(null, null, 'WebRTCPlugin',
	            'rtcPeerConnectionRemoveStream', [this.id, stream.id]);
	    };

	    RTCPeerConnection.prototype.getStats = function (cb) {
	        exec(function (nativeResultArray) {
	            var returnArray = [];
	            nativeResultArray.forEach(function (nativeResultStat) {
	                returnArray.push({
	                    type: nativeResultStat.type,
	                    timestamp: nativeResultStat.timestamp,
	                    id: nativeResultStat.reportId,
	                    names: function () {
	                        return Object.keys(nativeResultStat.values);
	                    },
	                    stat: function (key) {
	                        return nativeResultStat.values[key] || '';
	                    }
	                });
	            });
	            cb({
	                result: function () {
	                    return returnArray;
	                },
	                namedItem: function () {
	                    throw 'namedItem not implemented';
	                }
	            });
	        }, null, 'WebRTCPlugin', 'rtcPeerConnectionGetStats', [this.id]);
	    };

	    RTCPeerConnection.prototype.close = function () {
	        exec(null, null, 'WebRTCPlugin', 'rtcPeerConnectionClose', [this.id]);
	    };

	    RTCPeerConnection.prototype.dispose = function () {
	        exec(null, null, 'WebRTCPlugin', 'rtcPeerConnectionDispose', [this.id]);
	        this.onaddstream = null;
	        this.onremovestream = null;
	        this.onicecandidate = null;
	        this.ondatachannel = null;
	        this.oniceconnectionstatechange = null;
	        this.onsignalingstatechange = null;
	    };

	    module.exports = RTCPeerConnection;
	})(this);

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Remotium, Inc. 2014 All Rights Reserved
	 * Jose Pereira <jose@remotium.com>
	 *
	 * Implementation of RTCDataChannel
	 */
	(function (global) {
	    'use strict';

	    var exec = __webpack_require__(6);
	    var RTCUtils = __webpack_require__(7);

	    var InnerRTCDataChannel = function (pc, label, dataChannelDict) {
	        if (arguments.length === 2) {
	            //if we only supplied one argument, we're attaching an already
	            // existant data channel (label=id)
	            exec(this._oncommand.bind(this), null, 'WebRTCPlugin',
	                'dataChannelAttach', [pc, label]);
	        } else {
	            exec(this._oncommand.bind(this), null, 'WebRTCPlugin',
	                'dataChannelCreate', [pc.id, label, dataChannelDict || {}]);
	        }
	    };

	    InnerRTCDataChannel.prototype._oncommand = function (res) {
	        if (res._ready !== undefined) {
	            this.id = res._ready;
	        } else if (res.cmd === 'statechange') {
	            //update state before callbacks
	            this.readyState = res.args.state;

	            if (res.args.state === 'open') {
	                RTCUtils.createEventAndTrigger('open', res.args, this);
	            } else if (res.args.state === 'closed') {
	                RTCUtils.createEventAndTrigger('close', res.args, this);
	            }
	        } else if (res instanceof ArrayBuffer || typeof res === 'string') {
	            //we got a message when res is an arraybuffer or literal string
	            RTCUtils.createEventAndTrigger('message', {
	                data: res
	            }, this);
	        }
	    };

	    InnerRTCDataChannel.prototype.readyState = 'closed';

	    InnerRTCDataChannel.prototype.send = function (buffer) {
	        exec(null, null, 'WebRTCPlugin', 'dataChannelSend', [this.id, buffer]);
	    };

	    InnerRTCDataChannel.prototype.close = function () {
	        exec(null, null, 'WebRTCPlugin', 'dataChannelClose', [this.id]);
	    };

	    module.exports = InnerRTCDataChannel;
	})(this);

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("cordova/exec");

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Remotium, Inc. 2014 All Rights Reserved
	 * Jose Pereira <jose@remotium.com>
	 *
	 * Utilities
	 *
	 */
	(function (global) {
	    'use strict';

	    var RTCUtils = {
	        createEventAndTrigger: function (type, args, target) {
	            if (typeof target['on' + type] === 'function') {
	                var event = document.createEvent('Event');
	                event.initEvent(type, true, true);

	                //extend the event
	                for (var key in args) {
	                    if (args.hasOwnProperty(key)) {
	                        event[key] = args[key];
	                    }
	                }

	                setTimeout(function () {
	                    target['on' + type](event);
	                });
	            }
	        },
	        blobContent: function (blob, cb) {
	            //use a fileReader to convert the blob contents to string
	            var fileReader = new FileReader();
	            fileReader.onload = function () {
	                var res = String.fromCharCode.apply(null, new Uint8Array(this.result));
	                cb(this.error, res);
	            };
	            fileReader.onerror = function () {
	                cb(this.error, null);
	            };
	            fileReader.readAsArrayBuffer(blob);
	        }
	    };

	    module.exports = RTCUtils;
	})(this);

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Remotium, Inc. 2014 All Rights Reserved
	 * Jose Pereira <jose@remotium.com>
	 *
	 * Implementation of MediaStream.
	 * Extended as a Blob, as we want to have compatibility with URL.createObjectURL
	 * which only seems compatible with File and Blob.
	 */
	(function (global) {
	    'use strict';

	    var MediaStream;
	    if (window.Blob && !window.WebKitBlobBuilder) {
	        MediaStream = Blob;
	    } else {
	        MediaStream = function () {};
	    }

	    MediaStream.prototype.getAudioTracks = function () {
	        return this.audioTracks;
	    };

	    MediaStream.prototype.getVideoTracks = function () {
	        return this.videoTracks;
	    };

	    module.exports = MediaStream;
	})(this);

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * Copyright 2012 The Polymer Authors. All rights reserved.
	 * Use of this source code is goverened by a BSD-style
	 * license that can be found in the LICENSE file.
	 */

	(function(global) {

	  var registrationsTable = new WeakMap();

	  // We use setImmediate or postMessage for our future callback.
	  var setImmediate = window.msSetImmediate;

	  // Use post message to emulate setImmediate.
	  if (!setImmediate) {
	    var setImmediateQueue = [];
	    var sentinel = String(Math.random());
	    window.addEventListener('message', function(e) {
	      if (e.data === sentinel) {
	        var queue = setImmediateQueue;
	        setImmediateQueue = [];
	        queue.forEach(function(func) {
	          func();
	        });
	      }
	    });
	    setImmediate = function(func) {
	      setImmediateQueue.push(func);
	      window.postMessage(sentinel, '*');
	    };
	  }

	  // This is used to ensure that we never schedule 2 callas to setImmediate
	  var isScheduled = false;

	  // Keep track of observers that needs to be notified next time.
	  var scheduledObservers = [];

	  /**
	   * Schedules |dispatchCallback| to be called in the future.
	   * @param {MutationObserver} observer
	   */
	  function scheduleCallback(observer) {
	    scheduledObservers.push(observer);
	    if (!isScheduled) {
	      isScheduled = true;
	      setImmediate(dispatchCallbacks);
	    }
	  }

	  function wrapIfNeeded(node) {
	    return window.ShadowDOMPolyfill &&
	        window.ShadowDOMPolyfill.wrapIfNeeded(node) ||
	        node;
	  }

	  function dispatchCallbacks() {
	    // http://dom.spec.whatwg.org/#mutation-observers

	    isScheduled = false; // Used to allow a new setImmediate call above.

	    var observers = scheduledObservers;
	    scheduledObservers = [];
	    // Sort observers based on their creation UID (incremental).
	    observers.sort(function(o1, o2) {
	      return o1.uid_ - o2.uid_;
	    });

	    var anyNonEmpty = false;
	    observers.forEach(function(observer) {

	      // 2.1, 2.2
	      var queue = observer.takeRecords();
	      // 2.3. Remove all transient registered observers whose observer is mo.
	      removeTransientObserversFor(observer);

	      // 2.4
	      if (queue.length) {
	        observer.callback_(queue, observer);
	        anyNonEmpty = true;
	      }
	    });

	    // 3.
	    if (anyNonEmpty)
	      dispatchCallbacks();
	  }

	  function removeTransientObserversFor(observer) {
	    observer.nodes_.forEach(function(node) {
	      var registrations = registrationsTable.get(node);
	      if (!registrations)
	        return;
	      registrations.forEach(function(registration) {
	        if (registration.observer === observer)
	          registration.removeTransientObservers();
	      });
	    });
	  }

	  /**
	   * This function is used for the "For each registered observer observer (with
	   * observer's options as options) in target's list of registered observers,
	   * run these substeps:" and the "For each ancestor ancestor of target, and for
	   * each registered observer observer (with options options) in ancestor's list
	   * of registered observers, run these substeps:" part of the algorithms. The
	   * |options.subtree| is checked to ensure that the callback is called
	   * correctly.
	   *
	   * @param {Node} target
	   * @param {function(MutationObserverInit):MutationRecord} callback
	   */
	  function forEachAncestorAndObserverEnqueueRecord(target, callback) {
	    for (var node = target; node; node = node.parentNode) {
	      var registrations = registrationsTable.get(node);

	      if (registrations) {
	        for (var j = 0; j < registrations.length; j++) {
	          var registration = registrations[j];
	          var options = registration.options;

	          // Only target ignores subtree.
	          if (node !== target && !options.subtree)
	            continue;

	          var record = callback(options);
	          if (record)
	            registration.enqueue(record);
	        }
	      }
	    }
	  }

	  var uidCounter = 0;

	  /**
	   * The class that maps to the DOM MutationObserver interface.
	   * @param {Function} callback.
	   * @constructor
	   */
	  function JsMutationObserver(callback) {
	    this.callback_ = callback;
	    this.nodes_ = [];
	    this.records_ = [];
	    this.uid_ = ++uidCounter;
	  }

	  JsMutationObserver.prototype = {
	    observe: function(target, options) {
	      target = wrapIfNeeded(target);

	      // 1.1
	      if (!options.childList && !options.attributes && !options.characterData ||

	          // 1.2
	          options.attributeOldValue && !options.attributes ||

	          // 1.3
	          options.attributeFilter && options.attributeFilter.length &&
	              !options.attributes ||

	          // 1.4
	          options.characterDataOldValue && !options.characterData) {

	        throw new SyntaxError();
	      }

	      var registrations = registrationsTable.get(target);
	      if (!registrations)
	        registrationsTable.set(target, registrations = []);

	      // 2
	      // If target's list of registered observers already includes a registered
	      // observer associated with the context object, replace that registered
	      // observer's options with options.
	      var registration;
	      for (var i = 0; i < registrations.length; i++) {
	        if (registrations[i].observer === this) {
	          registration = registrations[i];
	          registration.removeListeners();
	          registration.options = options;
	          break;
	        }
	      }

	      // 3.
	      // Otherwise, add a new registered observer to target's list of registered
	      // observers with the context object as the observer and options as the
	      // options, and add target to context object's list of nodes on which it
	      // is registered.
	      if (!registration) {
	        registration = new Registration(this, target, options);
	        registrations.push(registration);
	        this.nodes_.push(target);
	      }

	      registration.addListeners();
	    },

	    disconnect: function() {
	      this.nodes_.forEach(function(node) {
	        var registrations = registrationsTable.get(node);
	        for (var i = 0; i < registrations.length; i++) {
	          var registration = registrations[i];
	          if (registration.observer === this) {
	            registration.removeListeners();
	            registrations.splice(i, 1);
	            // Each node can only have one registered observer associated with
	            // this observer.
	            break;
	          }
	        }
	      }, this);
	      this.records_ = [];
	    },

	    takeRecords: function() {
	      var copyOfRecords = this.records_;
	      this.records_ = [];
	      return copyOfRecords;
	    }
	  };

	  /**
	   * @param {string} type
	   * @param {Node} target
	   * @constructor
	   */
	  function MutationRecord(type, target) {
	    this.type = type;
	    this.target = target;
	    this.addedNodes = [];
	    this.removedNodes = [];
	    this.previousSibling = null;
	    this.nextSibling = null;
	    this.attributeName = null;
	    this.attributeNamespace = null;
	    this.oldValue = null;
	  }

	  function copyMutationRecord(original) {
	    var record = new MutationRecord(original.type, original.target);
	    record.addedNodes = original.addedNodes.slice();
	    record.removedNodes = original.removedNodes.slice();
	    record.previousSibling = original.previousSibling;
	    record.nextSibling = original.nextSibling;
	    record.attributeName = original.attributeName;
	    record.attributeNamespace = original.attributeNamespace;
	    record.oldValue = original.oldValue;
	    return record;
	  };

	  // We keep track of the two (possibly one) records used in a single mutation.
	  var currentRecord, recordWithOldValue;

	  /**
	   * Creates a record without |oldValue| and caches it as |currentRecord| for
	   * later use.
	   * @param {string} oldValue
	   * @return {MutationRecord}
	   */
	  function getRecord(type, target) {
	    return currentRecord = new MutationRecord(type, target);
	  }

	  /**
	   * Gets or creates a record with |oldValue| based in the |currentRecord|
	   * @param {string} oldValue
	   * @return {MutationRecord}
	   */
	  function getRecordWithOldValue(oldValue) {
	    if (recordWithOldValue)
	      return recordWithOldValue;
	    recordWithOldValue = copyMutationRecord(currentRecord);
	    recordWithOldValue.oldValue = oldValue;
	    return recordWithOldValue;
	  }

	  function clearRecords() {
	    currentRecord = recordWithOldValue = undefined;
	  }

	  /**
	   * @param {MutationRecord} record
	   * @return {boolean} Whether the record represents a record from the current
	   * mutation event.
	   */
	  function recordRepresentsCurrentMutation(record) {
	    return record === recordWithOldValue || record === currentRecord;
	  }

	  /**
	   * Selects which record, if any, to replace the last record in the queue.
	   * This returns |null| if no record should be replaced.
	   *
	   * @param {MutationRecord} lastRecord
	   * @param {MutationRecord} newRecord
	   * @param {MutationRecord}
	   */
	  function selectRecord(lastRecord, newRecord) {
	    if (lastRecord === newRecord)
	      return lastRecord;

	    // Check if the the record we are adding represents the same record. If
	    // so, we keep the one with the oldValue in it.
	    if (recordWithOldValue && recordRepresentsCurrentMutation(lastRecord))
	      return recordWithOldValue;

	    return null;
	  }

	  /**
	   * Class used to represent a registered observer.
	   * @param {MutationObserver} observer
	   * @param {Node} target
	   * @param {MutationObserverInit} options
	   * @constructor
	   */
	  function Registration(observer, target, options) {
	    this.observer = observer;
	    this.target = target;
	    this.options = options;
	    this.transientObservedNodes = [];
	  }

	  Registration.prototype = {
	    enqueue: function(record) {
	      var records = this.observer.records_;
	      var length = records.length;

	      // There are cases where we replace the last record with the new record.
	      // For example if the record represents the same mutation we need to use
	      // the one with the oldValue. If we get same record (this can happen as we
	      // walk up the tree) we ignore the new record.
	      if (records.length > 0) {
	        var lastRecord = records[length - 1];
	        var recordToReplaceLast = selectRecord(lastRecord, record);
	        if (recordToReplaceLast) {
	          records[length - 1] = recordToReplaceLast;
	          return;
	        }
	      } else {
	        scheduleCallback(this.observer);
	      }

	      records[length] = record;
	    },

	    addListeners: function() {
	      this.addListeners_(this.target);
	    },

	    addListeners_: function(node) {
	      var options = this.options;
	      if (options.attributes)
	        node.addEventListener('DOMAttrModified', this, true);

	      if (options.characterData)
	        node.addEventListener('DOMCharacterDataModified', this, true);

	      if (options.childList)
	        node.addEventListener('DOMNodeInserted', this, true);

	      if (options.childList || options.subtree)
	        node.addEventListener('DOMNodeRemoved', this, true);
	    },

	    removeListeners: function() {
	      this.removeListeners_(this.target);
	    },

	    removeListeners_: function(node) {
	      var options = this.options;
	      if (options.attributes)
	        node.removeEventListener('DOMAttrModified', this, true);

	      if (options.characterData)
	        node.removeEventListener('DOMCharacterDataModified', this, true);

	      if (options.childList)
	        node.removeEventListener('DOMNodeInserted', this, true);

	      if (options.childList || options.subtree)
	        node.removeEventListener('DOMNodeRemoved', this, true);
	    },

	    /**
	     * Adds a transient observer on node. The transient observer gets removed
	     * next time we deliver the change records.
	     * @param {Node} node
	     */
	    addTransientObserver: function(node) {
	      // Don't add transient observers on the target itself. We already have all
	      // the required listeners set up on the target.
	      if (node === this.target)
	        return;

	      this.addListeners_(node);
	      this.transientObservedNodes.push(node);
	      var registrations = registrationsTable.get(node);
	      if (!registrations)
	        registrationsTable.set(node, registrations = []);

	      // We know that registrations does not contain this because we already
	      // checked if node === this.target.
	      registrations.push(this);
	    },

	    removeTransientObservers: function() {
	      var transientObservedNodes = this.transientObservedNodes;
	      this.transientObservedNodes = [];

	      transientObservedNodes.forEach(function(node) {
	        // Transient observers are never added to the target.
	        this.removeListeners_(node);

	        var registrations = registrationsTable.get(node);
	        for (var i = 0; i < registrations.length; i++) {
	          if (registrations[i] === this) {
	            registrations.splice(i, 1);
	            // Each node can only have one registered observer associated with
	            // this observer.
	            break;
	          }
	        }
	      }, this);
	    },

	    handleEvent: function(e) {
	      // Stop propagation since we are managing the propagation manually.
	      // This means that other mutation events on the page will not work
	      // correctly but that is by design.
	      e.stopImmediatePropagation();

	      switch (e.type) {
	        case 'DOMAttrModified':
	          // http://dom.spec.whatwg.org/#concept-mo-queue-attributes

	          var name = e.attrName;
	          var namespace = e.relatedNode.namespaceURI;
	          var target = e.target;

	          // 1.
	          var record = new getRecord('attributes', target);
	          record.attributeName = name;
	          record.attributeNamespace = namespace;

	          // 2.
	          var oldValue =
	              e.attrChange === MutationEvent.ADDITION ? null : e.prevValue;

	          forEachAncestorAndObserverEnqueueRecord(target, function(options) {
	            // 3.1, 4.2
	            if (!options.attributes)
	              return;

	            // 3.2, 4.3
	            if (options.attributeFilter && options.attributeFilter.length &&
	                options.attributeFilter.indexOf(name) === -1 &&
	                options.attributeFilter.indexOf(namespace) === -1) {
	              return;
	            }
	            // 3.3, 4.4
	            if (options.attributeOldValue)
	              return getRecordWithOldValue(oldValue);

	            // 3.4, 4.5
	            return record;
	          });

	          break;

	        case 'DOMCharacterDataModified':
	          // http://dom.spec.whatwg.org/#concept-mo-queue-characterdata
	          var target = e.target;

	          // 1.
	          var record = getRecord('characterData', target);

	          // 2.
	          var oldValue = e.prevValue;


	          forEachAncestorAndObserverEnqueueRecord(target, function(options) {
	            // 3.1, 4.2
	            if (!options.characterData)
	              return;

	            // 3.2, 4.3
	            if (options.characterDataOldValue)
	              return getRecordWithOldValue(oldValue);

	            // 3.3, 4.4
	            return record;
	          });

	          break;

	        case 'DOMNodeRemoved':
	          this.addTransientObserver(e.target);
	          // Fall through.
	        case 'DOMNodeInserted':
	          // http://dom.spec.whatwg.org/#concept-mo-queue-childlist
	          var target = e.relatedNode;
	          var changedNode = e.target;
	          var addedNodes, removedNodes;
	          if (e.type === 'DOMNodeInserted') {
	            addedNodes = [changedNode];
	            removedNodes = [];
	          } else {

	            addedNodes = [];
	            removedNodes = [changedNode];
	          }
	          var previousSibling = changedNode.previousSibling;
	          var nextSibling = changedNode.nextSibling;

	          // 1.
	          var record = getRecord('childList', target);
	          record.addedNodes = addedNodes;
	          record.removedNodes = removedNodes;
	          record.previousSibling = previousSibling;
	          record.nextSibling = nextSibling;

	          forEachAncestorAndObserverEnqueueRecord(target, function(options) {
	            // 2.1, 3.2
	            if (!options.childList)
	              return;

	            // 2.2, 3.3
	            return record;
	          });

	      }

	      clearRecords();
	    }
	  };

	  global.JsMutationObserver = JsMutationObserver;

	  if (!global.MutationObserver)
	    global.MutationObserver = JsMutationObserver;


	})(this);


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * Copyright 2012 The Polymer Authors. All rights reserved.
	 * Use of this source code is governed by a BSD-style
	 * license that can be found in the LICENSE file.
	 */

	if (typeof WeakMap === 'undefined') {
	  (function() {
	    var defineProperty = Object.defineProperty;
	    var counter = Date.now() % 1e9;

	    var WeakMap = function() {
	      this.name = '__st' + (Math.random() * 1e9 >>> 0) + (counter++ + '__');
	    };

	    WeakMap.prototype = {
	      set: function(key, value) {
	        var entry = key[this.name];
	        if (entry && entry[0] === key)
	          entry[1] = value;
	        else
	          defineProperty(key, this.name, {value: [key, value], writable: true});
	        return this;
	      },
	      get: function(key) {
	        var entry;
	        return (entry = key[this.name]) && entry[0] === key ?
	            entry[1] : undefined;
	      },
	      delete: function(key) {
	        var entry = key[this.name];
	        if (!entry) return false;
	        var hasValue = entry[0] === key;
	        entry[0] = entry[1] = undefined;
	        return hasValue;
	      },
	      has: function(key) {
	        var entry = key[this.name];
	        if (!entry) return false;
	        return entry[0] === key;
	      }
	    };

	    window.WeakMap = WeakMap;
	  })();
	}


/***/ }
/******/ ])
});
