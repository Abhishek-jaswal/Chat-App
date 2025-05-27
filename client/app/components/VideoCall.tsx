'use client';

import { useEffect, useRef, useState } from 'react';
import socket from '../socket';

export default function VideoCall({
  username,
  partner,
}: {
  username: string;
  partner: string;
}) {
  const [incomingCallFrom, setIncomingCallFrom] = useState<string | null>(null);
  const [inCall, setInCall] = useState(false);
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Send call request to partner
  const callPartner = () => {
    if (!partner) {
      alert('Select a partner to call');
      return;
    }
    console.log('[CALL] Sending call request to', partner);
    socket.emit('call-request', { from: username, to: partner });
  };

  // Accept call: notify backend and start WebRTC as callee
  const acceptCall = () => {
    if (!incomingCallFrom) return;
    console.log('[CALL] Accepting call from', incomingCallFrom);
    socket.emit('call-accepted', { from: incomingCallFrom, to: username });
    setIncomingCallFrom(null);
    setInCall(true);
  };

  // Decline call: notify backend and hide popup
  const declineCall = () => {
    if (!incomingCallFrom) return;
    console.log('[CALL] Declining call from', incomingCallFrom);
    socket.emit('call-declined', { from: incomingCallFrom, to: username });
    setIncomingCallFrom(null);
  };

  useEffect(() => {
    // Incoming call request
    socket.on('call-request', ({ from }) => {
      console.log('[CALL] Incoming call request from', from);
      if (from === partner) {
        setIncomingCallFrom(from);
      } else {
        console.log('[CALL] Incoming call from unknown user:', from);
      }
    });

    // Call accepted by partner (you are caller)
    socket.on('call-accepted', async ({ from }) => {
      console.log('[CALL] Call accepted by', from);
      if (from === partner) {
        setInCall(true);
        await startCall(true); // you are caller
      }
    });

    // Call declined by partner
    socket.on('call-declined', ({ from }) => {
      console.log('[CALL] Call declined by', from);
      if (from === partner) {
        alert(`${from} declined your call.`);
      }
    });

    // WebRTC signaling: offer from caller
    socket.on('call-made', async ({ offer, from }) => {
      console.log('[CALL] Received offer from', from);
      if (from === partner) {
        await handleOffer(offer, from);
      }
    });

    // WebRTC signaling: answer from callee
    socket.on('answer-made', async ({ answer, from }) => {
      console.log('[CALL] Received answer from', from);
      if (from === partner) {
        await peerRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // WebRTC signaling: ICE candidate
    socket.on('ice-candidate', ({ candidate }) => {
      console.log('[CALL] Received ICE candidate');
      if (candidate) {
        peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off('call-request');
      socket.off('call-accepted');
      socket.off('call-declined');
      socket.off('call-made');
      socket.off('answer-made');
      socket.off('ice-candidate');
    };
  }, [partner]);

  // Start WebRTC call: isCaller = true if initiating the call
  const startCall = async (isCaller = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;

      const peer = new RTCPeerConnection();
      peerRef.current = peer;

      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[CALL] Sending ICE candidate');
          socket.emit('ice-candidate', { candidate: event.candidate, to: partner });
        }
      };

      peer.ontrack = (event) => {
        if (remoteRef.current) {
          remoteRef.current.srcObject = event.streams[0];
          console.log('[CALL] Remote track received');
        }
      };

      if (isCaller) {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('call-user', { offer, to: partner });
        console.log('[CALL] Sent offer');
      }
    } catch (err) {
      console.error('[CALL] Error starting call', err);
    }
  };

  // Handle offer (callee side)
  const handleOffer = async (offer: RTCSessionDescriptionInit, from: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;

      const peer = new RTCPeerConnection();
      peerRef.current = peer;

      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[CALL] Sending ICE candidate (answer side)');
          socket.emit('ice-candidate', { candidate: event.candidate, to: from });
        }
      };

      peer.ontrack = (event) => {
        if (remoteRef.current) {
          remoteRef.current.srcObject = event.streams[0];
          console.log('[CALL] Remote track received (answer side)');
        }
      };

      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('make-answer', { answer, to: from });
      console.log('[CALL] Sent answer');
      setInCall(true);
    } catch (err) {
      console.error('[CALL] Error handling offer', err);
    }
  };

  const endCall = () => {
    console.log('[CALL] Ending call');
    peerRef.current?.close();
    streamRef.current?.getTracks().forEach(track => track.stop());
    setInCall(false);
  };

  return (
    <>
      <button
        onClick={callPartner}
        className="absolute top-4 right-4 bg-purple-600 px-4 py-2 rounded-md shadow text-white hover:bg-purple-700"
      >
        📹 Video Call
      </button>

      {incomingCallFrom && (
        <div className="absolute top-20 right-4 bg-white p-4 rounded shadow z-50">
          <p>{incomingCallFrom} is calling you</p>
          <button onClick={acceptCall} className="mr-2 bg-green-600 text-white px-3 py-1 rounded">
            Accept
          </button>
          <button onClick={declineCall} className="bg-red-600 text-white px-3 py-1 rounded">
            Decline
          </button>
        </div>
      )}

      {inCall && (
        <div className="absolute top-16 right-4 bg-black/80 p-4 rounded-xl z-50">
          <div className="flex gap-4">
            <video ref={localRef} autoPlay muted playsInline className="w-40 rounded-lg" />
            <video ref={remoteRef} autoPlay playsInline className="w-40 rounded-lg" />
          </div>
          <button
            onClick={endCall}
            className="mt-2 w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg text-white"
          >
            End Call
          </button>
        </div>
      )}
    </>
  );
}
