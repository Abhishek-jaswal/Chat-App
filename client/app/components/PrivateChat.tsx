'use client';

import { useEffect, useRef, useState } from 'react';
import socket from '../socket'; // Shared socket instance
import VideoCall from './VideoCall';

export default function PrivateChat({
  username,
  roomId,
  partner,
}: {
  username: string;
  roomId: string;
  partner: string;
}) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ from: string; message: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on('private-message', (data) => {
      if (data.roomId === roomId) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => {
      socket.off('private-message');
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('private-message', {
        from: username,
        message,
        roomId,
      });
      setMessage('');
    }
  };

  return (
    <div className="w-full max-w-2xl h-[80vh] bg-white/10 p-6 rounded-2xl shadow-xl text-white flex flex-col font-[family-name:var(--font-patrick-hand)]">
      <h2 className="text-2xl font-bold mb-4 text-center">💬 Private Chat with {partner}</h2>
      <VideoCall username={username} partner={partner} />


      <div className="flex-1 overflow-y-auto mb-4 px-3 space-y-2 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent font-[family-name:var(--font-patrick-hand)]">
        {messages.map((msg, index) => {
          const isOwn = msg.from === username;
          return (
            <div
              key={index}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl shadow ${
                  isOwn
                    ? 'bg-green-500 text-white rounded-br-none'
                    : 'bg-blue-500 text-white rounded-bl-none'
                }`}
              >
                {!isOwn && (
                  <div className="text-sm font-bold text-white mb-1">
                    {msg.from}
                  </div>
                )}
                <div className="break-words">{msg.message}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 mt-2">
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 p-3 rounded-lg text-black outline-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-green-500 hover:bg-green-600 px-6 py-2 rounded-xl font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
}
