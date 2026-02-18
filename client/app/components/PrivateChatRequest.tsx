'use client';

import { useEffect, useState } from 'react';
import socket from '../socket';
import PrivateChat from './PrivateChat';
import { getContacts, Contact } from '../utils/chatStorage';

const keyframes = `
@keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
@keyframes fadeIn      { from{opacity:0;} to{opacity:1;} }
@keyframes ringPulse   { 0%,100%{box-shadow:0 0 0 0 rgba(20,184,166,.4);} 70%{box-shadow:0 0 0 10px rgba(20,184,166,0);} }
@keyframes slideDown   { from{opacity:0;transform:translateY(-12px);} to{opacity:1;transform:translateY(0);} }
@keyframes bounce      { 0%,100%{transform:scale(1);} 50%{transform:scale(1.12);} }
`;

export default function PrivateChatRequest({ username, sessionFingerprint }: { username: string; sessionFingerprint: string }) {
  const [users, setUsers] = useState<string[]>([]);
  const [roomId, setRoomId] = useState('');
  const [partner, setPartner] = useState('');
  const [requestFrom, setRequestFrom] = useState('');
  const [pendingTo, setPendingTo] = useState<string | null>(null);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [activeTab, setActiveTab] = useState<'online' | 'recent'>('online');

  useEffect(() => {
    const contacts = getContacts(sessionFingerprint);
    setRecentContacts(contacts);
  }, [sessionFingerprint]);

  useEffect(() => {
    socket.emit('user-connected', username);

    socket.on('users-list', (list: string[]) => {
      setUsers(list.filter((u) => u !== username));
    });
    socket.on('chat-request', ({ from }: { from: string }) => {
      setRequestFrom(from);
    });
    socket.on('private-chat-started', ({ roomId: r, partner: p }: { roomId: string; partner: string }) => {
      setRoomId(r); setPartner(p); setPendingTo(null);
    });

    return () => {
      socket.off('users-list');
      socket.off('chat-request');
      socket.off('private-chat-started');
    };
  }, [username]);

  const requestPrivateChat = (to: string) => {
    setPendingTo(to);
    socket.emit('private-chat-request', { to, from: username });
  };

  const acceptRequest = () => {
    socket.emit('accept-private-chat', { from: username, to: requestFrom });
    setRequestFrom('');
  };

  if (roomId) {
    return <PrivateChat roomId={roomId} username={username} partner={partner} sessionFingerprint={sessionFingerprint} />;
  }

  const avatarColor = (name: string) => {
    const colors = ['#7c3aed', '#0891b2', '#db2777', '#d97706', '#16a34a', '#14b8a6'];
    let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
    return colors[h];
  };

  return (
    <div style={{ width: '100%', maxWidth: 480, padding: '0 16px', boxSizing: 'border-box' as const }}>
      <style>{keyframes}</style>

      {/* Incoming call modal */}
      {requestFrom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, animation: 'fadeIn .2s ease' }}>
          <div style={{ background: 'rgba(15,20,30,.98)', border: '1px solid rgba(20,184,166,.3)', borderRadius: 24, padding: '32px', maxWidth: 320, width: '90%', textAlign: 'center' as const, boxShadow: '0 40px 80px rgba(0,0,0,.7)', animation: 'slideDown .3s ease' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: avatarColor(requestFrom), margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 700, color: '#fff', animation: 'ringPulse 1.5s ease infinite' }}>
              {requestFrom.charAt(0).toUpperCase()}
            </div>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem', marginBottom: 6 }}>{requestFrom}</h3>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.88rem', marginBottom: 24 }}>wants to chat privately with you</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setRequestFrom('')}
                style={{ flex: 1, padding: '12px 0', borderRadius: 14, background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171', fontWeight: 700, cursor: 'pointer', fontSize: '.95rem' }}
              >
                ✕ Decline
              </button>
              <button
                onClick={acceptRequest}
                style={{ flex: 1, padding: '12px 0', borderRadius: 14, background: 'linear-gradient(135deg,#14b8a6,#0891b2)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '.95rem', boxShadow: '0 4px 16px rgba(20,184,166,.35)' }}
              >
                ✓ Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div style={{ background: 'rgba(255,255,255,.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 24, overflow: 'hidden', animation: 'fadeSlideUp .4s ease' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem', margin: 0, marginBottom: 4 }}>Private Chat</h2>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.83rem', margin: 0 }}>
            Chatting as <strong style={{ color: '#14b8a6' }}>{username}</strong>
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          {(['online', 'recent'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', color: activeTab === tab ? '#14b8a6' : 'rgba(255,255,255,.4)', fontWeight: activeTab === tab ? 700 : 400, fontSize: '.88rem', cursor: 'pointer', borderBottom: activeTab === tab ? '2px solid #14b8a6' : '2px solid transparent', transition: 'all .2s', fontFamily: 'inherit' }}
            >
              {tab === 'online' ? `🟢 Online (${users.length})` : `🕐 Recent (${recentContacts.length})`}
            </button>
          ))}
        </div>

        {/* User List */}
        <div style={{ minHeight: 200, maxHeight: '55vh', overflowY: 'auto' }}>
          {activeTab === 'online' && (
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {users.length === 0 ? (
                <div style={{ textAlign: 'center' as const, padding: '40px 20px', color: 'rgba(255,255,255,.3)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>😶</div>
                  <p style={{ fontSize: '.88rem' }}>No other users online yet</p>
                </div>
              ) : users.map((user, i) => (
                <div key={user} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', animation: `fadeSlideUp .3s ease ${i * .05}s both`, transition: 'background .2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: avatarColor(user), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: '#fff', position: 'relative' }}>
                      {user.charAt(0).toUpperCase()}
                      <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid rgba(15,20,30,1)' }} />
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: '.95rem' }}>{user}</div>
                      <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '.73rem' }}>Available to chat</div>
                    </div>
                  </div>
                  <button
                    onClick={() => requestPrivateChat(user)}
                    disabled={pendingTo === user}
                    style={{ padding: '8px 16px', borderRadius: 10, background: pendingTo === user ? 'rgba(255,255,255,.06)' : 'linear-gradient(135deg,#14b8a6,#0891b2)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '.82rem', cursor: pendingTo === user ? 'default' : 'pointer', transition: 'all .2s', opacity: pendingTo === user ? .6 : 1 }}
                  >
                    {pendingTo === user ? 'Pending…' : 'Chat →'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'recent' && (
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentContacts.length === 0 ? (
                <div style={{ textAlign: 'center' as const, padding: '40px 20px', color: 'rgba(255,255,255,.3)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
                  <p style={{ fontSize: '.88rem' }}>No recent chats yet</p>
                </div>
              ) : recentContacts.map((contact, i) => {
                const isOnline = users.includes(contact.username);
                return (
                  <div key={contact.username} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', animation: `fadeSlideUp .3s ease ${i * .05}s both` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: avatarColor(contact.username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: '#fff', position: 'relative' }}>
                        {contact.username.charAt(0).toUpperCase()}
                        <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: isOnline ? '#22c55e' : '#6b7280', border: '2px solid rgba(15,20,30,1)' }} />
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: '.95rem' }}>{contact.username}</div>
                        <div style={{ color: 'rgba(255,255,255,.35)', fontSize: '.72rem' }}>
                          {isOnline ? 'Online now' : `Last seen ${new Date(contact.lastSeen).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                    {isOnline ? (
                      <button
                        onClick={() => requestPrivateChat(contact.username)}
                        disabled={pendingTo === contact.username}
                        style={{ padding: '8px 14px', borderRadius: 10, background: pendingTo === contact.username ? 'rgba(255,255,255,.06)' : 'linear-gradient(135deg,#14b8a6,#0891b2)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer' }}
                      >
                        {pendingTo === contact.username ? 'Pending…' : 'Chat →'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)', padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,.05)' }}>Offline</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
