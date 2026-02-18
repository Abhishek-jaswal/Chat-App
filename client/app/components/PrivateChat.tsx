'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import socket from '../socket';
import VideoCall from './VideoCall';
import { getMessages, appendMessage, clearChat, upsertContact, StoredMessage } from '../utils/chatStorage';

const keyframes = `
@keyframes msgIn   { from{opacity:0;transform:translateY(8px) scale(.97);} to{opacity:1;transform:translateY(0) scale(1);} }
@keyframes typing  { 0%,80%,100%{transform:scale(1);opacity:.4;} 40%{transform:scale(1.4);opacity:1;} }
@keyframes fadeIn  { from{opacity:0;} to{opacity:1;} }
@keyframes pulse   { 0%,100%{opacity:1;} 50%{opacity:.4;} }
`;

export default function PrivateChat({
  username, roomId, partner, sessionFingerprint,
}: {
  username: string; roomId: string; partner: string; sessionFingerprint: string;
}) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout>();
  const partnerTypingTimeout = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Save contact ── */
  useEffect(() => {
    upsertContact(sessionFingerprint, { username: partner, lastSeen: Date.now(), roomId });
  }, [partner, roomId, sessionFingerprint]);

  /* ── Load stored messages ── */
  useEffect(() => {
    const stored = getMessages(sessionFingerprint, roomId);
    setMessages(stored);
  }, [sessionFingerprint, roomId]);

  useEffect(() => {
    socket.on('private-message', (data: { from: string; message: string; roomId: string }) => {
      if (data.roomId !== roomId) return;
      const msg: StoredMessage = { from: data.from, message: data.message, ts: Date.now(), type: 'private' };
      appendMessage(sessionFingerprint, roomId, msg);
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('partner-typing', ({ from }: { from: string }) => {
      if (from !== partner) return;
      setIsTyping(true);
      clearTimeout(partnerTypingTimeout.current);
      partnerTypingTimeout.current = setTimeout(() => setIsTyping(false), 2500);
    });

    return () => {
      socket.off('private-message');
      socket.off('partner-typing');
    };
  }, [roomId, partner, sessionFingerprint]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!message.trim()) return;
    socket.emit('private-message', { from: username, message: message.trim(), roomId });
    setMessage('');
    inputRef.current?.focus();
  }, [message, username, roomId]);

  const handleTyping = () => {
    socket.emit('typing', { from: username, to: partner, roomId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => { }, 1500);
  };

  const handleClearHistory = () => {
    clearChat(sessionFingerprint, roomId);
    setMessages([]);
    setShowClearConfirm(false);
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const avatarColor = (name: string) => {
    const colors = ['#7c3aed', '#0891b2', '#db2777', '#d97706', '#16a34a', '#14b8a6'];
    let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
    return colors[h];
  };

  return (

    <div style={{ width: '100%', maxWidth: 760, height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', padding: '0 16px 16px', boxSizing: 'border-box' as const, position: 'relative' }}>
      <style>{keyframes}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(255,255,255,.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '20px 20px 0 0', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: avatarColor(partner), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: '#fff', position: 'relative' }}>
            {partner.charAt(0).toUpperCase()}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid #0a0a0f' }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>{partner}</div>
            <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '.75rem' }}>
              {isTyping ? (
                <span style={{ color: '#14b8a6', animation: 'pulse 1s ease infinite' }}>typing…</span>
              ) : 'Active now'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <VideoCall username={username} partner={partner} />
          <button
            onClick={() => setShowClearConfirm(true)}
            style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: '#f87171', fontSize: '.75rem', cursor: 'pointer' }}
          >
            🗑 Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.08)', borderTop: 'none', borderBottom: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.25)', gap: 8 }}>
            <div style={{ fontSize: '3rem' }}>🔒</div>
            <p style={{ fontSize: '.9rem' }}>Start your private conversation</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.from === username;
          const prevSame = i > 0 && messages[i - 1].from === msg.from;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', animation: 'msgIn .28s ease', marginTop: prevSame ? 2 : 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                {!prevSame && !isOwn && (
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: avatarColor(msg.from), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {msg.from.charAt(0).toUpperCase()}
                  </div>
                )}
                {(prevSame || isOwn) && !isOwn && <div style={{ width: 26 }} />}
                <div style={{
                  maxWidth: '68%', padding: '10px 15px',
                  borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isOwn ? 'linear-gradient(135deg,#7c3aed,#0891b2)' : 'rgba(255,255,255,.08)',
                  color: '#fff', fontSize: '.93rem', lineHeight: 1.5, wordBreak: 'break-word' as const,
                  border: isOwn ? 'none' : '1px solid rgba(255,255,255,.1)',
                  boxShadow: isOwn ? '0 4px 16px rgba(124,58,237,.3)' : 'none',
                }}>
                  {msg.message}
                </div>
                <span style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.3)', whiteSpace: 'nowrap' as const }}>{formatTime(msg.ts)}</span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, animation: 'fadeIn .3s ease' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: avatarColor(partner), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 700, color: '#fff' }}>
              {partner.charAt(0).toUpperCase()}
            </div>
            <div style={{ padding: '10px 14px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,.6)', animation: `typing 1.2s ease ${i * .18}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '0 0 20px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={`Message ${partner}…`}
          style={{ flex: 1, padding: '12px 18px', borderRadius: 14, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', fontSize: '.95rem', outline: 'none' }}
          value={message}
          onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={!message.trim()}
          style={{ padding: '12px 22px', borderRadius: 14, background: message.trim() ? 'linear-gradient(135deg,#7c3aed,#0891b2)' : 'rgba(255,255,255,.06)', color: '#fff', fontWeight: 700, border: 'none', cursor: message.trim() ? 'pointer' : 'default', transition: 'all .2s', boxShadow: message.trim() ? '0 4px 16px rgba(124,58,237,.3)' : 'none' }}
        >
          Send ↑
        </button>
      </div>

      {/* Clear confirm */}
      {showClearConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, animation: 'fadeIn .2s ease' }}>
          <div style={{ background: 'rgba(15,20,30,.95)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 20, padding: '28px 32px', maxWidth: 340, textAlign: 'center' as const }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🗑️</div>
            <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>Clear Chat History?</h3>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.88rem', marginBottom: 20 }}>This permanently removes messages with <strong style={{ color: '#fff' }}>{partner}</strong> from your device.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowClearConfirm(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleClearHistory} style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
