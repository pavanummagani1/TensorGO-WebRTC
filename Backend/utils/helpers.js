import crypto from 'crypto';

export const generateRoomId = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

export const generateUserId = () => {
  return `user_${crypto.randomBytes(3).toString('hex')}`;
};