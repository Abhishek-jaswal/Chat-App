// socket.ts (shared socket connection for the frontend)
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001'); // Ensure this matches your backend URL
export default socket;
