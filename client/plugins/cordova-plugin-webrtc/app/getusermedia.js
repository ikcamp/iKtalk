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

    var exec = require('cordova/exec'),
        RTCUtils = require('./rtcutils.js'),
        MediaStream = require('./mediastream.js');

    //weakmap is a MutationObservers dependency without CommonJS/AMD support.
    //We load it here to make itself available to global namespace.
    //MutationObserver on the other hand is loaded to variable.
    require('WeakMap');
    var MutationObserver = window.MutationObserver ||
        require('MutationObservers').MutationObserver;

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