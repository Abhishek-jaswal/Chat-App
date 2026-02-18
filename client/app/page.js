'use client';
import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import GroupChat from './components/GroupChat';
import PrivateChatRequest from './components/PrivateChatRequest';
import Image from 'next/image';
import { clearAllChatData, makeFingerprint } from './utils/chatStorage';

const keyframes = `
@keyframes fadeSlideUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn        { from { opacity:0; } to { opacity:1; } }
@keyframes float         { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-10px);} }
@keyframes blink         { 0%,100%{opacity:1;} 50%{opacity:0;} }
@keyframes bounce-subtle { 0%,100%{transform:translateY(0);} 60%{transform:translateY(-5px);} }
`;

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg,#0a0a0f 0%,#0d1a2e 40%,#0a1a1a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Patrick Hand', cursive",
    position: 'relative',
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    top: '-10%',
    left: '-5%',
    width: '45vw',
    height: '45vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle,rgba(20,184,166,.22) 0%,transparent 70%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute',
    bottom: '-10%',
    right: '-5%',
    width: '40vw',
    height: '40vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle,rgba(6,182,212,.16) 0%,transparent 70%)',
    pointerEvents: 'none',
  },
  orb3: {
    position: 'absolute',
    top: '40%',
    right: '15%',
    width: '25vw',
    height: '25vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle,rgba(139,92,246,.12) 0%,transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'rgba(255,255,255,.04)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 28,
    padding: '2.2rem 2rem',
    width: '100%',
    maxWidth: 380,
    textAlign: 'center',
    boxShadow: '0 32px 64px rgba(0,0,0,.5)',
    animation: 'fadeSlideUp .55s cubic-bezier(.22,1,.36,1) both',
    position: 'relative',
    zIndex: 1,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: '2px solid rgba(20,184,166,.5)',
    boxShadow: '0 0 24px rgba(20,184,166,.3)',
    animation: 'float 3s ease-in-out infinite',
    marginBottom: 12,
  },
  h1: { fontSize: '1.55rem', fontWeight: 700, color: '#fff', marginBottom: 4 },
  sub: { fontSize: '.85rem', color: 'rgba(255,255,255,.45)', marginBottom: 24 },
  inputBase: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 14,
    background: 'rgba(255,255,255,.07)',
    border: '1px solid rgba(255,255,255,.12)',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    marginBottom: 14,
    boxSizing: 'border-box',
    transition: 'border .2s,background .2s',
  },
  btn: {
    width: '100%',
    padding: '12px 0',
    borderRadius: 14,
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all .2s',
    border: 'none',
    fontFamily: "'Patrick Hand', cursive",
  },
  btnPrimary: {
    background: 'linear-gradient(135deg,#14b8a6,#0891b2)',
    color: '#fff',
    boxShadow: '0 4px 20px rgba(20,184,166,.35)',
  },
  btnSocial: {
    background: 'rgba(255,255,255,.08)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '16px 0',
    color: 'rgba(255,255,255,.3)',
    fontSize: '.8rem',
  },
  divLine: { flex: 1, height: 1, background: 'rgba(255,255,255,.12)' },
  topBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    padding: '14px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(10,10,15,.7)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,.07)',
    zIndex: 100,
    animation: 'fadeIn .4s ease',
  },
  topBtn: {
    padding: '8px 20px',
    borderRadius: 10,
    background: 'rgba(255,255,255,.08)',
    border: '1px solid rgba(255,255,255,.12)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '.9rem',
    transition: 'all .2s',
    fontFamily: "'Patrick Hand', cursive",
  },
  chatTypeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 8 },
  chatTypeCard: {
    padding: '24px 12px',
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,.12)',
    background: 'rgba(255,255,255,.05)',
    cursor: 'pointer',
    transition: 'all .25s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    fontFamily: "'Patrick Hand', cursive",
  },
};

