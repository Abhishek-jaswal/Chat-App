'use client';

import { useState } from 'react';
import GroupChat from './components/GroupChat';
import PrivateChatRequest from './components/PrivateChatRequest';

export default function ChatApp() {
  const [step, setStep] = useState('login'); // Removed the type annotation
  const [username, setUsername] = useState('');

  return (
    <main className="min-h-screen bg-gradient-to-r from-purple-500 to-indigo-600 flex flex-col items-center justify-center px-4 text-white">
      {step === 'login' && (
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to Your Chatbox 👋</h1>
          <input
            type="text"
            placeholder="Enter your name"
            className="w-full p-3 rounded-lg text-black mb-6 outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 p-3 rounded-xl font-semibold w-full"
            onClick={() => {
              if (username.trim()) setStep('select');
              else alert('Please enter your name');
            }}
          >
            Continue
          </button>
        </div>
      )}

      {step === 'select' && (
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Choose Chat Type</h2>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setStep('group')}
              className="bg-green-500 hover:bg-green-600 p-3 rounded-xl font-semibold"
            >
              Group Chat
            </button>
            <button
              onClick={() => setStep('private')}
              className="bg-blue-500 hover:bg-blue-600 p-3 rounded-xl font-semibold"
            >
              Private Chat
            </button>
          </div>
        </div>
      )}

      {step === 'group' && <GroupChat username={username} />}
      {step === 'private' && <PrivateChatRequest username={username} />}
    </main>
  );
}
