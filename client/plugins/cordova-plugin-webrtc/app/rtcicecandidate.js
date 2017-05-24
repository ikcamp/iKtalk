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