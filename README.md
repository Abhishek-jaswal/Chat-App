# 💬 Real-Time Chat App with Video Calling

A full-stack real-time chat application built with:

- **Next.js (React + TypeScript)** – Frontend  
- **Node.js + Socket.IO** – WebSocket backend  
- **WebRTC** – Peer-to-peer video calling  

---

## 🚀 Features

✅ Group chat  
✅ Private chat with request system  
✅ Live online users list  
✅ One-to-one video calling  
✅ Call notifications (Accept / Decline)  
✅ Peer-to-peer connection using WebRTC  
✅ ICE candidate exchange for media routing  

---

## 🖼️ Screenshots

### 🗨️ Chat Interface  
![Chat UI](./screenshots/chat-ui.png)

### 📞 Incoming Call Prompt  
![Incoming Call](./screenshots/incoming-call.png)

### 🔴 Active Video Call  
![Video Call](./screenshots/video-call.png)

---

## 🏗️ Project Structure

chat-video-app/
├── client/ # Next.js frontend
│ ├── components/
│ ├── pages/
│ └── socket.ts # Socket.IO frontend setup
│
├── server/ # WebSocket backend
│ └── index.js # Socket.IO + WebRTC signaling
│
├── screenshots/ # Screenshots for README
└── README.md

---

## ⚙️ Getting Started Locally

### 1. Clone the repo

```bash
git clone https://github.com/your-username/chat-video-app.git
cd chat-video-app

cd server
npm install

cd ../client
npm install

cd ../server
node index.js

cd ../client
npm run dev
