'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import GroupChat from './components/GroupChat';
import PrivateChatRequest from './components/PrivateChatRequest';

export default function ChatApp() {
  const { data: session, status } = useSession();

  const [step, setStep] = useState('login');
  const [username, setUsername] = useState('');

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-800 text-white">
        <p>Loading...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white flex-col">
        <h1 className="text-3xl mb-6">Welcome to ChatApp 🔐</h1>
        <button
          onClick={() => signIn('google')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4"
        >
          Sign in with Google
        </button>
             <button onClick={() => signIn('github')}>Sign in with GitHub</button>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-r from-purple-500 to-indigo-600 flex flex-col items-center justify-center px-4 text-white">
      <div className="absolute top-4 right-4">
       
        <button
          onClick={() => signOut()}
          className="bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>

      {step === 'login' && (
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to Your Chatbox {session.user.name}👋</h1>
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
