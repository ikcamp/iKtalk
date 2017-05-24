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