//
//  WebRTCPlugin.m
//  remotiumstreamtest
//
//  Created by Jose Pereira on 9/2/14.
//
//

#import "WebRTCPlugin.h"

#import "RTCPeerConnectionFactory.h"
#import "RTCPeerConnection.h"
#import "RTCMediaConstraints.h"
#import "RTCPair.h"
#import "RTCMediaStream.h"
#import "RTCSessionDescription.h"
#import "RTCICECandidate.h"
#import "RTCICEServer.h"
#import "RTCVideoCapturer.h"
#import "RTCEAGLVideoView.h"
#import "RTCVideoTrack.h"
#import "RTCAudioTrack.h"
#import "RTCStatsReport.h"

#import <AVFoundation/AVFoundation.h>

@implementation WebRTCPlugin

-(CDVPlugin *)initWithWebView:(UIWebView *)theWebView
{

    self = [super initWithWebView:theWebView];
    if (self) {
        [RTCPeerConnectionFactory initializeSSL];
        [self initMaps];
        _rtcPeerConnectionFactory = [[RTCPeerConnectionFactory alloc] init];
        _latestMediaStreamId = 0;
        _latestDataChannelId = 0;
        _queue = dispatch_queue_create("com.remotium.cordova.webrtc",
                                       DISPATCH_QUEUE_SERIAL);

        self.webView.opaque = NO;
        self.webView.backgroundColor = [UIColor clearColor];
        self.webView.superview.backgroundColor = [UIColor blackColor];
    }
    return self;
}

-(void)initMaps {
    _globalCallbackId =  [NSMutableDictionary dictionary];
    _rtcPeerConnections = [NSMutableDictionary dictionary];
    _mediaStreams = [NSMutableDictionary dictionary];
    _dataChannels = [NSMutableDictionary dictionary];
    _dataChannelDelegates = [NSMutableDictionary dictionary];
    _rtcPeerConnectionFactory = [[RTCPeerConnectionFactory alloc] init];
    _videoViews = [NSMutableDictionary dictionary];
}

-(void)dealloc {
    [NSNotificationCenter.defaultCenter removeObserver:self];
}

- (RTCMediaConstraints*) constraintsFromArg: (NSDictionary *) arg {
    if (arg.class == NSNull.class) {
        return nil;
    }

    NSDictionary *dMandatory = arg[@"mandatory"];
    NSDictionary *dOptional = arg[@"optional"];

    NSMutableArray *aMandatory = [NSMutableArray array];
    NSMutableArray *aOptional = [NSMutableArray array];

    for (NSString *key in dMandatory) {
        //check if we have a boolean or a dictionary
        NSString *sValue;
        if ([dMandatory[key] isEqual:@YES]) {
            sValue = dMandatory[key] ? @"true": @"false";
        } else {
            sValue = [NSString stringWithFormat:@"%@", dMandatory[key]];
        }
        [aMandatory addObject:[[RTCPair alloc] initWithKey:key value:sValue]];
    }

    for (NSString *key in dOptional) {
        NSString *sValue;
        if ([dOptional[key] isEqual:@YES]) {
            sValue = dOptional[key] ? @"true": @"false";
        } else {
            sValue = [NSString stringWithFormat:@"%@", dOptional[key]];
        }
        [aOptional addObject:[[RTCPair alloc] initWithKey:key value:sValue]];
    }

    return [[RTCMediaConstraints alloc] initWithMandatoryConstraints:aMandatory
                                                 optionalConstraints:aOptional];
}


- (NSArray *)iceServersFromArg: (NSDictionary *)arg {
    if (arg.class == NSNull.class) {
        return nil;
    }

    NSMutableArray *iceServers = [NSMutableArray array];
    NSArray *aServers = arg[@"iceServers"];

    for (NSDictionary *server in aServers) {
        NSURL *uri = [NSURL URLWithString:server[@"url"]];
        RTCICEServer *iceServer = [[RTCICEServer alloc] initWithURI:uri
                                                           username:server[@"username"]
                                                           password:server[@"credential"]];

        [iceServers addObject:iceServer];
    }
    return iceServers;
}

- (NSNumber *) addMediaStream:(RTCMediaStream *)mediaStream {
    NSNumber *streamId = @(++_latestMediaStreamId);
    _mediaStreams[streamId] = mediaStream;
    return streamId;
}

- (void) removeMediaStream:(RTCMediaStream *)mediaStream {
    for (NSNumber *key in _mediaStreams) {
        if (_mediaStreams[key] == mediaStream)
            [_mediaStreams removeObjectForKey:mediaStream];
    }
}

