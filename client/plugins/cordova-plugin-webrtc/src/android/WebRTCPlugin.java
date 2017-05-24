package com.remotium.cordova.webrtc;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.WeakHashMap;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.webrtc.AudioTrack;
import org.webrtc.DataChannel;
import org.webrtc.DataChannel.Buffer;
import org.webrtc.IceCandidate;
import org.webrtc.MediaConstraints;
import org.webrtc.MediaConstraints.KeyValuePair;
import org.webrtc.MediaStream;
import org.webrtc.PeerConnection;
import org.webrtc.PeerConnection.IceConnectionState;
import org.webrtc.PeerConnection.IceGatheringState;
import org.webrtc.PeerConnection.IceServer;
import org.webrtc.PeerConnection.SignalingState;
import org.webrtc.PeerConnectionFactory;
import org.webrtc.SdpObserver;
import org.webrtc.SessionDescription;
import org.webrtc.StatsObserver;
import org.webrtc.StatsReport;
import org.webrtc.VideoRenderer;
import org.webrtc.VideoRendererGui;

import android.annotation.SuppressLint;
import android.opengl.GLSurfaceView;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Log;
import android.util.SparseArray;
import android.view.View;
import android.view.ViewGroup;

@SuppressLint("DefaultLocale")
public class WebRTCPlugin extends CordovaPlugin {
	final static String TAG = WebRTCPlugin.class.getSimpleName();

	PeerConnectionFactory factory;
	GLSurfaceView surfaceView;

	SparseArray<PeerConnection> rtcPeerConnections = new SparseArray<PeerConnection>();
	SparseArray<MediaStream> rtcMediaStreams = new SparseArray<MediaStream>();
	Map<Integer, DataChannel> rtcDataChannels = new WeakHashMap<Integer, DataChannel>();
	SparseArray<VideoRenderer> rtcVideoViews = new SparseArray<VideoRenderer>();

	VideoRenderer.Callbacks videoRenderer;

	Handler handler;
	HandlerThread handlerThread;

	int latestMediaStreamId = 0;

	/**
	 * Initialize the plugin. We start a serial background thread that will process all
	 * incoming js messages, and
	 */
	@Override
	public void initialize(final CordovaInterface cordova, final CordovaWebView webView) {
		super.initialize(cordova, webView);
		if (factory != null) {
			return;
		} else {
			//create our background serial queue
			handlerThread = new HandlerThread(TAG);
			handlerThread.start();
			handler = new Handler(handlerThread.getLooper());
			handler.post(new Runnable() {
				@Override
				public void run() {
					surfaceView = new GLSurfaceView(cordova.getActivity());
					surfaceView.setVisibility(View.INVISIBLE);

					VideoRendererGui.setView(surfaceView);
					videoRenderer = VideoRendererGui.create(0, 0, 100, 100, VideoRendererGui.ScalingType.SCALE_FILL);

					//to show the webrtc view
					webView.setBackgroundColor(0x00000000);

					PeerConnectionFactory.initializeAndroidGlobals(cordova.getActivity(), true, false,
							VideoRendererGui.getEGLContext());
					factory = new PeerConnectionFactory();
				}
			});
		}
	}

	@Override
	public void onReset() {
		super.onReset();

		//clean up everything
		for(int i = 0; i < rtcVideoViews.size(); i++) {
			// get the object by the key.
			VideoRenderer videoView = rtcVideoViews.get(rtcVideoViews.keyAt(i));
			videoView.dispose();
		}
		rtcVideoViews.clear();


	    Iterator<DataChannel> it = rtcDataChannels.values().iterator();
	    while (it.hasNext()) {
			DataChannel dataChannel = it.next();
			dataChannel.close();
			dataChannel.dispose();
		}

		for(int i = 0; i < rtcPeerConnections.size(); i++) {
			// get the object by the key.
			PeerConnection peerConnection = rtcPeerConnections.get(rtcPeerConnections.keyAt(i));
			peerConnection.close();
			peerConnection.dispose();
		}
		rtcPeerConnections.clear();
		rtcMediaStreams.clear();
	}

