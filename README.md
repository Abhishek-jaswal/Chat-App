<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f2027,50:203a43,100:2c5364&height=180&section=header&text=💬%20ChatSphere&fontSize=48&fontColor=ffffff&fontAlignY=38&desc=Real-Time%20Chat%20%2B%20Video%20Calling%20Platform&descAlignY=58&descColor=67e8f9&animation=fadeIn" width="100%" />

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

> **Full-stack real-time chat with peer-to-peer video calling — built with WebSockets and WebRTC**

[🚀 Live Demo](#) · [🐛 Report Bug](https://github.com/Abhishek-jaswal/chat-video-app/issues) · [✨ Request Feature](https://github.com/Abhishek-jaswal/chat-video-app/issues)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗨️ **Group Chat** | Real-time messaging across all connected users |
| 🔒 **Private Chat** | One-to-one messaging with a friend request system |
| 👥 **Live Online Users** | See who's online in real-time |
| 📹 **Video Calling** | Peer-to-peer video calls via WebRTC |
| 🔔 **Call Notifications** | Accept / Decline incoming call alerts |
| 🌐 **ICE Candidate Exchange** | Smart media routing for stable connections |

---

## 🖼️ Preview

<div align="center">

### 📹 Video Calling
![Chat Demo](./client/public/chatt.gif)

### 🗨️ Chat Interface
![Chat Interface](./client/public/screenshot.jpeg)

### 🔒 Private Chat
![Private Chat](./client/public/secondscreenshot.jpeg)

### 👥 Group Chat
![Group Chat](./client/public/thirdscreenshot.jpeg)

</div>

---

## 🛠️ Tech Stack

```
Frontend     → Next.js · React · TypeScript
Backend      → Node.js · Express · Socket.IO
Video        → WebRTC · ICE Candidate Exchange
Real-time    → WebSockets (Socket.IO)
```

---

## 🏗️ Project Structure

```
chat-video-app/
├── client/                   # Next.js Frontend
│   ├── components/           # Reusable UI components
│   ├── pages/                # App routes
│   └── socket.ts             # Socket.IO client setup
│
├── server/                   # Node.js Backend
│   └── index.js              # Socket.IO + WebRTC signaling server
│
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js `v18+`
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/Abhishek-jaswal/chat-video-app.git
cd chat-video-app
```

### 2. Install dependencies

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 3. Run the app

```bash
# Terminal 1 — Start the WebSocket server
cd server
node index.js

# Terminal 2 — Start the Next.js frontend
cd client
npm run dev
```

### 4. Open in browser

```
http://localhost:3000
```

> 💡 Open in **two browser windows** to test chat and video calling between users.

---

## 🔭 How It Works

```
User A                  Signaling Server               User B
  |                      (Socket.IO)                     |
  |──── offer ─────────────────────────────────────────► |
  |                                                       |
  | ◄─── answer ─────────────────────────────────────── |
  |                                                       |
  |──── ICE candidates ──────────────────────────────► |
  |                                                       |
  |◄════════════ P2P Video Stream (WebRTC) ════════════► |
```

The signaling server handles the WebRTC handshake — once connected, video streams directly peer-to-peer with no server in the middle.

---

## 🛣️ Roadmap

- [ ] User authentication (JWT)
- [ ] Persistent message history (PostgreSQL)
- [ ] Group video calling
- [ ] File & image sharing
- [ ] Mobile responsive UI improvements
- [ ] Deployable Docker setup

---

## 👨‍💻 Author

**Abhishek Jaswal**

[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=flat-square&logo=vercel&logoColor=white)](https://abhishek-jaswal.vercel.app/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/abhishekjaswall)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat-square&logo=github&logoColor=white)](https://github.com/Abhishek-jaswal)

---

<div align="center">

⭐ **If you found this useful, give it a star!** ⭐

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f2027,50:203a43,100:2c5364&height=80&section=footer" width="100%" />

</div>