- (RTCMediaStream *) mediaStreamForId: (NSNumber *)mediaStreamID {
    return _mediaStreams[mediaStreamID];
}

- (NSNumber *) idForMediaStream: (RTCMediaStream *)mediaStream {
    for (NSNumber *key in _mediaStreams) {
        if (_mediaStreams[key] == mediaStream)
            return key;
    }
    return nil;
}

- (RTCPeerConnection *) peerConnectionForId: (NSNumber *)rtcId {
    return _rtcPeerConnections[rtcId];
}

- (NSNumber *) idForPeerConnection: (RTCPeerConnection *)peerConnection {
    for (NSNumber *key in _rtcPeerConnections) {
        if (_rtcPeerConnections[key] == peerConnection)
            return key;
    }
    return nil;
}

- (RTCDataChannel *) dataChannelForId: (NSNumber *)dataChannelId {
    return _dataChannels[dataChannelId];
}

- (NSNumber *) idForDataChannel: (RTCDataChannel *)dataChannel {
    for (NSNumber *key in _dataChannels) {
        if (_dataChannels[key] == dataChannel)
            return key;
    }
    return nil;
}


-(void)onReset {
    _latestMediaStreamId = 0;
    _latestDataChannelId = 0;

    for (id rtcPeerConnectionId in _rtcPeerConnections) {
        [self disposeRtcPeerConnectionWithId:rtcPeerConnectionId];
    }
    [_videoViews removeAllObjects];
    [_dataChannels removeAllObjects];
    [_dataChannelDelegates removeAllObjects];
    [_mediaStreams removeAllObjects];
    [_rtcPeerConnections removeAllObjects];
    [_globalCallbackId removeAllObjects];
}

-(void) disposeRtcPeerConnectionWithId:(id)rtcPeerConnectionId {
    RTCPeerConnection *rtcPeerConnection =
    [self peerConnectionForId:rtcPeerConnectionId];

    for (id streamId in rtcPeerConnection.localStreams) {
        RTCMediaStream *mediaStream = _mediaStreams[streamId];
        for (RTCVideoTrack *videoTrack in mediaStream.videoTracks) {
            RTCEAGLVideoView *videoView = _videoViews[streamId];
            [videoTrack removeRenderer:videoView];
            [mediaStream removeVideoTrack:videoTrack];
        }
        for (RTCAudioTrack *audioTrack in mediaStream.audioTracks) {
            [mediaStream removeAudioTrack:audioTrack];
        }
        [rtcPeerConnection removeStream:mediaStream];

        for (id streamId in _videoViews) {
            RTCEAGLVideoView *videoView = _videoViews[streamId];
            [videoView removeFromSuperview];
        }
    }

    [_dataChannels removeObjectForKey:rtcPeerConnectionId];
    [_dataChannelDelegates removeObjectForKey:rtcPeerConnectionId];

    [_rtcPeerConnections removeObjectForKey:rtcPeerConnection];
}

- (void)rtcPeerConnection_new:(CDVInvokedUrlCommand*)command {
    dispatch_async(_queue, ^{
        NSNumber *peerConnectionId = command.arguments[0];
        NSArray *servers = [self iceServersFromArg:command.arguments[1]];
        NSMutableDictionary *dConstraints = [NSMutableDictionary dictionary];
        if ([command.arguments[2] class] != NSNull.class) {
            dConstraints = [command.arguments[2] mutableCopy];
        }

        //make sure we use DTLS as required by most modern browsers.
        //TODO make it as default value, but not enforce it.
        [dConstraints addEntriesFromDictionary:@{
                                                 @"mandatory": @{
                                                         @"DtlsSrtpKeyAgreement": @YES
                                                         }
                                                 }];

        RTCMediaConstraints *constraints = [self constraintsFromArg:dConstraints];

        RTCPeerConnection *rtcPeerConnection = [_rtcPeerConnectionFactory
                                                peerConnectionWithICEServers:servers
                                                constraints:constraints
                                                delegate:self];
        _rtcPeerConnections[peerConnectionId] = rtcPeerConnection;
        _globalCallbackId[peerConnectionId] = command.callbackId;
        _dataChannelDelegates[peerConnectionId] = [NSArray array];
    });
}