	/**
	 * Returns key for specified value on the array.
	 * @param map The map to get the key from.
	 * @param value The associated value.
	 * @return The key, null if non existent.
	 */
	public static <K, T> K getKeyByValue(Map<K, T> map, T value) {
		Iterator<Entry<K, T>> it = map.entrySet().iterator();
		while (it.hasNext()) {
			Entry<K, T> pair = it.next();
			if (pair.getValue().equals(value)) {
				return pair.getKey();
			}
		}
		return null;
	}

	/**
	 * Builds a list of {@link IceServer} from the passed in dictionary.
	 * The dictionary shall have an array with key 'iceServers',
	 * each server has url, username and credential.
	 */
	List<IceServer> iceServersFromArg(JSONObject arg) throws JSONException {
		List<IceServer> iceServers = new ArrayList<IceServer>();
		JSONArray aServers = arg.getJSONArray("iceServers");

		for (int i=0; i<aServers.length(); i++) {
			JSONObject server = aServers.getJSONObject(i);
			IceServer iceServer = new IceServer(server.getString("url"),
					server.getString("username"), server.getString("credential"));

			iceServers.add(iceServer);
		}
		return iceServers;
	}

	MediaConstraints constraintsFromArg(JSONObject arg) throws JSONException {
		JSONObject dMandatory = arg.optJSONObject("mandatory");
		JSONObject dOptional = arg.optJSONObject("optional");

		MediaConstraints constraints = new MediaConstraints();

		if (dMandatory != null) {
			Iterator<?> keys = dMandatory.keys();
			while (keys.hasNext()) {
				String key = (String)keys.next();
				String sValue;
				if (dMandatory.get(key).equals(true)) {
					sValue = dMandatory.getBoolean(key) ? "true": "false";
				} else {
					sValue = dMandatory.getString(key);
				}
				constraints.mandatory.add(new KeyValuePair(key, sValue));
			}
		}
		if (dOptional != null) {
			Iterator<?> keys = dOptional.keys();
			while (keys.hasNext()) {
				String key = (String)keys.next();
				String sValue;
				if (dOptional.get(key).equals(true)) {
					sValue = dMandatory.getBoolean(key) ? "true": "false";
				} else {
					sValue = dMandatory.getString(key);
				}
				constraints.optional.add(new KeyValuePair(key, sValue));
			}
		}

		return constraints;
	}

	class WebRTCCordovaPluginResponse {
		private CallbackContext callbackContext;

		WebRTCCordovaPluginResponse(CallbackContext callbackContext) {
			this.callbackContext = callbackContext;
		}

		void callback(boolean success, boolean keepCallback) {
			PluginResult result = new PluginResult(success ? PluginResult.Status.OK : PluginResult.Status.ERROR);
			result.setKeepCallback(keepCallback);
			callbackContext.sendPluginResult(result);
		}

		void callback(boolean success, boolean keepCallback, JSONObject dict) {
			PluginResult result = new PluginResult(success ? PluginResult.Status.OK : PluginResult.Status.ERROR,
					dict);
			result.setKeepCallback(keepCallback);
			callbackContext.sendPluginResult(result);
		}

		void callback(boolean success, boolean keepCallback, byte[] buffer) {
			PluginResult result = new PluginResult(success ? PluginResult.Status.OK : PluginResult.Status.ERROR,
					buffer);
			result.setKeepCallback(keepCallback);
			callbackContext.sendPluginResult(result);
		}

		void callback(boolean success, boolean keepCallback, int code) {
			PluginResult result = new PluginResult(success ? PluginResult.Status.OK : PluginResult.Status.ERROR,
					code);
			result.setKeepCallback(keepCallback);
			callbackContext.sendPluginResult(result);
		}

		void callback(boolean success, boolean keepCallback, String message) {
			PluginResult result = new PluginResult(success ? PluginResult.Status.OK : PluginResult.Status.ERROR,
					message);
			result.setKeepCallback(keepCallback);
			callbackContext.sendPluginResult(result);
		}
	}

	class PeerConnectionCallback extends WebRTCCordovaPluginResponse implements PeerConnection.Observer {
		PeerConnectionCallback(CallbackContext callbackContext) {
			super(callbackContext);
		}

