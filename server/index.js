const { createServer } = require('http');
const { Server } = require('socket.io');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*', // allow frontend from any origin (for development)
  },
});

io.on('connection', (socket) => {
  console.log(`🟢 New user connected: ${socket.id}`);

  // Store username when connected
  socket.on('user-connected', (username) => {
    socket.username = username;
    updateUsers();
  });

  // Group chat (already working)
  socket.on('group-message', ({ username, message }) => {
    console.log(`📨 ${username}: ${message}`);
    io.emit('group-message', { username, message });
  });

  // Send chat request to another user
  socket.on('private-chat-request', ({ to, from }) => {
    const target = findSocket(to);
    if (target) {
      target.emit('chat-request', { from });
    }
  });

  // Accept private chat request and create room
  socket.on('accept-private-chat', ({ from, to }) => {
    const roomId = `${from}-${to}-${Date.now()}`;
    const user1 = findSocket(from);
    const user2 = findSocket(to);

    if (user1 && user2) {
      user1.join(roomId);
      user2.join(roomId);

      console.log(`Users ${from} and ${to} joined room: ${roomId}`);

      user1.emit('private-chat-started', { roomId, partner: to });
      user2.emit('private-chat-started', { roomId, partner: from });
    }
    // WebRTC signaling: send offer
socket.on('call-user', ({ offer, to }) => {
  const target = findSocket(to);
  if (target) {
    target.emit('call-made', { offer, from: socket.username });
  }
});

// WebRTC signaling: send answer
socket.on('make-answer', ({ answer, to }) => {
  const target = findSocket(to);
  if (target) {
    target.emit('answer-made', { answer, from: socket.username });
  }
});

// ICE candidate exchange
socket.on('ice-candidate', ({ candidate, to }) => {
  const target = findSocket(to);
  if (target) {
    target.emit('ice-candidate', { candidate });
  }
});

  });

  // Private message handling
  socket.on('private-message', ({ from, message, roomId }) => {
    console.log(`Emitting private message from ${from} to room ${roomId}: ${message}`);
    io.to(roomId).emit('private-message', { from, message, roomId });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`🔴 User disconnected: ${socket.id}`);
    updateUsers();
  });

  // Utility to update all clients with list of users
  function updateUsers() {
    const users = Array.from(io.sockets.sockets.values())
      .map((s) => s.username)
      .filter(Boolean);
    io.emit('users-list', users);
  }

  // Utility to find a socket by username
  function findSocket(username) {
    return Array.from(io.sockets.sockets.values()).find((s) => s.username === username);
  }
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ WebSocket Server running on http://0.0.0.0:${PORT}`);

});
