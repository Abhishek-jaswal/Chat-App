'use client';

import { useEffect, useState } from 'react';
import socket from '../socket'; // make sure this path is correct

export default function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Listen for updated user list from server
    socket.on('update-user-list', (data) => {
      setUsers(data);
    });

    // Optional: cleanup on unmount
    return () => {
      socket.off('update-user-list');
    };
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl mt-4 w-full max-w-md text-white shadow-md">
      <h2 className="text-xl font-bold mb-3">🟢 Online Users</h2>
      <ul className="divide-y divide-white/20">
        {users.map((user, idx) => (
          <li key={idx} className="py-2 flex items-center justify-between">
            <div>
              <p className="font-semibold">{user.sessionUserName}</p>
              <p className="text-sm text-gray-300">{user.appUsername}</p>
            </div>
            <span
              className={`text-sm px-3 py-1 rounded-full ${
                user.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
              }`}
            >
              {user.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
