'use client';
import { useEffect, useState } from 'react';
import socket from '../socket';
import PrivateChat from './PrivateChat';
import { getContacts, getUnread, Contact } from '../utils/chatStorage';

export default function PrivateChatRequest({
  username,
  sessionFingerprint,
}: {
  username: string;
  sessionFingerprint: string;
}) {
  const [users, setUsers] = useState<string[]>([]);
  const [roomId, setRoomId] = useState('');
  const [partner, setPartner] = useState('');
  const [requestFrom, setRequestFrom] = useState('');
  const [pendingTo, setPendingTo] = useState<string | null>(null);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'online' | 'recent'>('online');

  useEffect(() => {
    setRecentContacts(getContacts(sessionFingerprint));
    setUnread(getUnread(sessionFingerprint));
  }, [sessionFingerprint]);

  useEffect(() => {
    socket.emit('user-connected', username);
    socket.on('users-list', (list: string[]) => setUsers(list.filter((u) => u !== username)));
    socket.on('chat-request', ({ from }: { from: string }) => setRequestFrom(from));
    socket.on('private-chat-started', ({ roomId: r, partner: p }: { roomId: string; partner: string }) => {
      setRoomId(r); setPartner(p); setPendingTo(null);
    });
    return () => { socket.off('users-list'); socket.off('chat-request'); socket.off('private-chat-started'); };
  }, [username]);

  const requestChat = (to: string) => {
    setPendingTo(to);
    socket.emit('private-chat-request', { to, from: username });
  };

  const acceptRequest = () => {
    socket.emit('accept-private-chat', { from: username, to: requestFrom });
    setRequestFrom('');
  };

  if (roomId) return <PrivateChat roomId={roomId} username={username} partner={partner} sessionFingerprint={sessionFingerprint} />;

  const avatarBg = (name: string) => {
    const g = ['135deg,#8b5cf6,#6366f1', '135deg,#3b82f6,#2563eb', '135deg,#f43f5e,#e11d48', '135deg,#f59e0b,#d97706', '135deg,#10b981,#059669', '135deg,#14b8a6,#0891b2'];
    let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % g.length;
    return `linear-gradient(${g[h]})`;
  };

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes fadeIn      { from{opacity:0} to{opacity:1} }
        @keyframes slideDown   { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:none} }
        @keyframes ringPulse   { 0%,100%{box-shadow:0 0 0 0 rgba(20,184,166,.5)} 60%{box-shadow:0 0 0 12px rgba(20,184,166,0)} }
        @keyframes slideUp     { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:none} }
        * { box-sizing:border-box; }
        .user-row:hover { background: rgba(255,255,255,.06) !important; }
        .chat-btn:hover:not(:disabled) { transform: scale(1.04); filter: brightness(1.1); }
        ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:4px}
        @media (max-width:640px) {
          .pcr-card { border-radius:0!important; width:100%!important; max-width:100%!important; }
        }
      `}</style>

      {/* Incoming chat request modal */}
      {requestFrom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, animation: 'fadeIn .2s ease', padding: 20 }}>
          <div style={{ background: 'linear-gradient(145deg,#0f172a,#0c1524)', border: '1px solid rgba(20,184,166,.25)', borderRadius: 26, padding: '32px 28px', maxWidth: 340, width: '100%', textAlign: 'center', animation: 'slideUp .35s cubic-bezier(.22,1,.36,1)' }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: avatarBg(requestFrom), margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: '#fff', animation: 'ringPulse 2s ease infinite' }}>
              {requestFrom.charAt(0).toUpperCase()}
            </div>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem', margin: '0 0 6px' }}>{requestFrom}</h3>
            <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '.88rem', margin: '0 0 26px', lineHeight: 1.5 }}>
              wants to start a private conversation with you
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setRequestFrom('')}
                style={{ flex: 1, padding: '13px 0', borderRadius: 14, background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5', fontWeight: 700, cursor: 'pointer', fontSize: '.95rem', fontFamily: 'inherit' }}
              >
                ✕ Decline
              </button>
              <button
                onClick={acceptRequest}
                style={{ flex: 1, padding: '13px 0', borderRadius: 14, background: 'linear-gradient(135deg,#14b8a6,#0891b2)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '.95rem', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(20,184,166,.4)' }}
              >
                ✓ Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="pcr-card" style={{ width: '100%', maxWidth: 480, background: 'rgba(255,255,255,.025)', backdropFilter: 'blur(20px)', borderRadius: 24, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,.4)', animation: 'fadeSlideUp .4s ease' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.03)' }}>
          <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem', margin: '0 0 2px' }}>Private Chat</h2>
          <p style={{ color: 'rgba(255,255,255,.38)', fontSize: '.8rem', margin: 0 }}>
            You are <strong style={{ color: '#14b8a6' }}>{username}</strong>
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          {(['online', 'recent'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '12px 0', background: 'none', border: 'none',
                color: activeTab === tab ? '#14b8a6' : 'rgba(255,255,255,.38)',
                fontWeight: activeTab === tab ? 700 : 400,
                fontSize: '.85rem', cursor: 'pointer', fontFamily: 'inherit',
                borderBottom: activeTab === tab ? '2px solid #14b8a6' : '2px solid transparent',
                transition: 'all .2s',
              }}
            >
              {tab === 'online' ? `🟢 Online (${users.length})` : `🕐 Recent (${recentContacts.length})`}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {activeTab === 'online' && (
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '44px 20px', color: 'rgba(255,255,255,.25)', animation: 'fadeIn .4s ease' }}>
                  <div style={{ fontSize: '2.8rem', marginBottom: 10 }}>👀</div>
                  <p style={{ margin: 0, fontSize: '.88rem' }}>No other users online right now</p>
                </div>
              ) : (
                users.map((user, i) => (
                  <div
                    key={user}
                    className="user-row"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 14, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.06)', transition: 'background .18s', animation: `fadeSlideUp .3s ease ${i * .05}s both`, gap: 10 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: avatarBg(user), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                          {user.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2.5px solid rgba(10,14,25,1)' }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: '.93rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user}</div>
                        <div style={{ color: 'rgba(255,255,255,.35)', fontSize: '.72rem' }}>Available</div>
                      </div>
                    </div>
                    <button
                      className="chat-btn"
                      onClick={() => requestChat(user)}
                      disabled={!!pendingTo}
                      style={{
                        padding: '8px 16px', borderRadius: 10, border: 'none',
                        background: pendingTo === user ? 'rgba(255,255,255,.06)' : 'linear-gradient(135deg,#14b8a6,#0891b2)',
                        color: '#fff', fontWeight: 700, fontSize: '.8rem', cursor: pendingTo ? 'default' : 'pointer',
                        transition: 'all .2s', flexShrink: 0, fontFamily: 'inherit',
                        opacity: pendingTo && pendingTo !== user ? .45 : 1,
                      }}
                    >
                      {pendingTo === user ? '⏳' : 'Chat →'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'recent' && (
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentContacts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '44px 20px', color: 'rgba(255,255,255,.25)', animation: 'fadeIn .4s ease' }}>
                  <div style={{ fontSize: '2.8rem', marginBottom: 10 }}>📭</div>
                  <p style={{ margin: 0, fontSize: '.88rem' }}>No recent conversations yet</p>
                </div>
              ) : (
                recentContacts.map((c, i) => {
                  const isOnline = users.includes(c.username);
                  const unreadCount = c.roomId ? (unread[c.roomId] || 0) : 0;
                  return (
                    <div
                      key={c.username}
                      className="user-row"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 14, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.06)', transition: 'background .18s', animation: `fadeSlideUp .3s ease ${i * .05}s both`, gap: 10 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0, flex: 1 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: avatarBg(c.username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                            {c.username.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: isOnline ? '#22c55e' : '#4b5563', border: '2.5px solid rgba(10,14,25,1)' }} />
                          {unreadCount > 0 && (
                            <div style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#f43f5e', fontSize: '.62rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(10,14,25,1)' }}>
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: '#fff', fontWeight: 600, fontSize: '.93rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.username}</div>
                          <div style={{ color: 'rgba(255,255,255,.3)', fontSize: '.71rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.lastMessage ? c.lastMessage : isOnline ? 'Online now' : `Last seen ${new Date(c.lastSeen).toLocaleDateString()}`}
                          </div>
                        </div>
                      </div>
                      {isOnline ? (
                        <button
                          className="chat-btn"
                          onClick={() => requestChat(c.username)}
                          disabled={!!pendingTo}
                          style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: pendingTo === c.username ? 'rgba(255,255,255,.06)' : 'linear-gradient(135deg,#14b8a6,#0891b2)', color: '#fff', fontWeight: 700, fontSize: '.8rem', cursor: pendingTo ? 'default' : 'pointer', transition: 'all .2s', flexShrink: 0, fontFamily: 'inherit', opacity: pendingTo && pendingTo !== c.username ? .45 : 1 }}
                        >
                          {pendingTo === c.username ? '⏳' : 'Chat →'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.28)', padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,.05)', flexShrink: 0 }}>Offline</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