-(void)rtcPeerConnectionCreateOffer:(CDVInvokedUrlCommand *)command {
    dispatch_async(_queue, ^{
        RTCPeerConnection *rtcPeerConnection = [self peerConnectionForId:command.arguments[0]];
        RTCMediaConstraints *constraints = [self constraintsFromArg:command.arguments[1]];
        [rtcPeerConnection createOfferWithDelegate:
         [[CDVRTCSessionDescriptionDelegate alloc] initWithPlugin:self
                                                       callbackId:command.callbackId]
                                       constraints:constraints];
    });
}

-(void)rtcPeerConnectionCreateAnswer:(CDVInvokedUrlCommand *)command {
    dispatch_async(_queue, ^{
        RTCPeerConnection *rtcPeerConnection = [self peerConnectionForId:command.arguments[0]];
        RTCMediaConstraints *constraints = [self constraintsFromArg:command.arguments[1]];
        [rtcPeerConnection createAnswerWithDelegate:
         [[CDVRTCSessionDescriptionDelegate alloc] initWithPlugin:self
                                                       callbackId:command.callbackId]
                                        constraints:constraints];
    });
}

-(void)rtcPeerConnectionAddIceCandidate:(CDVInvokedUrlCommand *)command {
    dispatch_async(_queue, ^{
        RTCPeerConnection *rtcPeerConnection = [self peerConnectionForId:command.arguments[0]];
        NSDictionary *dCandidate = command.arguments[1];

        NSString *mid = dCandidate[@"sdpMid"];
        NSString *sdp = dCandidate[@"candidate"];
        NSInteger sdlMLineIndex = [dCandidate[@"sdpMLineIndex"] intValue];

        RTCICECandidate *candidate = [[RTCICECandidate alloc] initWithMid:mid index:sdlMLineIndex sdp:sdp];

        [rtcPeerConnection addICECandidate:candidate];
    });
}

- (void)rtcPeerConnectionUpdateIce:(CDVInvokedUrlCommand *)command {
    dispatch_async(_queue, ^{
        RTCPeerConnection *rtcPeerConnection = [self peerConnectionForId:command.arguments[0]];
        NSArray *servers = [self iceServersFromArg:command.arguments[1]];
        RTCMediaConstraints *constraints = [self constraintsFromArg:command.arguments[2]];

        [rtcPeerConnection updateICEServers:servers constraints:constraints];
    });
}

- (void)rtcPeerConnectionSetLocalDescription:(CDVInvokedUrlCommand*)command {
    dispatch_async(_queue, ^{
        RTCPeerConnection *rtcPeerConnection = [self peerConnectionForId:command.arguments[0]];
        NSDictionary *dSdp = command.arguments[1];

        RTCSessionDescription *sdp = [[RTCSessionDescription alloc] initWithType:dSdp[@"type"]
                                                                             sdp:dSdp[@"sdp"]];

        [rtcPeerConnection setLocalDescriptionWithDelegate:
         [[CDVRTCSessionDescriptionDelegate alloc] initWithPlugin:self
                                                       callbackId:command.callbackId]
                                        sessionDescription:sdp];
    });
}

- (void)rtcPeerConnectionSetRemoteDescription:(CDVInvokedUrlCommand*)command {
    dispatch_async(_queue, ^{
        RTCPeerConnection *rtcPeerConnection = [self peerConnectionForId:command.arguments[0]];
        NSDictionary *dSdp = command.arguments[1];

        RTCSessionDescription *sdp = [[RTCSessionDescription alloc] initWithType:dSdp[@"type"]
                                                                             sdp:dSdp[@"sdp"]];

        [rtcPeerConnection setRemoteDescriptionWithDelegate:
         [[CDVRTCSessionDescriptionDelegate alloc] initWithPlugin:self
                                                       callbackId:command.callbackId]

                                         sessionDescription:sdp];
    });
}

- (void)rtcPeerConnectionAddStream:(CDVInvokedUrlCommand*)command {
    dispatch_async(_queue, ^{
        RTCPeerConnection *rtcPeerConnection = [self peerConnectionForId:command.arguments[0]];
        //    RTCMediaStream *mediaStream = [self mediaStreamForId:command.arguments[1]];
        RTCMediaStream *mediaStream = [self mediaStreamForId:@0];

        [rtcPeerConnection addStream:mediaStream];
    });
}

- (void)rtcPeerConnectionRemoveStream:(CDVInvokedUrlCommand*)command {
    dispatch_async(_queue, ^{
        RTCPeerConnection *rtcPeerConnection = [self peerConnectionForId:command.arguments[0]];
        RTCMediaStream *mediaStream = [self mediaStreamForId:command.arguments[1]];

        [rtcPeerConnection removeStream:mediaStream];
    });
}

