import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
  const baseURL = import.meta.env.VITE_BASE_URL;

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(baseURL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const createRoom = async (userId) => {
    try {
      const response = await fetch(`${baseURL}/api/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ createdBy: userId }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Join the socket room after creating
        return new Promise((resolve) => {
          socket.emit('join-room', { roomId: data.roomId, userId });
          
          const handleRoomJoined = (roomData) => {
            socket.off('room-joined', handleRoomJoined);
            socket.off('error', handleError);
            resolve({ success: true, roomId: data.roomId });
          };

          const handleError = (error) => {
            socket.off('room-joined', handleRoomJoined);
            socket.off('error', handleError);
            resolve({ success: false, error: error.message });
          };

          socket.on('room-joined', handleRoomJoined);
          socket.on('error', handleError);
        });
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error creating room:', error);
      return { success: false, error: 'Failed to create room' };
    }
  };

  const joinRoom = async (roomId, userId) => {
    try {
      // First check if room exists
      const response = await fetch(`${baseURL}/api/rooms/${roomId}`);
      const data = await response.json();
      
      if (!data.success) {
        return { success: false, error: data.error };
      }

      if (!data.room.canJoin) {
        return { success: false, error: 'Room is full' };
      }

      // Join the socket room
      return new Promise((resolve) => {
        socket.emit('join-room', { roomId, userId });
        
        const handleRoomJoined = (roomData) => {
          socket.off('room-joined', handleRoomJoined);
          socket.off('error', handleError);
          resolve({ success: true, ...roomData });
        };

        const handleError = (error) => {
          socket.off('room-joined', handleRoomJoined);
          socket.off('error', handleError);
          resolve({ success: false, error: error.message });
        };

        socket.on('room-joined', handleRoomJoined);
        socket.on('error', handleError);
      });
    } catch (error) {
      console.error('Error joining room:', error);
      return { success: false, error: 'Failed to join room' };
    }
  };

  const leaveRoom = async () => {
    return new Promise((resolve) => {
      socket.emit('leave-room');
      
      const handleLeftRoom = () => {
        socket.off('left-room', handleLeftRoom);
        resolve({ success: true });
      };

      socket.on('left-room', handleLeftRoom);
    });
  };

  const value = {
    socket,
    connected,
    createRoom,
    joinRoom,
    leaveRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};