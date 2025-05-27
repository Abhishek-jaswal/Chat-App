// socket.ts (shared socket connection for the frontend)
import { io } from 'socket.io-client';

const socket = io('https://chat-app-k9pr.onrender.com'); // Ensure this matches your backend URL
export default socket;
