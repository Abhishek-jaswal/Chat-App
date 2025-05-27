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
  const [showCall, setShowCall] = useState(false);
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (showCall) {
      startVideoCall();
    }
  }, [showCall]);

  const startVideoCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (localRef.current) localRef.current.srcObject = stream;

    const peer = new RTCPeerConnection();
    peerRef.current = peer;

    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', { candidate: e.candidate, to: partner });
      }
    };

    peer.ontrack = (e) => {
      if (remoteRef.current) {
        remoteRef.current.srcObject = e.streams[0];
      }
    };

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit('call-user', { offer, to: partner });
  };

  socket.on('call-made', async ({ offer, from }) => {
    if (from !== partner) return;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (localRef.current) localRef.current.srcObject = stream;

    const peer = new RTCPeerConnection();
    peerRef.current = peer;

    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', { candidate: e.candidate, to: from });
      }
    };

    peer.ontrack = (e) => {
      if (remoteRef.current) {
        remoteRef.current.srcObject = e.streams[0];
      }
    };

    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit('make-answer', { answer, to: from });
  });

  socket.on('answer-made', async ({ answer, from }) => {
    if (from === partner) {
      await peerRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
    }
  });

  socket.on('ice-candidate', ({ candidate }) => {
    peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
  });

  return (
    <>
      <button
        onClick={() => setShowCall(true)}
        className="absolute top-4 right-4 bg-purple-600 px-4 py-2 rounded-md shadow text-white hover:bg-purple-700"
      >
        📹 Video Call
      </button>

      {showCall && (
        <div className="absolute top-16 right-4 bg-black/80 p-4 rounded-xl z-50">
          <div className="flex gap-4">
            <video ref={localRef} autoPlay muted playsInline className="w-40 rounded-lg" />
            <video ref={remoteRef} autoPlay playsInline className="w-40 rounded-lg" />
          </div>
          <button
            onClick={() => {
              peerRef.current?.close();
              streamRef.current?.getTracks().forEach(track => track.stop());
              setShowCall(false);
            }}
            className="mt-2 w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg text-white"
          >
            End Call
          </button>
        </div>
      )}
    </>
  );
}
