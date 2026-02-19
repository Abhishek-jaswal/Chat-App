/// This component implements the private chat interface between two users, including message display, typing indicators, and message storage on the client side. It uses the useNotifications hook to send PWA notifications when a new message arrives and the tab is not in focus. Messages are stored in localStorage and are only visible on the user's device, ensuring privacy. The component also includes a modal for clearing chat history and a button for initiating video calls (handled by the VideoCall component).

'use client';
// PrivateChat.tsx — Main private chat interface component
import { useEffect, useRef, useState, useCallback } from 'react';
import socket from '../socket';
import VideoCall from './VideoCall';
import { getMessages, appendMessage, clearChat, upsertContact, StoredMessage } from '../utils/chatStorage';
import { useNotifications } from '../utils/useNotifications';

export default function PrivateChat({
  username, roomId, partner, sessionFingerprint,
}: {
  username: string; roomId: string; partner: string; sessionFingerprint: string;
}) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const partnerTypingTimer = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { notifyIfHidden } = useNotifications(sessionFingerprint);



  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Save contact + load messages
  useEffect(() => {
    upsertContact(sessionFingerprint, { username: partner, lastSeen: Date.now(), roomId });
    const stored = getMessages(sessionFingerprint, roomId);
    setMessages(stored);
  }, [sessionFingerprint, partner, roomId]);

  useEffect(() => {
    socket.on('private-message', (data: { from: string; message: string; roomId: string }) => {
      if (data.roomId !== roomId) return;
      const msg: StoredMessage = { from: data.from, message: data.message, ts: Date.now(), type: 'private' };
      appendMessage(sessionFingerprint, roomId, msg);
      setMessages((prev) => [...prev, msg]);
      if (data.from !== username) {
        notifyIfHidden(`🔒 ${data.from}`, data.message, `private-${data.from}`);
        // Update contact last message
        upsertContact(sessionFingerprint, { username: data.from, lastSeen: Date.now(), roomId, lastMessage: data.message });
      }
    });

    socket.on('partner-typing', ({ from }: { from: string }) => {
      if (from !== partner) return;
      setPartnerTyping(true);
      clearTimeout(partnerTypingTimer.current);
      partnerTypingTimer.current = setTimeout(() => setPartnerTyping(false), 2500);
    });

    return () => { socket.off('private-message'); socket.off('partner-typing'); };
  }, [roomId, partner, username, sessionFingerprint, notifyIfHidden]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!message.trim()) return;
    socket.emit('private-message', { from: username, message: message.trim(), roomId });
    setMessage('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [message, username, roomId]);

  const handleTyping = () => socket.emit('partner-typing', { from: username, to: partner, roomId });

  const handleClear = () => {
    clearChat(sessionFingerprint, roomId);
    setMessages([]);
    setShowClearModal(false);
    showToast('Chat cleared');
  };

  const avatarBg = (name: string) => {
    const g = ['135deg,#8b5cf6,#6366f1', '135deg,#3b82f6,#2563eb', '135deg,#f43f5e,#e11d48', '135deg,#f59e0b,#d97706', '135deg,#10b981,#059669', '135deg,#14b8a6,#0891b2'];
    let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % g.length;
    return `linear-gradient(${g[h]})`;
  };

  const fmt = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const grouped = messages.reduce<Array<StoredMessage & { showAvatar: boolean }>>((acc, msg, i) => {
    const prev = messages[i - 1];
    acc.push({ ...msg, showAvatar: !prev || prev.from !== msg.from || msg.ts - prev.ts > 60000 });
    return acc;
  }, []);

  return (
    <>
      <style>{`
        @keyframes msgIn   { from{opacity:0;transform:translateY(10px) scale(.96)} to{opacity:1;transform:none} }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes dotB    { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; }
        .pc-input:focus { outline:none; }
        .pc-send:hover:not(:disabled) { transform: scale(1.05); }
        .pc-send:active:not(:disabled) { transform: scale(.95); }
        ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-track { background:transparent } ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.12);border-radius:4px }
        @media (max-width: 640px) {
          .pc-wrap { border-radius:0!important; height:100dvh!important; max-width:100%!important; }
          .pc-header,.pc-footer { border-radius:0!important; }
          .pc-footer { padding-bottom: env(safe-area-inset-bottom,12px)!important; }
        }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', background: 'rgba(139,92,246,.9)', color: '#fff', padding: '10px 20px', borderRadius: 12, top: 100, fontSize: '.88rem', fontWeight: 600, zIndex: 999, animation: 'toastIn .3s ease', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {showClearModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, animation: 'fadeIn .2s ease', padding: 20 }}>
          <div style={{ background: 'linear-gradient(145deg,#0f172a,#0a0f1e)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 22, padding: '28px 24px', maxWidth: 320, width: '100%', textAlign: 'center', animation: 'slideUp .3s ease' }}>
            <div style={{ fontSize: '2.8rem', marginBottom: 10 }}>🗑️</div>
            <h3 style={{ color: '#fff', fontWeight: 700, margin: '0 0 8px', fontSize: '1.15rem' }}>Clear Chat with {partner}?</h3>
            <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '.85rem', marginBottom: 22, lineHeight: 1.5 }}>Messages will be removed from your device only.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowClearModal(false)} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleClear} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="pc-wrap" style={{ width: '100%', maxWidth: 760, height: 'calc(100dvh - 72px)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,.025)', backdropFilter: 'blur(20px)', paddingTop: '80px', borderRadius: 24, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,.4)' }}>

        {/* Header */}
        <div className="pc-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.07)', flexShrink: 0, gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: avatarBg(partner), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
                {partner.charAt(0).toUpperCase()}
              </div>
              <div style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2.5px solid rgba(10,14,25,1)' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{partner}</div>
              <div style={{ fontSize: '.73rem', marginTop: 1 }}>
                {partnerTyping
                  ? <span style={{ color: '#14b8a6' }}>typing…</span>
                  : <span style={{ color: 'rgba(255,255,255,.38)' }}>Active now</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <VideoCall username={username} partner={partner} />
            <button
              onClick={() => setShowClearModal(true)}
              style={{ padding: '7px 12px', borderRadius: 10, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', color: '#fca5a5', fontSize: '.75rem', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
            >
              🗑
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {messages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(255,255,255,.2)', animation: 'fadeIn .5s ease' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: avatarBg(partner), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: '#fff', marginBottom: 4 }}>
                {partner.charAt(0).toUpperCase()}
              </div>
              <p style={{ fontSize: '.92rem', margin: 0, fontWeight: 600, color: 'rgba(255,255,255,.4)' }}>Start chatting with {partner}</p>
              <p style={{ fontSize: '.78rem', margin: 0, color: 'rgba(255,255,255,.2)' }}>Messages are stored on your device</p>
            </div>
          )}

          {grouped.map((msg, i) => {
            const isOwn = msg.from === username;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', marginTop: msg.showAvatar ? 10 : 2, animation: 'msgIn .28s ease' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isOwn ? 'row-reverse' : 'row', maxWidth: '82%' }}>
                  {!isOwn && msg.showAvatar && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarBg(msg.from), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {msg.from.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {!isOwn && !msg.showAvatar && <div style={{ width: 28, flexShrink: 0 }} />}
                  <div style={{
                    padding: '9px 14px',
                    borderRadius: isOwn ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                    background: isOwn ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'rgba(255,255,255,.09)',
                    color: '#fff', fontSize: '.93rem', lineHeight: 1.5, wordBreak: 'break-word',
                    border: isOwn ? 'none' : '1px solid rgba(255,255,255,.08)',
                    boxShadow: isOwn ? '0 3px 12px rgba(139,92,246,.3)' : 'none',
                  }}>
                    {msg.message}
                  </div>
                  <span style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.28)', flexShrink: 0, paddingBottom: 3 }}>{fmt(msg.ts)}</span>
                </div>
              </div>
            );
          })}

          {partnerTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, animation: 'fadeIn .3s ease' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarBg(partner), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {partner.charAt(0).toUpperCase()}
              </div>
              <div style={{ padding: '9px 14px', borderRadius: '4px 18px 18px 18px', background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,.6)', animation: `dotB 1.2s ease ${i * .18}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <div className="pc-footer" style={{ padding: '12px 14px', background: 'rgba(255,255,255,.03)', borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <input
            ref={inputRef}
            className="pc-input"
            type="text"
            placeholder={`Message ${partner}…`}
            value={message}
            onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 14,
              background: inputFocused ? 'rgba(139,92,246,.08)' : 'rgba(255,255,255,.06)',
              border: inputFocused ? '1px solid rgba(139,92,246,.5)' : '1px solid rgba(255,255,255,.09)',
              color: '#fff', fontSize: '.95rem', transition: 'all .2s', outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            className="pc-send"
            onClick={sendMessage}
            disabled={!message.trim()}
            style={{
              width: 46, height: 46, borderRadius: 14, border: 'none', cursor: message.trim() ? 'pointer' : 'default',
              background: message.trim() ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'rgba(255,255,255,.06)',
              color: '#fff', fontSize: '1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .2s', flexShrink: 0, boxShadow: message.trim() ? '0 4px 16px rgba(139,92,246,.35)' : 'none',
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}
