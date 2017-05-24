#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>
#import "RTCEAGLVideoView.h"
#import "RTCPeerConnectionFactory.h"
#import "RTCPeerConnectionDelegate.h"
#import "RTCSessionDescriptionDelegate.h"
#import "RTCStatsDelegate.h"
#import "RTCDataChannel.h"

@interface WebRTCPlugin : CDVPlugin<RTCPeerConnectionDelegate>

@property NSMutableDictionary *globalCallbackId;
@property NSMutableDictionary *rtcPeerConnections;
@property NSMutableDictionary *mediaStreams;
@property NSMutableDictionary *dataChannels;
@property NSMutableDictionary *videoViews;
//we need to keep a strong reference to delegates otherwise they'll disappear.
@property NSMutableDictionary *dataChannelDelegates;

@property RTCPeerConnectionFactory *rtcPeerConnectionFactory;
@property int latestMediaStreamId;
@property int latestDataChannelId;
@property dispatch_queue_t queue;
@end

@interface CDVRTCCustomDelegate : NSObject
@property NSString *callbackId;
@property CDVPlugin *plugin;
- (id)initWithPlugin:(CDVPlugin *)plugin callbackId:(NSString *)callbackId;
@end

@interface CDVRTCDataChannelDelegate : CDVRTCCustomDelegate<RTCDataChannelDelegate>
- (void)channelDidChangeState:(RTCDataChannel*)channel;
- (void)channel:(RTCDataChannel*)channel
didReceiveMessageWithBuffer:(RTCDataBuffer*)buffer;
@end

@interface CDVRTCSessionDescriptionDelegate : CDVRTCCustomDelegate<RTCSessionDescriptionDelegate>
- (void)peerConnection:(RTCPeerConnection *)peerConnection didSetSessionDescriptionWithError:(NSError *)error;
- (void)peerConnection:(RTCPeerConnection *)peerConnection didCreateSessionDescription:(RTCSessionDescription *)sdp error:(NSError *)error;
@end

@interface CDVRTCStatsDelegate : CDVRTCCustomDelegate<RTCStatsDelegate>
- (void)peerConnection:(RTCPeerConnection*)peerConnection didGetStats:(NSArray*)stats;
@end
