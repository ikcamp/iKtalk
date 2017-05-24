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