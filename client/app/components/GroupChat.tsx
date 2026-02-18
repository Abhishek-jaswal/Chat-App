'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getMessages, appendMessage, clearChat, StoredMessage } from '../utils/chatStorage';

const socket = io('https://chat-app-k9pr.onrender.com');
const GROUP_ROOM = 'group_global';

const keyframes = `
@keyframes msgIn   { from{opacity:0;transform:translateY(8px) scale(.97);} to{opacity:1;transform:translateY(0) scale(1);} }
@keyframes typing  { 0%,80%,100%{transform:scale(1);opacity:.4;} 40%{transform:scale(1.4);opacity:1;} }
@keyframes fadeIn  { from{opacity:0;} to{opacity:1;} }
@keyframes slideUp { from{opacity:0;transform:translateY(100%);} to{opacity:1;transform:translateY(0);} }
`;

export default function GroupChat({ username, sessionFingerprint }: { username: string; sessionFingerprint: string }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // ✅ Fixed
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Load persisted messages on mount ── */
  useEffect(() => {
    const stored = getMessages(sessionFingerprint, GROUP_ROOM);
    setMessages(stored);
  }, [sessionFingerprint]);

  useEffect(() => {
    socket.emit('user-connected', username);

    socket.on('group-message', (data: { username: string; message: string }) => {
      const msg: StoredMessage = { from: data.username, message: data.message, ts: Date.now(), type: 'group' };
      appendMessage(sessionFingerprint, GROUP_ROOM, msg);
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('users-list', (list: string[]) => setOnlineCount(list.length));

    socket.on('typing', ({ username: u }: { username: string }) => {
      if (u === username) return;
      setTypingUsers((prev) => prev.includes(u) ? prev : [...prev, u]);
      setTimeout(() => setTypingUsers((prev) => prev.filter((x) => x !== u)), 2500);
    });

    return () => {
      socket.off('group-message');
      socket.off('users-list');
      socket.off('typing');
    };
  }, [username, sessionFingerprint]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!message.trim()) return;
    socket.emit('group-message', { username, message: message.trim() });
    setMessage('');
    inputRef.current?.focus();
  }, [message, username]);

  const handleTyping = () => {
    socket.emit('typing', { username, room: GROUP_ROOM });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => { }, 1500);
  };

  const handleClearHistory = () => {
    clearChat(sessionFingerprint, GROUP_ROOM);
    setMessages([]);
    setShowClearConfirm(false);
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const avatarColor = (name: string) => {
    const colors = ['#14b8a6', '#0891b2', '#7c3aed', '#db2777', '#d97706', '#16a34a'];
    let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
    return colors[h];
  };

  return (
    <div style={{ width: '100%', maxWidth: 760, height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', padding: '0 16px 16px', boxSizing: 'border-box' as const }}>
      <style>{keyframes}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '20px 20px 0 0', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#14b8a6,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👥</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>Group Chat</div>
            <div style={{ color: 'rgba(255,255,255,.45)', fontSize: '.78rem', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              {onlineCount} online
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowClearConfirm(true)}
          style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171', fontSize: '.78rem', cursor: 'pointer' }}
        >
          🗑 Clear History
        </button>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.08)', borderTop: 'none', borderBottom: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.25)', gap: 8, animation: 'fadeIn .5s ease' }}>
            <div style={{ fontSize: '3rem' }}>💬</div>
            <p style={{ fontSize: '.9rem' }}>No messages yet. Say hello!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.from === username;
          const prevSame = i > 0 && messages[i - 1].from === msg.from;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', animation: 'msgIn .3s ease', marginTop: prevSame ? 2 : 10 }}>
              {!prevSame && !isOwn && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: avatarColor(msg.from), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 700, color: '#fff' }}>
                    {msg.from.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)', fontWeight: 600 }}>{msg.from}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                <div style={{
                  maxWidth: '70%', padding: '10px 14px', borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isOwn ? 'linear-gradient(135deg,#14b8a6,#0891b2)' : 'rgba(255,255,255,.08)',
                  color: '#fff', fontSize: '.95rem', lineHeight: 1.45, wordBreak: 'break-word' as const,
                  border: isOwn ? 'none' : '1px solid rgba(255,255,255,.1)',
                  boxShadow: isOwn ? '0 4px 16px rgba(20,184,166,.25)' : 'none',
                }}>
                  {msg.message}
                </div>
                <span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)', whiteSpace: 'nowrap' as const }}>{formatTime(msg.ts)}</span>
              </div>
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, animation: 'fadeIn .3s ease' }}>
            <span style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)' }}>{typingUsers.join(', ')} typing</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(20,184,166,.7)', animation: `typing 1.2s ease ${i * .2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,.08)', borderTop: '1px solid rgba(255,255,255,.06)', borderRadius: '0 0 20px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message…"
          style={{ flex: 1, padding: '12px 18px', borderRadius: 14, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', fontSize: '.95rem', outline: 'none' }}
          value={message}
          onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={!message.trim()}
          style={{ padding: '12px 22px', borderRadius: 14, background: message.trim() ? 'linear-gradient(135deg,#14b8a6,#0891b2)' : 'rgba(255,255,255,.06)', color: '#fff', fontWeight: 700, fontSize: '.95rem', border: 'none', cursor: message.trim() ? 'pointer' : 'default', transition: 'all .2s', boxShadow: message.trim() ? '0 4px 16px rgba(20,184,166,.3)' : 'none' }}
        >
          Send ↑
        </button>
      </div>

      {/* Clear confirm modal */}
      {showClearConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, animation: 'fadeIn .2s ease' }}>
          <div style={{ background: 'rgba(15,20,30,.95)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 20, padding: '28px 32px', maxWidth: 340, textAlign: 'center' as const, boxShadow: '0 32px 64px rgba(0,0,0,.6)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🗑️</div>
            <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>Clear Chat History?</h3>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.88rem', marginBottom: 20 }}>This will permanently remove all messages from your device. This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowClearConfirm(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleClearHistory} style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