- (void)rtcPeerConnectionGetStats:(CDVInvokedUrlCommand*)command {
    dispatch_async(_queue, ^{
        NSNumber *peerConnectionId = command.arguments[0];
        RTCPeerConnection *rtcPeerConnection = [self peerConnectionForId:peerConnectionId];
        CDVRTCStatsDelegate *del = [[CDVRTCStatsDelegate alloc] initWithPlugin:self callbackId:command.callbackId];
        [rtcPeerConnection getStatsWithDelegate:del mediaStreamTrack:nil statsOutputLevel:RTCStatsOutputLevelStandard];
    });
}

- (void) addVideoStreamSrc:(CDVInvokedUrlCommand*)command {
    dispatch_async(_queue, ^{
        NSNumber *streamId = command.arguments[0];
        RTCMediaStream *stream = [self mediaStreamForId:streamId];

        NSDictionary *layoutParams = command.arguments[1];
        NSNumber *videoTrackVisible = command.arguments[2];

        NSLog(@"addVideoStreamSrc %@", layoutParams);

        dispatch_async(dispatch_get_main_queue(), ^{
            if (stream.videoTracks.count) {
                RTCEAGLVideoView *videoView = [[RTCEAGLVideoView alloc] init];
                videoView.hidden = !videoTrackVisible;
                [self setViewPosition:videoView position:layoutParams];
                //                videoView.frame = [UIScreen mainScreen].bounds;
                videoView.autoresizingMask = (UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight);

                //                [self.webView.superview insertSubview:videoView belowSubview:self.webView];
                [self.webView.superview addSubview:videoView];

                [stream.videoTracks[0] addRenderer:videoView];
                _videoViews[streamId] = videoView;
            }
        });
    });
}

- (void) removeVideoStreamSrc:(CDVInvokedUrlCommand*)command {
    dispatch_async(_queue, ^{
        NSNumber *streamId = command.arguments[0];
        NSLog(@"removeVideoStreamSrc %@", streamId);
        dispatch_async(dispatch_get_main_queue(), ^{
            RTCEAGLVideoView *videoView = _videoViews[streamId];
            if (videoView) {
                RTCMediaStream *stream = [self mediaStreamForId:streamId];
                [stream.videoTracks[0] removeRenderer:videoView];
                [videoView removeFromSuperview];
                [_videoViews removeObjectForKey:streamId];
            }
        });
    });
}

- (void) setVideoStreamPosition:(CDVInvokedUrlCommand*)command {
    dispatch_async(_queue, ^{
        NSNumber *streamId = command.arguments[0];
        NSDictionary *layoutParams = command.arguments[1];

        if (_videoViews[streamId]) {
            [self setViewPosition:_videoViews[streamId] position:layoutParams];
        }
    });
}

- (void) setVideoStreamVisibility:(CDVInvokedUrlCommand*)command {
    dispatch_async(_queue, ^{
        NSNumber *streamId = command.arguments[0];
        NSNumber *visible = command.arguments[1];

        if (_videoViews[streamId]) {
            ((UIView *)_videoViews[streamId]).hidden = !visible;
        }
    });
}

- (void) setViewPosition:(UIView *)view position:(NSDictionary *)position {
    view.frame = CGRectMake([position[@"x"] intValue],
                            [position[@"y"] intValue],
                            [position[@"width"] intValue],
                            [position[@"height"] intValue]);
}

