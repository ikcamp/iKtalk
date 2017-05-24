/**
 * Remotium, Inc. 2014 All Rights Reserved
 * Jose Pereira <jose@remotium.com>
 *
 * Implementation of RTCDataChannel
 */
(function (global) {
    'use strict';

    var exec = require('cordova/exec');
    var RTCUtils = require('./rtcutils.js');

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