'use client';
import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import GroupChat from './components/GroupChat';
import PrivateChatRequest from './components/PrivateChatRequest';
import Image from "next/image";
import Link from 'next/link';

export default function ChatApp() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState('login');
  const [username, setUsername] = useState('');

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-black  to-teal-300 text-white pb-0 font-[family-name:var(--font-patrick-hand)]">
        <p>Loading...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-black  to-teal-300 text-white pb-0 font-[family-name:var(--font-patrick-hand)]">
        <div className=" backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-xs text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Login To ChatApp</h1>
          <p className="text-sm text-gray-200 mb-6">Sign in to continue.</p>
          <input type='text' placeholder='Enter your email' className='w-full p-2 rounded-xl mb-4 bg-white/8 text-white placeholder-gray-300 outline-gray-500' />
          <input type='password' placeholder='Enter your password' className='w-full p-2 rounded-xl mb-4 bg-white/8 text-white placeholder-gray-300 outline-gray-500' /> 
          <button className='bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl hover:bg-gray-400 hover:text-gray-200 transition  mb-3'>Login</button>

          <button
            onClick={() => signIn('google')}
            className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-xl hover:bg-gray-300 transition w-full mb-3"
          >
            <Image src="/google.jpg" alt="Google Logo" width={20} height={20} className="inline-block mr-2" />
            Sign in with Google
          </button>
          <button
            onClick={() => signIn('github')}
            className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-xl hover:bg-teal-00 transition w-full"
          >
          <Image src="/github.png" alt="GitHub Logo" width={20} height={20} className="inline-block mr-2" />
          Sign in with GitHub
          </button>
          
        </div>
        <Link href="/login" className="absolute bottom-1 text-white hover:underline">
          Don't have an account? Register here
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-bl from-black via-blue-900 to-teal-400 flex flex-col items-center justify-center px-4 text-white relative">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => signOut()}
          className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition"
        >
          Logout
        </button>
      </div>

      {step === 'login' && (
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl shadow-2xl w-full max-w-xs text-center">
          <h1 className="text-xl font-bold text-white mb-2">
            Welcome to Your Chatbox {session.user.name} 👋
          </h1>
          <p className="text-sm text-gray-200 mb-4">Enter your name to continue</p>

          <input
            type="text"
            placeholder="Enter your name"
            className="w-full p-3 rounded-xl mb-4 bg-white/20 text-white placeholder-gray-300 outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <button
            className="bg-white text-black font-semibold py-2 px-4 rounded-xl hover:bg-gray-200 transition w-full"
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
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl shadow-2xl w-full max-w-xs text-center">
          <h2 className="text-xl font-bold text-white mb-4">Choose Chat Type</h2>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setStep('group')}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-xl"
            >
              Group Chat
            </button>
            <button
              onClick={() => setStep('private')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-xl"
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
