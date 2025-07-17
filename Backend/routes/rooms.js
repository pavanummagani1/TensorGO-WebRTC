import express from 'express';
import RoomModel from '../models/Room.js';
import { generateRoomId } from '../utils/helpers.js';

const router = express.Router();

// Create a new room
router.post('/create', async (req, res) => {
  try {
    const { createdBy } = req.body;
    
    if (!createdBy) {
      return res.status(400).json({ error: 'createdBy is required' });
    }

    const roomId = generateRoomId();
    
    const room = await RoomModel.create({
      roomId,
      createdBy,
      participants: []
    });

    res.json({ 
      success: true, 
      roomId, 
      message: 'Room created successfully' 
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Check if room exists and get room info
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await RoomModel.findOne({ roomId, isActive: true });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
      success: true,
      room: {
        roomId: room.roomId,
        participantCount: room.participants.length,
        maxParticipants: room.maxParticipants,
        canJoin: room.participants.length < room.maxParticipants
      }
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Get active rooms (for admin/debugging purposes)
router.get('/', async (req, res) => {
  try {
    const rooms = await RoomModel.find({ isActive: true })
      .select('roomId participantCount createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({ success: true, rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

export default router;