- (void) getUserMedia:(CDVInvokedUrlCommand*)command {
    dispatch_async(_queue, ^{
        NSDictionary *dConstraints = command.arguments[0];

        RTCMediaStream *mediaStream = [_rtcPeerConnectionFactory
                                       mediaStreamWithLabel:@"webrtc"];
        NSNumber *streamId = [self addMediaStream:mediaStream];

        RTCVideoTrack *videoTrack;
        RTCAudioTrack *audioTrack;
        NSArray *jsVideoTracks = [NSArray array];
        NSArray *jsAudioTracks = [NSArray array];

        //check if we have video constraints
        if ((dConstraints[@"video"] != nil) &&
            (![dConstraints[@"video"] isEqual:@NO])){

            RTCMediaConstraints *constraints = nil;

            if (![dConstraints[@"video"] isEqual:@YES]) {
                constraints = [self constraintsFromArg:dConstraints[@"video"]];
            }

            NSString* cameraID = nil;
            for (AVCaptureDevice* captureDevice in
                 [AVCaptureDevice devicesWithMediaType:AVMediaTypeVideo]) {
                // TODO: Make this camera option configurable
                if (captureDevice.position == AVCaptureDevicePositionFront) {
                    cameraID = captureDevice.localizedName;
                    break;
                }
            }
            if (!cameraID) {
                NSLog(@"Could not get camera device");
                //return the stream id
                CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                            messageAsString:@"Could not get camera device"];
                [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
                return;
            } else {
                RTCVideoCapturer *capturer = [RTCVideoCapturer capturerWithDeviceName:cameraID];
                RTCVideoSource* videoSource = [_rtcPeerConnectionFactory videoSourceWithCapturer:capturer
                                                                                     constraints:constraints];
                videoTrack = [_rtcPeerConnectionFactory videoTrackWithID:@"videotrack1" source:videoSource];
                [mediaStream addVideoTrack:videoTrack];
                jsVideoTracks = @[@{
                                      @"kind": videoTrack.kind,
                                      @"id": @(0), //TODO
                                      @"label": videoTrack.label,
                                      @"enabled": @YES,
                                      @"muted": @NO
                                      }];
            }
        }

        //check if we have audio constraints
        if ((dConstraints[@"audio"] != nil) &&
            (![dConstraints[@"audio"] isEqual: @NO])) {
            //TODO i think obj-c wrapper forgot to add constraints

            RTCMediaConstraints *constraints = nil;

            if (![dConstraints[@"audio"] isEqual:@YES]) {
                constraints = [self constraintsFromArg:dConstraints[@"audio"]];
            }

            audioTrack = [_rtcPeerConnectionFactory
                          audioTrackWithID:@"audiotrack1"];
            //todo javascript addtrack callback
            [mediaStream addAudioTrack:audioTrack];
            jsAudioTracks = @[@{
                                  @"kind": audioTrack.kind,
                                  @"id": @(0), //TODO
                                  @"label": audioTrack.label,
                                  @"enabled": @YES,
                                  @"muted": @NO
                                  }];
        }


        NSDictionary *dict = @{
                               @"id": streamId,
                               @"audioTracks": jsAudioTracks,
                               @"videoTracks": jsVideoTracks
                               };

        //return the stream id
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                messageAsDictionary:dict];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    });
}

- (void)dataChannelCreate:(CDVInvokedUrlCommand *)command {
    dispatch_async(_queue, ^{
        NSNumber *peerConnectionId = command.arguments[0];
        RTCPeerConnection *rtcPeerConnection = [self peerConnectionForId:peerConnectionId];
        NSString *label = command.arguments[1];
        NSDictionary *dDataChannelInit = command.arguments[2];

        RTCDataChannelInit *dataChannelInit = [[RTCDataChannelInit alloc] init];

        if (dDataChannelInit[@"ordered"])
            dataChannelInit.isOrdered = [dDataChannelInit[@"ordered"] boolValue];
        if (dDataChannelInit[@"maxRetransmitTime"])
            dataChannelInit.maxRetransmitTimeMs = [dDataChannelInit[@"maxRetransmitTime"] intValue];
        if (dDataChannelInit[@"maxRetransmits"])
            dataChannelInit.maxRetransmits = [dDataChannelInit[@"maxRetransmits"] intValue];
        if (dDataChannelInit[@"negotiated"])
            dataChannelInit.isNegotiated = [dDataChannelInit[@"negotiated"] boolValue];
        if (dDataChannelInit[@"id"])
            dataChannelInit.streamId = [dDataChannelInit[@"id"] intValue];
        if (dDataChannelInit[@"protocol"])
            dataChannelInit.protocol = dDataChannelInit[@"protocol"];

        RTCDataChannel *dataChannel = [rtcPeerConnection createDataChannelWithLabel:label config:dataChannelInit];
        _dataChannelDelegates[peerConnectionId] = [[CDVRTCDataChannelDelegate alloc] initWithPlugin:self callbackId:command.callbackId];

        NSNumber *dataChannelId = @(++_latestDataChannelId);
        //send back datachannel id.
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                messageAsDictionary:@{
                                                                      @"_ready": dataChannelId
                                                                      }];
        result.keepCallback = @YES;
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
        dataChannel.delegate = _dataChannelDelegates[peerConnectionId];
        _dataChannels[dataChannelId] = dataChannel;
    });
}