		@Override
		public void onSignalingChange(SignalingState state) {
			try {
				String stateStr = state.toString().toLowerCase();
				JSONObject response = new JSONObject();
				response.put("cmd", "signalingstatechange");
				JSONObject args = new JSONObject();
				args.put("state", stateStr);
				response.put("args", args);
				callback(true, true, response);
			} catch(JSONException e) {
				e.printStackTrace();
			}
		}

		@Override
		public void onRenegotiationNeeded() {
			try {
				JSONObject response = new JSONObject();
				response.put("cmd", "negotiationneeded");
				callback(true, true, response);
			} catch(JSONException e) {
				e.printStackTrace();
			}
		}

		@Override
		public void onRemoveStream(MediaStream stream) {
			// TODO REMOVE ACTUAL STREAM
			//    [self removeMediaStream:stream];
			try {

				stream.videoTracks.get(0).dispose();

				JSONObject response = new JSONObject();
				response.put("cmd", "removestream");
				callback(true, true, response);
			} catch(JSONException e) {
				e.printStackTrace();
			}
		}

		@Override
		public void onIceGatheringChange(IceGatheringState state) {
			try {
				String stateStr = state.toString().toLowerCase();
				JSONObject response = new JSONObject();
				response.put("cmd", "icegatheringchange");
				JSONObject args = new JSONObject();
				args.put("state", stateStr);
				response.put("args", args);
				callback(true, true, response);
			} catch(JSONException e) {
				e.printStackTrace();
			}

			//if we just got all ice candidates, send icecandidate callback with no candidate
			//to make the behaviour consistent with chrome.
			if (state == IceGatheringState.COMPLETE) {
				onIceCandidate(null);
			}
		}

		@Override
		public void onIceConnectionChange(IceConnectionState state) {
			try {
				String stateStr = state.toString().toLowerCase();
				JSONObject response = new JSONObject();
				response.put("cmd", "iceconnectionstatechange");
				JSONObject args = new JSONObject();
				args.put("state", stateStr);
				response.put("args", args);
				callback(true, true, response);
			} catch(JSONException e) {
				e.printStackTrace();
			}
		}

		@Override
		public void onIceCandidate(IceCandidate candidate) {
			try {
				JSONObject dCandidate = null;
				if (candidate != null) {
					dCandidate = new JSONObject();
					dCandidate.put("sdpMid", candidate.sdpMid);
					dCandidate.put("candidate", candidate.sdp);
					dCandidate.put("sdpMLineIndex", candidate.sdpMLineIndex);
				} else {
					//candidate might be null for the last ice candidate callback.
				}

				JSONObject response = new JSONObject();
				response.put("cmd", "icecandidate");
				response.put("eventtype", "RTCIceCandidateEvent");
				JSONObject args = new JSONObject();
				args.put("candidate", dCandidate);
				response.put("args", args);
				callback(true, true, response);
			} catch (JSONException e) {
				e.printStackTrace();
			}
		}

		@Override
		public void onDataChannel(DataChannel dataChannel) {
			Integer dataChannelId = getKeyByValue(rtcDataChannels, dataChannel);
			if (dataChannelId == null) {
				Log.e(TAG, "Unknown data channel!");
				return;
			}

			try {
				JSONObject response = new JSONObject();
				response.put("cmd", "datachannel");
				JSONObject args = new JSONObject();
				args.put("datachannel", dataChannelId);
				response.put("args", args);
				callback(true, true, response);
			} catch (JSONException e) {
				e.printStackTrace();
			}
		}

		@Override
		public void onAddStream(MediaStream mediaStream) {
			try {
				rtcMediaStreams.put(++latestMediaStreamId, mediaStream);

				JSONObject response = new JSONObject();
				response.put("cmd", "addstream");
				JSONObject args = new JSONObject();
				args.put("stream", latestMediaStreamId);
				response.put("args", args);
				callback(true, true, response);
			} catch (JSONException e) {
				e.printStackTrace();
			}
		}
	}

