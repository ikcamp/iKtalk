/**
 * Remotium, Inc. 2014 All Rights Reserved
 * Jose Pereira <jose@remotium.com>
 *
 * Implementation of getUserMedia
 *
 */
(function (global) {
    'use strict';

    var exec = require('cordova/exec'),
        RTCDataChannel = require('./rtcdatachannel.js'),
        RTCUtils = require('./rtcutils.js');

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