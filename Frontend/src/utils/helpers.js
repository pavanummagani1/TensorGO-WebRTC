export const generateUserId = () => {
  return `user_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString();
};

export const validateRoomId = (roomId) => {
  return /^[A-Z0-9]{6,8}$/.test(roomId);
};