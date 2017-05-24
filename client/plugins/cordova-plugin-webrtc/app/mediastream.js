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