- (void)dataChannelAttach:(CDVInvokedUrlCommand *)command {
    dispatch_async(_queue, ^{
        NSNumber *peerConnectionId = command.arguments[0];
        NSNumber *dataChannelId = command.arguments[1];
        RTCDataChannel *dataChannel = [self dataChannelForId:dataChannelId];
        //send back datachannel id.
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                messageAsDictionary:@{
                                                                      @"_ready": dataChannelId
                                                                      }];
        result.keepCallback = @YES;
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
        _dataChannelDelegates[peerConnectionId] = [[CDVRTCDataChannelDelegate alloc] initWithPlugin:self
                                                                                         callbackId:command.callbackId];
        dataChannel.delegate = _dataChannelDelegates[peerConnectionId];
        _dataChannels[dataChannelId] = dataChannel;
    });
}

- (void) dataChannelSend:(CDVInvokedUrlCommand*)command {
    dispatch_async(_queue, ^{
        RTCDataChannel *dataChannel = [self dataChannelForId:command.arguments[0]];

        //at this point we only support sending NSString (non-binary) or NSData (binary)
        NSData *buffer;
        bool isBinary;

        if ([command.arguments[1] isKindOfClass:NSData.class]) {
            buffer = command.arguments[1];
            isBinary = YES;
        } else if ([command.arguments[1] isKindOfClass:NSString.class]) {
            buffer = [command.arguments[1] dataUsingEncoding:NSUTF8StringEncoding];
            isBinary = NO;
        } else {
            [NSException raise:@"Invalid buffer for send data channel" format:nil];
        }

        [dataChannel sendData:[[RTCDataBuffer alloc] initWithData:buffer
                                                         isBinary:isBinary]];
    });
}

- (void) dataChannelClose:(CDVInvokedUrlCommand*)command {
    dispatch_async(_queue, ^{
        RTCDataChannel *dataChannel = [self dataChannelForId:command.arguments[0]];
        [dataChannel close];
    });
}

- (void)rtcPeerConnectionClose:(CDVInvokedUrlCommand*)command {
    dispatch_async(_queue, ^{
        NSNumber *peerConnectionId = command.arguments[0];
        RTCPeerConnection *rtcPeerConnection = [self peerConnectionForId:peerConnectionId];
        [rtcPeerConnection close];
        //remove strong reference to the data channel callbacks
        [_dataChannelDelegates removeObjectForKey:peerConnectionId];
    });
}

- (void) rtcPeerConnectionDispose:(CDVInvokedUrlCommand*)command {
    dispatch_async(_queue, ^{
        [self disposeRtcPeerConnectionWithId:command.arguments[0]];
    });
}

// --------------- callbacks

- (void) returnCallback:(RTCPeerConnection *)peerConnection callbackDict:(NSDictionary *)callbackDict {
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                            messageAsDictionary:callbackDict];
    result.keepCallback = @YES;

    NSNumber *peerConnectionId = [self idForPeerConnection:peerConnection];
    [self.commandDelegate sendPluginResult:result callbackId:_globalCallbackId[peerConnectionId]];
}

// Triggered when there is an error.
- (void)peerConnectionOnError:(RTCPeerConnection *)peerConnection {
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
    result.keepCallback = @YES;
    NSNumber *peerConnectionId = [self idForPeerConnection:peerConnection];
    [self.commandDelegate sendPluginResult:result callbackId:_globalCallbackId[peerConnectionId]];
}

// Triggered when the SignalingState changed.
- (void)peerConnection:(RTCPeerConnection *)peerConnection
 signalingStateChanged:(RTCSignalingState)stateChanged {

    NSString *state = @"unknown";
    if (stateChanged == RTCSignalingStable)
        state = @"stable";
    else if (stateChanged == RTCSignalingHaveLocalOffer)
        state = @"have-local-offer";
    else if (stateChanged == RTCSignalingHaveLocalPrAnswer)
        state = @"have-local-pranswer";
    else if (stateChanged == RTCSignalingHaveRemoteOffer)
        state = @"have-remote-offer";
    else if (stateChanged == RTCSignalingHaveRemotePrAnswer)
        state = @"have-remove-pranswer";
    else if (stateChanged == RTCSignalingClosed)
        state = @"closed";
    else
        NSLog(@"Unknown signaling state!");

    NSLog(@"signalingStateChanged %@", state);

    [self returnCallback:peerConnection callbackDict:@{@"cmd": @"signalingstatechange",
                                                       @"args": @{
                                                               @"state": state}
                                                       }];
}

// Triggered when media is received on a new stream from remote peer.
- (void)peerConnection:(RTCPeerConnection *)peerConnection
           addedStream:(RTCMediaStream *)stream {
    NSLog(@"addedStream");

    //add stream to stream list
    NSNumber *streamId = [self addMediaStream:stream];

    [self returnCallback:peerConnection callbackDict:@{@"cmd": @"addstream",
                                                       @"args": @{
                                                               @"stream": streamId}
                                                       }];
}

