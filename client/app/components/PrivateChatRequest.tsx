'use client';

import { useEffect, useState } from 'react';
import socket from '../socket';
import PrivateChat from './PrivateChat';

export default function PrivateChatRequest({ username }: { username: string }) {
  const [users, setUsers] = useState<string[]>([]);
  const [roomId, setRoomId] = useState('');
  const [partner, setPartner] = useState('');
  const [requestFrom, setRequestFrom] = useState('');

  useEffect(() => {
    socket.emit('user-connected', username);

    socket.on('users-list', (list) => {
      setUsers(list.filter((u: string) => u !== username));
    });

    socket.on('chat-request', ({ from }) => {
      setRequestFrom(from);
    });

    socket.on('private-chat-started', ({ roomId, partner }) => {
      setRoomId(roomId);
      setPartner(partner);
    });

    return () => {
      socket.off('users-list');
      socket.off('chat-request');
      socket.off('private-chat-started');
    };
  }, [username]);

  const requestPrivateChat = (to: string) => {
    socket.emit('private-chat-request', { to, from: username });
  };

  const acceptRequest = () => {
    socket.emit('accept-private-chat', { from: username, to: requestFrom });
    setRequestFrom('');
  };

  const declineRequest = () => {
    setRequestFrom('');
  };

  if (roomId) {
    return <PrivateChat roomId={roomId} username={username} partner={partner} />;
  }

  return (
    <div className="bg-white/10 p-6 rounded-2xl shadow-xl text-white w-full max-w-md text-center">
      <h2 className="text-2xl font-bold mb-4">Private Chat Requests</h2>
      <p className="mb-4">Online users:</p>
      <ul className="flex flex-col gap-3">
        {users.map((user) => (
          <li key={user}>
            <button
              className="bg-blue-500 hover:bg-blue-600 p-2 rounded-xl w-full"
              onClick={() => requestPrivateChat(user)}
            >
              Request Chat with {user}
            </button>
          </li>
        ))}
      </ul>

      {requestFrom && (
        <div className="mt-6 bg-black/50 p-4 rounded-xl">
          <p className="mb-2 font-semibold">{requestFrom} wants to chat privately.</p>
          <div className="flex justify-center gap-4">
            <button onClick={acceptRequest} className="bg-green-500 px-4 py-2 rounded-lg">
              Accept
            </button>
            <button onClick={declineRequest} className="bg-red-500 px-4 py-2 rounded-lg">
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
