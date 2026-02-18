// chatStorage.ts - JWT/Session-based localStorage manager
// Stores chats & contacts namespaced under a session fingerprint.
// Wipes all data automatically when the session/cookie is gone.

const PREFIX = 'chatapp_v1';

/** Create a deterministic fingerprint from user info */
export function makeFingerprint(email: string): string {
    // Simple hash for namespacing – NOT a security token, just isolation
    let h = 0;
    for (let i = 0; i < email.length; i++) {
        h = (Math.imul(31, h) + email.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(36);
}

/** Key helpers */
const contactsKey = (fp: string) => `${PREFIX}_${fp}_contacts`;
const chatKey = (fp: string, roomId: string) => `${PREFIX}_${fp}_chat_${roomId}`;
const metaKey = (fp: string) => `${PREFIX}_${fp}_meta`;

/** Guard: if no fingerprint provided wipe everything for this prefix & return */
export function guardSession(fp: string | null): boolean {
    if (!fp) {
        clearAllChatData(null);
        return false;
    }
    return true;
}

/** Wipe ALL chatapp data from localStorage (called on logout / no cookie) */
export function clearAllChatData(fp: string | null): void {
    const toDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) {
            // If fp given, only wipe that user's data; else wipe everything
            if (!fp || k.includes(`_${fp}_`)) toDelete.push(k);
        }
    }
    toDelete.forEach((k) => localStorage.removeItem(k));
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export interface Contact {
    username: string;
    lastSeen: number;
    roomId?: string;
}

export function getContacts(fp: string): Contact[] {
    try {
        return JSON.parse(localStorage.getItem(contactsKey(fp)) || '[]');
    } catch {
        return [];
    }
}

export function upsertContact(fp: string, contact: Contact): void {
    const contacts = getContacts(fp);
    const idx = contacts.findIndex((c) => c.username === contact.username);
    if (idx >= 0) contacts[idx] = { ...contacts[idx], ...contact };
    else contacts.unshift(contact);
    localStorage.setItem(contactsKey(fp), JSON.stringify(contacts));
}

// ─── Messages ────────────────────────────────────────────────────────────────

export interface StoredMessage {
    from: string;
    message: string;
    ts: number;
    type: 'group' | 'private';
}

export function getMessages(fp: string, roomId: string): StoredMessage[] {
    try {
        return JSON.parse(localStorage.getItem(chatKey(fp, roomId)) || '[]');
    } catch {
        return [];
    }
}

export function appendMessage(fp: string, roomId: string, msg: StoredMessage): void {
    const msgs = getMessages(fp, roomId);
    msgs.push(msg);
    // Keep last 200 messages per room
    const trimmed = msgs.slice(-200);
    localStorage.setItem(chatKey(fp, roomId), JSON.stringify(trimmed));
    // Update meta timestamp
    try {
        const meta = JSON.parse(localStorage.getItem(metaKey(fp)) || '{}');
        meta[roomId] = Date.now();
        localStorage.setItem(metaKey(fp), JSON.stringify(meta));
    } catch { }
}

export function clearChat(fp: string, roomId: string): void {
    localStorage.removeItem(chatKey(fp, roomId));
}