// Triggered when a remote peer close a stream.
- (void)peerConnection:(RTCPeerConnection *)peerConnection
         removedStream:(RTCMediaStream *)stream {
    NSLog(@"removedStream");

    [self removeMediaStream:stream];

    //XXX do we need to send the stream id?
    [self returnCallback:peerConnection callbackDict:@{@"cmd": @"removestream"}];
}

// Triggered when renegotiation is needed, for example the ICE has restarted.
- (void)peerConnectionOnRenegotiationNeeded:(RTCPeerConnection *)peerConnection {
    [self returnCallback:peerConnection callbackDict:@{@"cmd": @"negotiationneeded"}];
}

// Called any time the ICEConnectionState changes.
- (void)peerConnection:(RTCPeerConnection *)peerConnection
  iceConnectionChanged:(RTCICEConnectionState)newState {

    NSString *state;
    if (newState == RTCICEConnectionNew)
        state = @"new";
    else if (newState == RTCICEConnectionChecking)
        state = @"checking";
    else if (newState == RTCICEConnectionConnected)
        state = @"connected";
    else if (newState == RTCICEConnectionCompleted)
        state = @"completed";
    else if (newState == RTCICEConnectionFailed)
        state = @"failed";
    else if (newState == RTCICEConnectionDisconnected)
        state = @"disconnected";
    else if (newState == RTCICEConnectionClosed)
        state = @"closed";
    else
        NSLog(@"Unknown signaling state!");

    [self returnCallback:peerConnection callbackDict:@{@"cmd": @"iceconnectionstatechange",
                                                       @"args": @{
                                                               @"state": state}
                                                       }];
}

// Called any time the ICEGatheringState changes.
- (void)peerConnection:(RTCPeerConnection *)peerConnection
   iceGatheringChanged:(RTCICEGatheringState)newState {

    NSString *state;
    if (newState == RTCICEGatheringNew)
        state = @"new";
    else if (newState == RTCICEGatheringGathering)
        state = @"gathering";
    else if (newState == RTCICEGatheringComplete)
        state = @"complete";
    else
        NSLog(@"Unknown ice gathering state!");

    NSLog(@"iceGatheringChanged %@", state);

    [self returnCallback:peerConnection callbackDict:@{@"cmd": @"icegatheringchange",
                                                       @"args": @{
                                                               @"state":state
                                                               }
                                                       }];


    //if we just got all ice candidates, send icecandidate callback with no candidate
    //to make the behaviour consistent with chrome.
    if (newState == RTCICEGatheringComplete)
        [self peerConnection:peerConnection gotICECandidate:nil];
}

// New Ice candidate have been found.
- (void)peerConnection:(RTCPeerConnection *)peerConnection
       gotICECandidate:(RTCICECandidate *)candidate {

    NSDictionary *dCandidate;
    if (candidate) {
        dCandidate= @{@"sdpMid": candidate.sdpMid,
                      @"candidate": candidate.sdp,
                      @"sdpMLineIndex": @(candidate.sdpMLineIndex)};
    } else {
        //candidate might be null for the last ice candidate callback.
        dCandidate = (NSDictionary *) [NSNull null];
    }

    [self returnCallback:peerConnection callbackDict:@{@"cmd": @"icecandidate",
                                                       @"eventtype": @"RTCIceCandidateEvent",
                                                       @"args": @{
                                                               @"candidate": dCandidate}
                                                       }];
}

// New data channel has been opened.
- (void)peerConnection:(RTCPeerConnection*)peerConnection
    didOpenDataChannel:(RTCDataChannel*)dataChannel {

    NSNumber *dataChannelId = @(++_latestDataChannelId);
    _dataChannels[dataChannelId] = dataChannel;

    //send back datachannel id.
    [self returnCallback:peerConnection callbackDict:@{@"cmd": @"datachannel",
                                                       @"args": @{
                                                               @"id": dataChannelId,
                                                               @"label": dataChannel.label,
                                                               @"ordered": @(dataChannel.isOrdered),
                                                               @"maxPacketLifeTime": @(dataChannel.maxRetransmitTime),
                                                               @"maxRetransmits": @(dataChannel.maxRetransmits),
                                                               @"protocol": dataChannel.protocol,
                                                               //@"negotiated":
                                                               @"readyState": @"open",
                                                               @"bufferedAmount": @(dataChannel.bufferedAmount),
                                                               }
                                                       }];
}

@end


