// chatStorage.ts — session-namespaced localStorage manager
const PREFIX = 'chatapp_v2';

export function makeFingerprint(seed: string): string {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
    return Math.abs(h).toString(36);
}

const contactsKey = (fp: string) => `${PREFIX}_${fp}_contacts`;
const chatKey = (fp: string, room: string) => `${PREFIX}_${fp}_chat_${room}`;
const unreadKey = (fp: string) => `${PREFIX}_${fp}_unread`;
const settingsKey = (fp: string) => `${PREFIX}_${fp}_settings`;

export function clearAllChatData(fp: string | null): void {
    const del: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) {
            if (!fp || k.includes(`_${fp}_`)) del.push(k);
        }
    }
    del.forEach((k) => localStorage.removeItem(k));
}

export interface Contact {
    username: string;
    lastSeen: number;
    roomId?: string;
    lastMessage?: string;
}

export function getContacts(fp: string): Contact[] {
    try { return JSON.parse(localStorage.getItem(contactsKey(fp)) || '[]'); }
    catch { return []; }
}

export function upsertContact(fp: string, contact: Contact): void {
    const list = getContacts(fp);
    const i = list.findIndex((c) => c.username === contact.username);
    if (i >= 0) list[i] = { ...list[i], ...contact };
    else list.unshift(contact);
    localStorage.setItem(contactsKey(fp), JSON.stringify(list));
}

export interface StoredMessage {
    from: string;
    message: string;
    ts: number;
    type: 'group' | 'private';
}

export function getMessages(fp: string, roomId: string): StoredMessage[] {
    try { return JSON.parse(localStorage.getItem(chatKey(fp, roomId)) || '[]'); }
    catch { return []; }
}

export function appendMessage(fp: string, roomId: string, msg: StoredMessage): void {
    const msgs = getMessages(fp, roomId);
    msgs.push(msg);
    localStorage.setItem(chatKey(fp, roomId), JSON.stringify(msgs.slice(-300)));
}

export function clearChat(fp: string, roomId: string): void {
    localStorage.removeItem(chatKey(fp, roomId));
}

export function getUnread(fp: string): Record<string, number> {
    try { return JSON.parse(localStorage.getItem(unreadKey(fp)) || '{}'); }
    catch { return {}; }
}

export function incrementUnread(fp: string, roomId: string): void {
    const u = getUnread(fp);
    u[roomId] = (u[roomId] || 0) + 1;
    localStorage.setItem(unreadKey(fp), JSON.stringify(u));
}

export function clearUnread(fp: string, roomId: string): void {
    const u = getUnread(fp);
    delete u[roomId];
    localStorage.setItem(unreadKey(fp), JSON.stringify(u));
}

export interface ChatSettings {
    notificationsGranted: boolean;
    soundEnabled: boolean;
}

export function getSettings(fp: string): ChatSettings {
    try { return { notificationsGranted: false, soundEnabled: true, ...JSON.parse(localStorage.getItem(settingsKey(fp)) || '{}') }; }
    catch { return { notificationsGranted: false, soundEnabled: true }; }
}

export function saveSettings(fp: string, s: Partial<ChatSettings>): void {
    localStorage.setItem(settingsKey(fp), JSON.stringify({ ...getSettings(fp), ...s }));
}