export default function ChatApp() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState('login');
  const [username, setUsername] = useState('');
  const [inputFocus, setInputFocus] = useState(null);

  useEffect(() => {
    if (session?.user?.name && !username) {
      setUsername(session.user.name.split(' ')[0]);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      clearAllChatData(null);
    }
  }, [status]);

  const handleLogout = () => {
    if (session?.user?.email) {
      const fp = makeFingerprint(session.user.email);
      clearAllChatData(fp);
    }
    signOut();
  };

  // ── Loading ──
  if (status === 'loading') {
    return (
      <main style={s.page}>
        <style>{keyframes}</style>
        <div style={s.orb1} />
        <div style={s.orb2} />
        <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '1.1rem', animation: 'blink 1.2s ease infinite' }}>
          Connecting…
        </div>
      </main>
    );
  }

  // ── Not signed in ──
  if (!session) {
    const inputStyle = (field) => ({
      ...s.inputBase,
      border: inputFocus === field ? '1px solid rgba(20,184,166,.7)' : '1px solid rgba(255,255,255,.12)',
      background: inputFocus === field ? 'rgba(20,184,166,.08)' : 'rgba(255,255,255,.07)',
    });

    return (
      <main style={s.page}>
        <style>{keyframes}</style>
        <div style={s.orb1} />
        <div style={s.orb2} />
        <div style={s.orb3} />
        <div style={s.card}>
          <Image src="/chatapp.png" alt="Logo" width={56} height={56} style={s.logo} />
          <h1 style={s.h1}>Welcome Back 👋</h1>
          <p style={s.sub}>Sign in to ChatApp</p>

          <input
            type="email"
            placeholder="Email address"
            style={inputStyle('email')}
            onFocus={() => setInputFocus('email')}
            onBlur={() => setInputFocus(null)}
          />
          <input
            type="password"
            placeholder="Password"
            style={inputStyle('pass')}
            onFocus={() => setInputFocus('pass')}
            onBlur={() => setInputFocus(null)}
          />
          <button style={{ ...s.btn, ...s.btnPrimary }}>Sign In</button>

          <div style={s.divider}>
            <div style={s.divLine} />
            <span>or continue with</span>
            <div style={s.divLine} />
          </div>

          <button onClick={() => signIn('google')} style={{ ...s.btn, ...s.btnSocial }}>
            <Image src="/google.jpg" alt="G" width={18} height={18} style={{ borderRadius: 3 }} />
            Google
          </button>
          <button onClick={() => signIn('github')} style={{ ...s.btn, ...s.btnSocial }}>
            <Image src="/github.png" alt="GH" width={18} height={18} style={{ borderRadius: 3 }} />
            GitHub
          </button>

          <p style={{ marginTop: 20, fontSize: '.8rem', color: 'rgba(255,255,255,.35)' }}>
            No account?{' '}
            <a href="/login" style={{ color: '#14b8a6', textDecoration: 'none' }}>
              Register here →
            </a>
          </p>
        </div>
      </main>
    );
  }

  // ── Signed in ──
  const fp = makeFingerprint(session.user?.email || session.user?.name || 'user');
  const isChatView = step === 'group' || step === 'private';

  return (
    <main style={{ ...s.page, alignItems: isChatView ? 'flex-start' : 'center', paddingTop: isChatView ? 72 : 0 }}>
      <style>{keyframes}</style>
      <div style={s.orb1} />
      <div style={s.orb2} />
      <div style={s.orb3} />

      {/* Top Bar */}
      <div style={s.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image
            src="/chatapp.png"
            alt="Logo"
            width={36}
            height={36}
            style={{ borderRadius: '50%', border: '1.5px solid rgba(20,184,166,.4)' }}
          />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>ChatApp</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isChatView && (
            <button onClick={() => setStep('select')} style={{ ...s.topBtn, fontSize: '.82rem' }}>
              ← Back
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {session.user?.image && (
              <img
                src={session.user.image}
                alt="avatar"
                style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid rgba(20,184,166,.5)' }}
              />
            )}
            <span style={{ color: 'rgba(255,255,255,.7)', fontSize: '.85rem' }}>
              {session.user?.name?.split(' ')[0]}
            </span>
          </div>
          <button onClick={handleLogout} style={s.topBtn}>
            Logout
          </button>
        </div>
      </div>

      {/* Step: Enter display name */}
      {step === 'login' && (
        <div style={{ ...s.card, animation: 'fadeSlideUp .4s ease' }}>
          <div style={{ fontSize: '3rem', marginBottom: 8, animation: 'bounce-subtle 2s ease infinite' }}>💬</div>
          <h1 style={s.h1}>Hey, {session.user?.name?.split(' ')[0] || 'there'}!</h1>
          <p style={s.sub}>Choose your display name to get started</p>
          <input
            type="text"
            placeholder="Your display name"
            style={{
              ...s.inputBase,
              border: inputFocus === 'name' ? '1px solid rgba(20,184,166,.7)' : '1px solid rgba(255,255,255,.12)',
              background: inputFocus === 'name' ? 'rgba(20,184,166,.08)' : 'rgba(255,255,255,.07)',
            }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => setInputFocus('name')}
            onBlur={() => setInputFocus(null)}
            onKeyDown={(e) => { if (e.key === 'Enter' && username.trim()) setStep('select'); }}
          />
          <button
            style={{ ...s.btn, ...s.btnPrimary, opacity: username.trim() ? 1 : 0.5 }}
            onClick={() => { if (username.trim()) setStep('select'); }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* Step: Choose chat type */}
      {step === 'select' && (
        <div style={{ ...s.card, maxWidth: 440, animation: 'fadeSlideUp .4s ease' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🚀</div>
          <h1 style={s.h1}>Choose Chat Type</h1>
          <p style={s.sub}>
            Chatting as <strong style={{ color: '#14b8a6' }}>{username}</strong>
          </p>
          <div style={s.chatTypeGrid}>
            <button
              style={s.chatTypeCard}
              onClick={() => setStep('group')}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(20,184,166,.12)';
                e.currentTarget.style.borderColor = 'rgba(20,184,166,.5)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '2.2rem' }}>👥</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Group Chat</span>
              <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.78rem' }}>Talk with everyone</span>
            </button>

            <button
              style={s.chatTypeCard}
              onClick={() => setStep('private')}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(8,145,178,.12)';
                e.currentTarget.style.borderColor = 'rgba(8,145,178,.5)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '2.2rem' }}>🔒</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Private Chat</span>
              <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.78rem' }}>1-on-1 encrypted</span>
            </button>
          </div>
        </div>
      )}

      {step === 'group' && <GroupChat username={username} sessionFingerprint={fp} />}
      {step === 'private' && <PrivateChatRequest username={username} sessionFingerprint={fp} />}
    </main>
  );
}