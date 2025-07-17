import RoomModel from '../models/Room.js';

export const handleSocketConnection = (socket, io) => {
  console.log(`User connected: ${socket.id}`);

  // Handle joining a room
  socket.on('join-room', async (data) => {
    try {
      const { roomId, userId } = data;
      
      if (!roomId || !userId) {
        socket.emit('error', { message: 'Room ID and User ID are required' });
        return;
      }

      // Find room in database
      const room = await RoomModel.findOne({ roomId, isActive: true });
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Check if room is full
      if (room.participants.length >= room.maxParticipants) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      // Join the socket room
      socket.join(roomId);
      
      // Add participant to database
      room.participants.push({
        socketId: socket.id,
        userId: userId
      });
      await RoomModel.findOneAndUpdate(
        { roomId },
        { participants: room.participants },
        { new: true }
      );

      console.log(`User ${userId} joined room ${roomId}`);

      // Notify others in the room
      socket.to(roomId).emit('user-joined', { 
        userId, 
        socketId: socket.id,
        message: `${userId} joined the room`
      });

      // Send current participants to the new user
      const otherParticipants = room.participants.filter(p => p.socketId !== socket.id);
      socket.emit('room-joined', { 
        roomId, 
        participants: otherParticipants,
        message: 'Successfully joined the room'
      });

      // Store room info in socket
      socket.roomId = roomId;
      socket.userId = userId;

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle WebRTC signaling
  socket.on('signal', (data) => {
    const { targetSocketId, signal, type } = data;
    
    if (!targetSocketId || !signal) {
      return;
    }

    // Forward signal to target peer
    socket.to(targetSocketId).emit('signal', {
      signal,
      type,
      fromSocketId: socket.id,
      fromUserId: socket.userId
    });
  });

  // Handle offer for WebRTC
  socket.on('offer', (data) => {
    const { targetSocketId, offer } = data;
    socket.to(targetSocketId).emit('offer', {
      offer,
      fromSocketId: socket.id,
      fromUserId: socket.userId
    });
  });

  // Handle answer for WebRTC
  socket.on('answer', (data) => {
    const { targetSocketId, answer } = data;
    socket.to(targetSocketId).emit('answer', {
      answer,
      fromSocketId: socket.id,
      fromUserId: socket.userId
    });
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (data) => {
    const { targetSocketId, candidate } = data;
    socket.to(targetSocketId).emit('ice-candidate', {
      candidate,
      fromSocketId: socket.id,
      fromUserId: socket.userId
    });
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      console.log(`User disconnected: ${socket.id}`);
      
      if (socket.roomId) {
        // Remove from database
        const room = await RoomModel.findOne({ roomId: socket.roomId });
        if (room) {
          room.participants = room.participants.filter(p => p.socketId !== socket.id);
          
          // Delete room if no participants left
          if (room.participants.length === 0) {
            await RoomModel.deleteOne({ roomId: socket.roomId });
          } else {
            await RoomModel.findOneAndUpdate(
              { roomId: socket.roomId },
              { participants: room.participants },
              { new: true }
            );
          }
        }

        // Notify others in the room
        socket.to(socket.roomId).emit('user-left', {
          userId: socket.userId,
          socketId: socket.id,
          message: `${socket.userId} left the room`
        });
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  // Handle leaving room manually
  socket.on('leave-room', async () => {
    try {
      if (socket.roomId) {
        // Remove from database
        const room = await RoomModel.findOne({ roomId: socket.roomId });
        if (room) {
          room.participants = room.participants.filter(p => p.socketId !== socket.id);
          
          if (room.participants.length === 0) {
            await RoomModel.deleteOne({ roomId: socket.roomId });
          } else {
            await RoomModel.findOneAndUpdate(
              { roomId: socket.roomId },
              { participants: room.participants },
              { new: true }
            );
          }
        }

        // Leave socket room
        socket.leave(socket.roomId);
        
        // Notify others
        socket.to(socket.roomId).emit('user-left', {
          userId: socket.userId,
          socketId: socket.id,
          message: `${socket.userId} left the room`
        });

        socket.roomId = null;
        socket.userId = null;
        
        socket.emit('left-room', { message: 'Successfully left the room' });
      }
    } catch (error) {
      console.error('Error leaving room:', error);
      socket.emit('error', { message: 'Failed to leave room' });
    }
  });
};