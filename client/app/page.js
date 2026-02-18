'use client';
import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import GroupChat from './components/GroupChat';
import PrivateChatRequest from './components/PrivateChatRequest';
import Image from 'next/image';
import { clearAllChatData, makeFingerprint } from './utils/chatStorage';

const KF = `
@keyframes fadeSlideUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:none} }
@keyframes fadeIn      { from{opacity:0} to{opacity:1} }
@keyframes float       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
@keyframes blink       { 0%,100%{opacity:1} 50%{opacity:.25} }
@keyframes bounceSub   { 0%,100%{transform:translateY(0)} 60%{transform:translateY(-6px)} }
@keyframes orbPulse    { 0%,100%{opacity:.7} 50%{opacity:1} }
* { box-sizing:border-box; margin:0; padding:0; }
html,body { height:100%; }
input,button { font-family:inherit; }
.login-input:focus { outline:none; }
.hover-lift:hover { transform:translateY(-3px); }
@media (max-width:480px) {
  .auth-card { padding:1.6rem 1.2rem !important; }
  .chat-select-grid { grid-template-columns:1fr !important; }
}
`;

export default function ChatApp() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState('login');
  const [username, setUsername] = useState('');
  const [focused, setFocused] = useState(null);

  useEffect(() => {
    if (session?.user?.name && !username) setUsername(session.user.name.split(' ')[0]);
  }, [session]);

  useEffect(() => {
    if (status === 'unauthenticated') clearAllChatData(null);
  }, [status]);

  // Request notification permission after session loads
  useEffect(() => {
    if (status === 'authenticated' && 'Notification' in window && Notification.permission === 'default') {
      // Small delay so it doesn't feel abrupt
      const t = setTimeout(() => Notification.requestPermission(), 3000);
      return () => clearTimeout(t);
    }
  }, [status]);

  const handleLogout = () => {
    if (session?.user?.email) clearAllChatData(makeFingerprint(session.user.email));
    signOut();
  };

  const page = {
    minHeight: '100dvh',
    background: 'linear-gradient(135deg,#050810 0%,#0a1628 50%,#060e18 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Patrick Hand', cursive",
    position: 'relative',
    overflow: 'hidden',
  };

  const orb = (top, left, right, bottom, size, color) => ({
    position: 'absolute',
    top, left, right, bottom,
    width: size, height: size,
    borderRadius: '50%',
    background: `radial-gradient(circle,${color} 0%,transparent 70%)`,
    pointerEvents: 'none',
    animation: 'orbPulse 4s ease infinite',
  });

  const card = {
    background: 'rgba(255,255,255,.04)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,.09)',
    borderRadius: 26,
    padding: '2rem 1.8rem',
    width: '100%',
    maxWidth: 380,
    textAlign: 'center',
    boxShadow: '0 40px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.08)',
    animation: 'fadeSlideUp .5s cubic-bezier(.22,1,.36,1) both',
    position: 'relative',
    zIndex: 1,
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '12px 16px',
    borderRadius: 13,
    background: focused === field ? 'rgba(20,184,166,.07)' : 'rgba(255,255,255,.06)',
    border: focused === field ? '1.5px solid rgba(20,184,166,.6)' : '1.5px solid rgba(255,255,255,.1)',
    color: '#fff',
    fontSize: '.95rem',
    outline: 'none',
    marginBottom: 12,
    transition: 'all .2s',
    display: 'block',
  });

  const btnPrimary = {
    width: '100%', padding: '12px 0', borderRadius: 13, fontWeight: 700,
    fontSize: '.95rem', cursor: 'pointer', border: 'none',
    background: 'linear-gradient(135deg,#14b8a6,#0891b2)',
    color: '#fff', boxShadow: '0 4px 20px rgba(20,184,166,.35)', transition: 'all .2s',
  };

  const btnSocial = {
    width: '100%', padding: '11px 0', borderRadius: 13, fontWeight: 600,
    fontSize: '.9rem', cursor: 'pointer',
    background: 'rgba(255,255,255,.07)',
    border: '1.5px solid rgba(255,255,255,.12)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: 10, transition: 'all .2s',
  };

  const topBar = {
    position: 'fixed', top: 0, left: 0, right: 0,
    padding: '12px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'rgba(5,8,16,.8)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,.07)',
    zIndex: 200,
    animation: 'fadeIn .4s ease',
  };

  if (status === 'loading') {
    return (
      <main style={page}>
        <style>{KF}</style>
        <div style={orb('-5%', '-5%', undefined, undefined, '40vw', 'rgba(20,184,166,.18)')} />
        <div style={orb(undefined, undefined, '-5%', '-5%', '35vw', 'rgba(6,182,212,.12)')} />
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '1rem', animation: 'blink 1.4s ease infinite', letterSpacing: 2 }}>
          Loading…
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main style={page}>
        <style>{KF}</style>
        <div style={orb('-8%', '-8%', undefined, undefined, '50vw', 'rgba(20,184,166,.16)')} />
        <div style={orb(undefined, undefined, '-8%', '-8%', '45vw', 'rgba(6,182,212,.12)')} />
        <div style={orb('35%', undefined, '10%', undefined, '30vw', 'rgba(139,92,246,.1)')} />

        <div className="auth-card" style={card}>
          <div style={{ marginBottom: 20 }}>
            <Image src="/chatapp.png" alt="Logo" width={54} height={54} style={{ borderRadius: '50%', border: '2px solid rgba(20,184,166,.45)', boxShadow: '0 0 28px rgba(20,184,166,.3)', animation: 'float 3s ease-in-out infinite' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>Welcome Back 👋</h1>
          <p style={{ fontSize: '.83rem', color: 'rgba(255,255,255,.4)', marginBottom: 22 }}>Sign in to continue to ChatApp</p>

          <input type="email" placeholder="Email address" style={inputStyle('email')} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
          <input type="password" placeholder="Password" style={inputStyle('pass')} onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)} />
          <button style={btnPrimary}>Sign In</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0', color: 'rgba(255,255,255,.25)', fontSize: '.78rem' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }} />
            or continue with
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }} />
          </div>

          <button onClick={() => signIn('google')} style={btnSocial}>
            <Image src="/google.jpg" alt="" width={18} height={18} style={{ borderRadius: 3 }} />
            Google
          </button>
          <button onClick={() => signIn('github')} style={btnSocial}>
            <Image src="/github.png" alt="" width={18} height={18} style={{ borderRadius: 3 }} />
            GitHub
          </button>

          <p style={{ marginTop: 20, fontSize: '.78rem', color: 'rgba(255,255,255,.3)' }}>
            No account?{' '}
            <a href="/login" style={{ color: '#14b8a6', textDecoration: 'none' }}>Register →</a>
          </p>
        </div>
      </main>
    );
  }

  const fp = makeFingerprint(session.user?.email || session.user?.name || 'user');
  const isChatView = step === 'group' || step === 'private';

  return (
    <main style={{ ...page, alignItems: isChatView ? 'flex-start' : 'center', paddingTop: isChatView ? 64 : 0, paddingLeft: isChatView ? 0 : 16, paddingRight: isChatView ? 0 : 16 }}>
      <style>{KF}</style>
      <div style={orb('-8%', '-8%', undefined, undefined, '50vw', 'rgba(20,184,166,.1)')} />
      <div style={orb(undefined, undefined, '-8%', '-8%', '45vw', 'rgba(6,182,212,.08)')} />
      <div style={orb('40%', undefined, '10%', undefined, '28vw', 'rgba(139,92,246,.08)')} />

      {/* Top Bar */}
      <div style={topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Image src="/chatapp.png" alt="" width={32} height={32} style={{ borderRadius: '50%', border: '1.5px solid rgba(20,184,166,.4)' }} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>ChatApp</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isChatView && (
            <button
              onClick={() => setStep('select')}
              style={{ padding: '7px 14px', borderRadius: 9, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)', fontSize: '.8rem', cursor: 'pointer' }}
            >
              ← Back
            </button>
          )}
          {session.user?.image && (
            <img src={session.user.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid rgba(20,184,166,.4)' }} />
          )}
          <span style={{ color: 'rgba(255,255,255,.55)', fontSize: '.82rem', display: 'none' }} className="username-label">
            {session.user?.name?.split(' ')[0]}
          </span>
          <button
            onClick={handleLogout}
            style={{ padding: '7px 14px', borderRadius: 9, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)', fontSize: '.8rem', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Step: username */}
      {step === 'login' && (
        <div className="auth-card" style={{ ...card, animation: 'fadeSlideUp .4s ease' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10, animation: 'bounceSub 2.5s ease infinite' }}>💬</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            Hey, {session.user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p style={{ fontSize: '.83rem', color: 'rgba(255,255,255,.4)', marginBottom: 22 }}>Enter your display name to start chatting</p>
          <input
            type="text"
            placeholder="Your display name"
            style={inputStyle('name')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            onKeyDown={(e) => { if (e.key === 'Enter' && username.trim()) setStep('select'); }}
          />
          <button
            style={{ ...btnPrimary, opacity: username.trim() ? 1 : .45, cursor: username.trim() ? 'pointer' : 'default' }}
            onClick={() => { if (username.trim()) setStep('select'); }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* Step: choose chat type */}
      {step === 'select' && (
        <div className="auth-card" style={{ ...card, maxWidth: 440, animation: 'fadeSlideUp .38s ease' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>🚀</div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>Choose Chat Type</h1>
          <p style={{ fontSize: '.83rem', color: 'rgba(255,255,255,.4)', marginBottom: 20 }}>
            You are <strong style={{ color: '#14b8a6' }}>{username}</strong>
          </p>
          <div className="chat-select-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { step: 'group', emoji: '👥', label: 'Group Chat', sub: 'Talk with everyone', from: '#14b8a6', to: '#0891b2' },
              { step: 'private', emoji: '🔒', label: 'Private Chat', sub: '1-on-1 messages', from: '#8b5cf6', to: '#6366f1' },
            ].map((item) => (
              <button
                key={item.step}
                className="hover-lift"
                onClick={() => setStep(item.step)}
                style={{
                  padding: '22px 12px', borderRadius: 18, border: '1px solid rgba(255,255,255,.1)',
                  background: 'rgba(255,255,255,.04)', cursor: 'pointer', transition: 'all .22s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `rgba(${item.from === '#14b8a6' ? '20,184,166' : '139,92,246'},.1)`;
                  e.currentTarget.style.borderColor = `${item.from}88`;
                  e.currentTarget.style.boxShadow = `0 8px 24px ${item.from}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,.04)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '2rem' }}>{item.emoji}</span>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '.95rem' }}>{item.label}</span>
                <span style={{ color: 'rgba(255,255,255,.38)', fontSize: '.75rem' }}>{item.sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'group' && <GroupChat username={username} sessionFingerprint={fp} />}
      {step === 'private' && <PrivateChatRequest username={username} sessionFingerprint={fp} />}
    </main>
  );
}