@implementation CDVRTCCustomDelegate
@synthesize callbackId;
@synthesize plugin;

- (id)initWithPlugin:(CDVPlugin *)_plugin callbackId:(NSString *)_callbackId {
    if (self = [super init]) {
        plugin = _plugin;
        callbackId = _callbackId;
    }
    return self;
}

- (void) returnCallback:(CDVCommandStatus)status result:(id)result {

    CDVPluginResult *cdvResult;
    if ([result isKindOfClass:NSDictionary.class]) {
        cdvResult = [CDVPluginResult resultWithStatus:status messageAsDictionary:result];
    } else if ([result isKindOfClass:NSArray.class]) {
        cdvResult = [CDVPluginResult resultWithStatus:status messageAsArray:result];
    } else if ([result isKindOfClass:NSData.class]) {
        cdvResult = [CDVPluginResult resultWithStatus:status messageAsArrayBuffer:result];
    } else if ([result isKindOfClass:NSString.class]) {
        cdvResult = [CDVPluginResult resultWithStatus:status messageAsString:result];
    } else {
        [NSException raise:@"returnCallback with unknown type" format:nil];
    }

    cdvResult.keepCallback = @YES;
    [self.plugin.commandDelegate sendPluginResult:cdvResult callbackId:self.callbackId];
}

@end

@implementation CDVRTCDataChannelDelegate

//---------------- data channel delegate
// Called when the data channel state has changed.
- (void)channelDidChangeState:(RTCDataChannel*)channel {
    NSString *state = @"unknown";
    if (channel.state == kRTCDataChannelStateConnecting)
        state = @"connecting";
    else if (channel.state == kRTCDataChannelStateOpen)
        state = @"open";
    else if (channel.state == kRTCDataChannelStateClosing)
        state = @"closing";
    else if (channel.state == kRTCDataChannelStateClosed)
        state = @"closed";
    else
        NSLog(@"Unknown data channel state! %@", state);

    [self returnCallback:CDVCommandStatus_OK result:@{@"cmd": @"statechange",
                                                      @"args": @{
                                                              @"state":state
                                                              },
                                                      }];
}

// Called when a data buffer was successfully received.
- (void)channel:(RTCDataChannel*)channel didReceiveMessageWithBuffer:(RTCDataBuffer*)buffer {
    if (buffer.isBinary) {
        [self returnCallback:CDVCommandStatus_OK
                      result:buffer.data];
    } else {
        [self returnCallback:CDVCommandStatus_OK
                      result:[[NSString alloc] initWithData:buffer.data
                                                   encoding:NSUTF8StringEncoding]];
    }
}

@end

@implementation CDVRTCSessionDescriptionDelegate

// Called when creating a session.
- (void)peerConnection:(RTCPeerConnection *)peerConnection didCreateSessionDescription:(RTCSessionDescription *)sdp error:(NSError *)error {
    CDVCommandStatus status;
    NSDictionary *responseDict;

    if (!error) {
        status = CDVCommandStatus_OK;
        responseDict = @{@"sdp": sdp.description,
                         @"type": sdp.type};
    } else {
        NSLog(@"Error creating session description! %@", error);
        status = CDVCommandStatus_ERROR;
        responseDict = @{error: error.userInfo[@"error"]};
    }
    [self returnCallback:status result:responseDict];
}

// Called when setting a local or remote description.
- (void)peerConnection:(RTCPeerConnection *)peerConnection didSetSessionDescriptionWithError:(NSError *)error {
    CDVCommandStatus status;
    NSDictionary *responseDict;

    if (!error) {
        status = CDVCommandStatus_OK;
        responseDict = @{};
    } else {
        status = CDVCommandStatus_ERROR;
        responseDict = @{@"error": error.userInfo[@"error"]};
    }

    [self returnCallback:status result:responseDict];
}

@end

@implementation CDVRTCStatsDelegate

- (void)peerConnection:(RTCPeerConnection*)peerConnection didGetStats:(NSArray*)stats {
    NSMutableArray *jsStats = [NSMutableArray array];

    for (RTCStatsReport *stat in stats) {
        
        NSMutableDictionary *jsValues = [NSMutableDictionary dictionary];
        
        for (RTCPair *pair in stat.values)
            jsValues[pair.key] = pair.value;
        
        [jsStats addObject:@{
                             @"reportId": stat.reportId,
                             @"type": stat.type,
                             @"timestamp": @(stat.timestamp),
                             @"values": jsValues
                             }];
    }
    
    [self returnCallback:CDVCommandStatus_OK result:jsStats];
}

@end

