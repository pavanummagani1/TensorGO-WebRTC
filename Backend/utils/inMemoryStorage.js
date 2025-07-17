// In-memory storage fallback when MongoDB is not available
let rooms = new Map();

export const initInMemoryStorage = () => {
  console.log('Initializing in-memory storage...');
  rooms.clear();
};

export const inMemoryRoomModel = {
  async create(roomData) {
    const room = {
      _id: roomData.roomId,
      roomId: roomData.roomId,
      createdBy: roomData.createdBy,
      participants: roomData.participants || [],
      isActive: roomData.isActive !== undefined ? roomData.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    rooms.set(room.roomId, room);
    return room;
  },

  async findOne(query) {
    if (query.roomId) {
      return rooms.get(query.roomId) || null;
    }
    return null;
  },

  async findOneAndUpdate(query, update, options = {}) {
    const room = rooms.get(query.roomId);
    if (!room) {
      if (options.upsert) {
        const newRoom = {
          _id: query.roomId,
          roomId: query.roomId,
          ...update,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        rooms.set(query.roomId, newRoom);
        return newRoom;
      }
      return null;
    }

    const updatedRoom = {
      ...room,
      ...update,
      updatedAt: new Date()
    };
    rooms.set(query.roomId, updatedRoom);
    return updatedRoom;
  },

  async deleteOne(query) {
    if (query.roomId) {
      const existed = rooms.has(query.roomId);
      rooms.delete(query.roomId);
      return { deletedCount: existed ? 1 : 0 };
    }
    return { deletedCount: 0 };
  }
};