	void rtcPeerConnection_new(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					Integer peerConnectionId = args.getInt(0);
					List<IceServer> iceServers = iceServersFromArg(args.getJSONObject(1));

					JSONObject dConstraints = args.getJSONObject(2);
					//make sure we use DTLS as required by most modern browsers.
					//TODO make it as default value, but not enforce it.
					JSONObject dMandatory = dConstraints.optJSONObject("mandatory");
					if (dMandatory == null) {
						dMandatory = new JSONObject();
					}
					dMandatory.put("DtlsSrtpKeyAgreement", true);
					dConstraints.put("mandatory", dMandatory);

					MediaConstraints constraints = constraintsFromArg(dConstraints);
					PeerConnection rtcPeerConnection = factory.createPeerConnection(
							iceServers, constraints, new PeerConnectionCallback(callbackContext));

					rtcPeerConnections.put(peerConnectionId, rtcPeerConnection);
				} catch (JSONException e) {
					e.printStackTrace();
				}
			}
		});
	}

	class SdpObserverImpl extends WebRTCCordovaPluginResponse implements SdpObserver {
		SdpObserverImpl(CallbackContext callbackContext) {
			super(callbackContext);
		}
		@Override
		public void onCreateSuccess(SessionDescription sdp) {
			try {
				JSONObject response = new JSONObject();
				response.put("sdp", sdp.description);
				response.put("type", sdp.type.canonicalForm());
				callback(true, false, response);
			} catch (JSONException e) {
				e.printStackTrace();
			}
		}

		@Override
		public void onCreateFailure(String error) {
			callback(false, false, error);
		}

		@Override
		public void onSetSuccess() {
			callback(true, false);
		}

		@Override
		public void onSetFailure(String error) {
			callback(false, false);
		}
	}

	void rtcPeerConnectionCreateOffer(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					PeerConnection pc = rtcPeerConnections.get(args.getInt(0));
					MediaConstraints constraints = constraintsFromArg(args.getJSONObject(1));
					pc.createOffer(new SdpObserverImpl(callbackContext), constraints);
				} catch (JSONException e) {
					e.printStackTrace();
				}
			};
		});
	}

	void rtcPeerConnectionCreateAnswer(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					PeerConnection pc = rtcPeerConnections.get(args.getInt(0));
					MediaConstraints constraints = constraintsFromArg(args.getJSONObject(1));
					pc.createAnswer(new SdpObserverImpl(callbackContext), constraints);
				} catch (JSONException e) {
					e.printStackTrace();
				}
			};
		});
	}

	void rtcPeerConnectionAddIceCandidate(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					PeerConnection pc = rtcPeerConnections.get(args.getInt(0));
					JSONObject dCandidate = args.getJSONObject(1);

					String sdpMid = dCandidate.getString("sdpMid");
					String sdp = dCandidate.getString("candidate");
					int sdlMLineIndex = dCandidate.getInt("sdpMLineIndex");

					IceCandidate candidate = new IceCandidate(sdpMid, sdlMLineIndex, sdp);
					pc.addIceCandidate(candidate);
				} catch (JSONException e) {
					e.printStackTrace();
				}
			};
		});
	}

	void rtcPeerConnectionUpdateIce(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					PeerConnection pc = rtcPeerConnections.get(args.getInt(0));
					List<IceServer> servers = iceServersFromArg(args.getJSONObject(1));
					MediaConstraints constraints = constraintsFromArg(args.getJSONObject(2));

					pc.updateIce(servers, constraints);
				} catch (JSONException e) {
					e.printStackTrace();
				}
			};
		});
	}

	class DataChannelCallback extends WebRTCCordovaPluginResponse implements DataChannel.Observer {
		DataChannel dataChannel;

		DataChannelCallback(DataChannel dataChannel, CallbackContext callbackContext) {
			super(callbackContext);
			this.dataChannel = dataChannel;
		}

		@Override
		public void onStateChange() {
			try {
				String stateStr = dataChannel.state().toString().toLowerCase();
				JSONObject response = new JSONObject();
				response.put("cmd", "statechange");
				JSONObject args = new JSONObject();
				args.put("state", stateStr);
				response.put("args", args);
				callback(true, true, response);
			} catch (JSONException e) {
				e.printStackTrace();
			}
		}

		@Override
		public void onMessage(Buffer buffer) {
			byte[] bbuffer = new byte[buffer.data.remaining()];
			buffer.data.get(bbuffer);

			callback(true, true, bbuffer);
		}
	}

	void rtcPeerConnectionCreateDataChannel(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					PeerConnection pc = rtcPeerConnections.get(args.getInt(0));
					int dataChannelId = args.getInt(1);
					String label = args.getString(2);
					JSONObject dDataChannelInit = args.getJSONObject(3);

					DataChannel.Init dataChannelInit = new DataChannel.Init();
					if (dDataChannelInit.has("ordered"))
						dataChannelInit.ordered = dDataChannelInit.getBoolean("ordered");
					if (dDataChannelInit.has("maxRetransmitTime"))
						dataChannelInit.maxRetransmitTimeMs = dDataChannelInit.getInt("maxRetransmitTime");
					if (dDataChannelInit.has("maxRetransmits"))
						dataChannelInit.maxRetransmits = dDataChannelInit.getInt("maxRetransmits");
					if (dDataChannelInit.has("negotiated"))
						dataChannelInit.negotiated = dDataChannelInit.getBoolean("negotiated");
					if (dDataChannelInit.has("id"))
						dataChannelInit.id = dDataChannelInit.getInt("id");
					if (dDataChannelInit.has("protocol"))
						dataChannelInit.protocol = dDataChannelInit.getString("protocol");

					DataChannel dataChannel = pc.createDataChannel(label, dataChannelInit);
					dataChannel.registerObserver(new DataChannelCallback(dataChannel, callbackContext));
					rtcDataChannels.put(dataChannelId, dataChannel);

				} catch (JSONException e) {
					e.printStackTrace();
				}
			};
		});
	}

	void rtcPeerConnectionSetLocalDescription(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					PeerConnection pc = rtcPeerConnections.get(args.getInt(0));
					JSONObject dSdp = args.getJSONObject(1);

					SessionDescription sdp = new SessionDescription(
							SessionDescription.Type.valueOf(dSdp.getString("type").toUpperCase()),
							dSdp.getString("sdp"));

					pc.setLocalDescription(new SdpObserverImpl(callbackContext), sdp);
				} catch (JSONException e) {
					e.printStackTrace();
				}
			};
		});
	}

	void rtcPeerConnectionSetRemoteDescription(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					PeerConnection pc = rtcPeerConnections.get(args.getInt(0));
					JSONObject dSdp = args.getJSONObject(1);

					SessionDescription sdp = new SessionDescription(
							SessionDescription.Type.valueOf(dSdp.getString("type").toUpperCase()),
							dSdp.getString("sdp"));

					pc.setRemoteDescription(new SdpObserverImpl(callbackContext), sdp);
				} catch (JSONException e) {
					e.printStackTrace();
				}
			};
		});
	}

	void rtcPeerConnectionAddStream(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					PeerConnection pc = rtcPeerConnections.get(args.getInt(0));
					MediaStream mediaStream = rtcMediaStreams.get(args.getInt(1));

					pc.addStream(mediaStream);
				} catch (JSONException e) {
					e.printStackTrace();
				}
			};
		});
	}

	void rtcPeerConnectionRemoveStream(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					PeerConnection pc = rtcPeerConnections.get(args.getInt(0));
					MediaStream mediaStream = rtcMediaStreams.get(args.getInt(1));

					pc.removeStream(mediaStream);
				} catch (JSONException e) {
					e.printStackTrace();
				}
			};
		});
	}

	void rtcPeerConnectionClose(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					for(int i = 0; i < rtcVideoViews.size(); i++) {
						// get the object by the key.
						VideoRenderer videoView = rtcVideoViews.get(rtcVideoViews.keyAt(i));
						videoView.dispose();
					}
					rtcVideoViews.clear();

					PeerConnection pc = rtcPeerConnections.get(args.getInt(0));
					pc.close();
				} catch (JSONException e) {
					e.printStackTrace();
				}
			};
		});
	}

	void rtcPeerConnectionDispose(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					int peerConnectionId = args.getInt(0);
					PeerConnection peerConnection = rtcPeerConnections.get(peerConnectionId);
					peerConnection.dispose();
					rtcPeerConnections.remove(peerConnectionId);
				} catch (JSONException e) {
					e.printStackTrace();
				}
			};
		});
	}

	void rtcPeerConnectionGetStats(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					PeerConnection pc = rtcPeerConnections.get(args.getInt(0));
					pc.getStats(new StatsObserver() {

						@Override
						public void onComplete(StatsReport[] stats) {
							try {

								JSONArray jsStats = new JSONArray();

								for (StatsReport stat: stats) {
									JSONObject jsStat = new JSONObject();
									JSONObject jsValues = new JSONObject();

									for (StatsReport.Value value: stat.values) {
										jsValues.put(value.name, value.value);
									}
									jsStat.put("reportId", stat.id);
									jsStat.put("type", stat.type);
									jsStat.put("timestamp", stat.timestamp);
									jsStat.put("values", jsValues);
									jsStats.put(jsStat);
								}

								PluginResult result = new PluginResult(PluginResult.Status.OK, jsStats);
								callbackContext.sendPluginResult(result);
							} catch (JSONException e) {
								e.printStackTrace();
							}
						}
					}, null);
				} catch (JSONException e) {
					e.printStackTrace();
				}
			};
		});
	}

	void addVideoStreamSrc(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					final int streamId = args.getInt(0);
					final MediaStream stream = rtcMediaStreams.get(streamId);

					final JSONObject layoutParams = args.getJSONObject(1);
					final boolean videoTrackVisible = args.getBoolean(2);

					cordova.getActivity().runOnUiThread(new Runnable() {
						@Override
						public void run() {
							//add view if not added yet

							if (surfaceView.getParent() == null) {
								//we add the webrtc surfaceview to the topmost view
								ViewGroup parent = (ViewGroup)webView.getRootView();
								//after adding the surfaceview we need to bring the webrtc parent to front

								parent.addView(surfaceView);
								//bring webview to front
								parent.getChildAt(0).bringToFront();
								parent.requestLayout();
							}

							//TODO set position of the view
							//the VideoRendererGui takes a 0-100 point relative to the view
							VideoRenderer videoView = new VideoRenderer(videoRenderer);
							rtcVideoViews.put(streamId, videoView);

							stream.videoTracks.get(0).addRenderer(videoView);

							if (stream.videoTracks.size() > 0) {
								surfaceView.setVisibility(View.VISIBLE);
							}
						}
					});
				} catch (JSONException e) {
					e.printStackTrace();
				}
			};
		});
	}

	void removeVideoStreamSrc(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					final int streamId = args.getInt(0);
					final MediaStream stream = rtcMediaStreams.get(streamId);

					VideoRenderer videoView = rtcVideoViews.get(streamId);
					if (videoView != null) {
						stream.videoTracks.get(0).removeRenderer(videoView);
						rtcVideoViews.remove(streamId);
						//videoView.dispose(); //TODO check if this works
					}

					cordova.getActivity().runOnUiThread(new Runnable() {
						@Override
						public void run() {
							//TODO only set invisible if all views are removed
							surfaceView.setVisibility(View.INVISIBLE);
						}
					});
				} catch (JSONException e) {
					e.printStackTrace();
				}
			};
		});
	}

	void setVideoStreamPosition(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
			};
		});
	}

	void setVideoStreamVisibility(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
			};
		});
	}

	void getUserMedia(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					JSONObject dConstraints = args.getJSONObject(0);

					MediaStream stream = factory.createLocalMediaStream("webrtc");
					rtcMediaStreams.put(++latestMediaStreamId, stream);

					//check if we have video constraints
					if (dConstraints.has("video") && !dConstraints.optBoolean("video")) {
						MediaConstraints constraints = new MediaConstraints();
						JSONObject videoConstraints = dConstraints.optJSONObject("video");
						if (videoConstraints == null && dConstraints.optBoolean("video")) {
							addVideoTrack(stream, constraints);
						} else if (videoConstraints != null) {
							constraints = constraintsFromArg(videoConstraints);
							addVideoTrack(stream, constraints);
						}
					}
					//check if we have audio constraints
					if (dConstraints.has("audio")) {
						MediaConstraints constraints = new MediaConstraints();
						JSONObject audioConstraints = dConstraints.optJSONObject("audio");
						if (audioConstraints == null && dConstraints.optBoolean("audio")) {
							addAudioTrack(stream, constraints);
						} else if (audioConstraints != null) {
							constraints = constraintsFromArg(audioConstraints);
							addAudioTrack(stream, constraints);
						}
					}

					callbackContext.success(latestMediaStreamId);
				} catch (JSONException e) {
					e.printStackTrace();
				}
			};
		});
	}

	boolean addVideoTrack(MediaStream stream, MediaConstraints constraints) {
		//TODO
		return true;
	}

	boolean addAudioTrack(MediaStream stream, MediaConstraints constraints) {
		AudioTrack audioTrack = factory.createAudioTrack("audiotrack1",
				factory.createAudioSource(constraints));
		if (audioTrack == null) {
			return false;
		}
		return stream.addTrack(audioTrack);
	}

	void dataChannelSend(final CordovaArgs args, final CallbackContext callbackContext) {
		handler.post(new Runnable() {
			@Override
			public void run() {
				try {
					DataChannel dataChannel = rtcDataChannels.get(args.getInt(0));
					byte[] buffer = args.getArrayBuffer(1);
					dataChannel.send(new Buffer(ByteBuffer.wrap(buffer), true));
				} catch (JSONException e) {
					e.printStackTrace();
				}
			};
		});
	}

	@Override
	public boolean execute(String action, CordovaArgs args,
			CallbackContext callbackContext) throws JSONException {
		Log.v(TAG, action);
		if (action.equals("rtcPeerConnection_new")) {
			rtcPeerConnection_new(args, callbackContext);
		} else if (action.equals("rtcPeerConnectionCreateOffer")) {
			rtcPeerConnectionCreateOffer(args, callbackContext);
		} else if (action.equals("rtcPeerConnectionCreateAnswer")) {
			rtcPeerConnectionCreateAnswer(args, callbackContext);
		} else if (action.equals("rtcPeerConnectionAddIceCandidate")) {
			rtcPeerConnectionAddIceCandidate(args, callbackContext);
		} else if (action.equals("rtcPeerConnectionUpdateIce")) {
			rtcPeerConnectionUpdateIce(args, callbackContext);
		} else if (action.equals("rtcPeerConnectionCreateDataChannel")) {
			rtcPeerConnectionCreateDataChannel(args, callbackContext);
		} else if (action.equals("rtcPeerConnectionSetLocalDescription")) {
			rtcPeerConnectionSetLocalDescription(args, callbackContext);
		} else if (action.equals("rtcPeerConnectionSetRemoteDescription")) {
			rtcPeerConnectionSetRemoteDescription(args, callbackContext);
		} else if (action.equals("rtcPeerConnectionAddStream")) {
			rtcPeerConnectionAddStream(args, callbackContext);
		} else if (action.equals("rtcPeerConnectionRemoveStream")) {
			rtcPeerConnectionRemoveStream(args, callbackContext);
		} else if (action.equals("rtcPeerConnectionClose")) {
			rtcPeerConnectionClose(args, callbackContext);
		} else if (action.equals("rtcPeerConnectionDispose")) {
			rtcPeerConnectionDispose(args, callbackContext);
		} else if (action.equals("rtcPeerConnectionGetStats")) {
			rtcPeerConnectionGetStats(args, callbackContext);
		} else if (action.equals("addVideoStreamSrc")) {
			addVideoStreamSrc(args, callbackContext);
		} else if (action.equals("removeVideoStreamSrc")) {
			removeVideoStreamSrc(args, callbackContext);
		} else if (action.equals("setVideoStreamPosition")) {
			setVideoStreamPosition(args, callbackContext);
		} else if (action.equals("setVideoStreamVisibility")) {
			setVideoStreamVisibility(args, callbackContext);
		} else if (action.equals("getUserMedia")) {
			getUserMedia(args, callbackContext);
		} else if (action.equals("dataChannelSend")) {
			dataChannelSend(args, callbackContext);
		} else {
			return super.execute(action, args, callbackContext);
		}

		return true;
	}

}
