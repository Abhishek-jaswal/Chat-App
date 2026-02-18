'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getMessages, appendMessage, clearChat, StoredMessage } from '../utils/chatStorage';
import { useNotifications } from '../utils/useNotifications';

const socket = io('https://chat-app-k9pr.onrender.com');
const GROUP_ROOM = 'group_global';

export default function GroupChat({
  username,
  sessionFingerprint,
}: {
  username: string;
  sessionFingerprint: string;
}) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [showClearModal, setShowClearModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const { notifyIfHidden } = useNotifications(sessionFingerprint);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Load persisted messages
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
      if (data.username !== username) {
        notifyIfHidden(`💬 ${data.username}`, data.message, 'group-msg');
      }
    });

    socket.on('users-list', (list: string[]) => setOnlineCount(list.length));

    socket.on('user-typing', ({ username: u }: { username: string }) => {
      if (u === username) return;
      setTypingUsers((prev) => (prev.includes(u) ? prev : [...prev, u]));
      clearTimeout(typingTimers.current[u]);
      typingTimers.current[u] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((x) => x !== u));
      }, 2500);
    });

    return () => {
      socket.off('group-message');
      socket.off('users-list');
      socket.off('user-typing');
    };
  }, [username, sessionFingerprint, notifyIfHidden]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!message.trim()) return;
    socket.emit('group-message', { username, message: message.trim() });
    setMessage('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [message, username]);

  const handleTyping = () => socket.emit('user-typing', { username, room: GROUP_ROOM });

  const handleClear = () => {
    clearChat(sessionFingerprint, GROUP_ROOM);
    setMessages([]);
    setShowClearModal(false);
    showToast('Chat history cleared');
  };

  const avatarBg = (name: string) => {
    const g = ['135deg,#14b8a6,#0891b2', '135deg,#8b5cf6,#6366f1', '135deg,#f43f5e,#e11d48', '135deg,#f59e0b,#d97706', '135deg,#10b981,#059669', '135deg,#3b82f6,#2563eb'];
    let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % g.length;
    return `linear-gradient(${g[h]})`;
  };

  const fmt = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const groupedMessages = messages.reduce<Array<StoredMessage & { showAvatar: boolean }>>((acc, msg, i) => {
    const prev = messages[i - 1];
    acc.push({ ...msg, showAvatar: !prev || prev.from !== msg.from || msg.ts - prev.ts > 60000 });
    return acc;
  }, []);

  return (
    <>
      <style>{`
        @keyframes msgIn    { from { opacity:0; transform:translateY(10px) scale(.96); } to { opacity:1; transform:none; } }
        @keyframes toastIn  { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes dotBounce{ 0%,80%,100%{transform:scale(0.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes slideUp  { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; }
        .chat-input:focus { outline:none; border-color: rgba(20,184,166,.6) !important; background: rgba(20,184,166,.06) !important; }
        .send-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 6px 24px rgba(20,184,166,.5) !important; }
        .send-btn:active:not(:disabled) { transform: scale(.96); }
        .msg-bubble { transition: opacity .15s; }
        .msg-bubble:hover { opacity: .92; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 4px; }
        @media (max-width: 640px) {
          .gc-container { border-radius: 0 !important; height: 100dvh !important; max-width: 100% !important; }
          .gc-header { border-radius: 0 !important; }
          .gc-footer { border-radius: 0 !important; padding-bottom: env(safe-area-inset-bottom, 12px) !important; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', background: 'rgba(20,184,166,.9)', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: '.88rem', fontWeight: 600, zIndex: 999, animation: 'toastIn .3s ease', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Clear confirm modal */}
      {showClearModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, animation: 'fadeIn .2s ease', padding: 20 }}>
          <div style={{ background: 'linear-gradient(145deg,#0f172a,#0a0f1e)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 22, padding: '28px 24px', maxWidth: 320, width: '100%', textAlign: 'center', animation: 'slideUp .3s ease' }}>
            <div style={{ fontSize: '2.8rem', marginBottom: 10 }}>🗑️</div>
            <h3 style={{ color: '#fff', fontWeight: 700, margin: '0 0 8px', fontSize: '1.15rem' }}>Clear Group History?</h3>
            <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '.85rem', marginBottom: 22, lineHeight: 1.5 }}>This removes all messages from your device only. Others can still see them.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowClearModal(false)} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '.9rem', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleClear} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '.9rem', fontFamily: 'inherit' }}>Clear All</button>
            </div>
          </div>
        </div>
      )}

      <div className="gc-container" style={{ width: '100%', maxWidth: 760, height: 'calc(100dvh - 72px)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,.025)', backdropFilter: 'blur(20px)', borderRadius: 24, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,.4)' }}>

        {/* Header */}
        <div className="gc-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg,#14b8a6,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
              👥
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>Group Chat</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,.45)', fontSize: '.75rem' }}>{onlineCount} online</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowClearModal(true)}
            style={{ padding: '7px 14px', borderRadius: 10, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', color: '#fca5a5', fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
          >
            🗑 Clear
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {messages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(255,255,255,.2)', animation: 'fadeIn .5s ease' }}>
              <div style={{ fontSize: '3.5rem' }}>💬</div>
              <p style={{ fontSize: '.9rem', margin: 0 }}>Be the first to say hello!</p>
            </div>
          )}

          {groupedMessages.map((msg, i) => {
            const isOwn = msg.from === username;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', marginTop: msg.showAvatar ? 10 : 2, animation: 'msgIn .28s ease' }}>
                {msg.showAvatar && !isOwn && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, paddingLeft: 4 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: avatarBg(msg.from), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {msg.from.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ color: 'rgba(255,255,255,.45)', fontSize: '.76rem', fontWeight: 600 }}>{msg.from}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isOwn ? 'row-reverse' : 'row', maxWidth: '82%' }}>
                  <div
                    className="msg-bubble"
                    style={{
                      padding: '9px 14px',
                      borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isOwn ? 'linear-gradient(135deg,#14b8a6,#0d9488)' : 'rgba(255,255,255,.09)',
                      color: '#fff',
                      fontSize: '.93rem',
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                      border: isOwn ? 'none' : '1px solid rgba(255,255,255,.08)',
                      boxShadow: isOwn ? '0 3px 12px rgba(20,184,166,.25)' : 'none',
                    }}
                  >
                    {msg.message}
                  </div>
                  <span style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.28)', flexShrink: 0, paddingBottom: 3 }}>{fmt(msg.ts)}</span>
                </div>
              </div>
            );
          })}

          {typingUsers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, paddingLeft: 4, animation: 'fadeIn .3s ease' }}>
              <div style={{ padding: '9px 14px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(20,184,166,.8)', animation: `dotBounce 1.2s ease ${i * .2}s infinite` }} />
                ))}
              </div>
              <span style={{ color: 'rgba(255,255,255,.35)', fontSize: '.73rem' }}>{typingUsers.join(', ')} typing…</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input footer */}
        <div className="gc-footer" style={{ padding: '12px 14px', background: 'rgba(255,255,255,.03)', borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <input
            ref={inputRef}
            className="chat-input"
            type="text"
            placeholder="Message everyone…"
            value={message}
            onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 14,
              background: inputFocused ? 'rgba(20,184,166,.06)' : 'rgba(255,255,255,.06)',
              border: inputFocused ? '1px solid rgba(20,184,166,.5)' : '1px solid rgba(255,255,255,.09)',
              color: '#fff', fontSize: '.95rem', transition: 'all .2s', fontFamily: 'inherit',
            }}
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={!message.trim()}
            style={{
              width: 46, height: 46, borderRadius: 14, border: 'none', cursor: message.trim() ? 'pointer' : 'default',
              background: message.trim() ? 'linear-gradient(135deg,#14b8a6,#0891b2)' : 'rgba(255,255,255,.06)',
              color: '#fff', fontSize: '1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .2s', flexShrink: 0, boxShadow: message.trim() ? '0 4px 16px rgba(20,184,166,.3)' : 'none',
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}
