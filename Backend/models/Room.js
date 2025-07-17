import mongoose from 'mongoose';
import { inMemoryRoomModel } from '../utils/inMemoryStorage.js';

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdBy: {
    type: String,
    required: true
  },
  participants: [{
    socketId: String,
    userId: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  maxParticipants: {
    type: Number,
    default: 2
  }
}, {
  timestamps: true
});

// Auto-delete inactive rooms after 1 hour
roomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 3600 });

const MongoRoom = mongoose.model('Room', roomSchema);

// Export a model that automatically falls back to in-memory storage
export default {
  async create(roomData) {
    if (mongoose.connection.readyState === 1) {
      return await MongoRoom.create(roomData);
    }
    return await inMemoryRoomModel.create(roomData);
  },

  async findOne(query) {
    if (mongoose.connection.readyState === 1) {
      return await MongoRoom.findOne(query);
    }
    return await inMemoryRoomModel.findOne(query);
  },

  async findOneAndUpdate(query, update, options) {
    if (mongoose.connection.readyState === 1) {
      return await MongoRoom.findOneAndUpdate(query, update, options);
    }
    return await inMemoryRoomModel.findOneAndUpdate(query, update, options);
  },

  async deleteOne(query) {
    if (mongoose.connection.readyState === 1) {
      return await MongoRoom.deleteOne(query);
    }
    return await inMemoryRoomModel.deleteOne(query);
  }
};