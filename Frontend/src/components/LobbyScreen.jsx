import React, { useState } from 'react';
import { Plus, LogIn, Video, Users, Clock, Zap } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { generateUserId } from '../utils/helpers';

const LobbyScreen = ({ onJoinRoom }) => {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { socket, joinRoom, createRoom } = useSocket();

  const handleCreateRoom = async () => {
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userId = userName.trim() || generateUserId();
      const result = await createRoom(userId);
      
      if (result.success) {
        const roomData = {
          roomId: result.roomId,
          userId: userId,
          isCreator: true
        };
        onJoinRoom(roomData);
      } else {
        setError(result.error || 'Failed to create room');
      }
    } catch (error) {
      setError('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userId = userName.trim();
      const result = await joinRoom(roomId.trim().toUpperCase(), userId);
      
      if (result.success) {
        const roomData = {
          roomId: roomId.trim().toUpperCase(),
          userId: userId,
          isCreator: false
        };
        onJoinRoom(roomData);
      } else {
        setError(result.error || 'Failed to join room');
      }
    } catch (error) {
      setError('Failed to join room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Welcome content */}
        <div className="text-center lg:text-left space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-6xl font-bold text-white">
              Connect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Face to Face
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-lg">
              Experience crystal-clear video calls with zero lag. Create or join a room 
              and start connecting with people instantly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-blue-200">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span>Lightning fast</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-200">
              <Video className="h-5 w-5 text-blue-400" />
              <span>HD video quality</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-200">
              <Users className="h-5 w-5 text-green-400" />
              <span>Easy to join</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-200">
              <Clock className="h-5 w-5 text-purple-400" />
              <span>No time limits</span>
            </div>
          </div>
        </div>

        {/* Right side - Action cards */}
        <div className="space-y-6">
          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-6 space-y-6">
            {/* User name input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-blue-100">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* Create Room */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Plus className="h-5 w-5 mr-2 text-green-400" />
                Create New Room
              </h3>
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span>Create Room</span>
                  </>
                )}
              </button>
              <p className="text-xs text-blue-200">
                Generate a unique room ID and share it with others
              </p>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900 text-white/60">OR</span>
              </div>
            </div>

            {/* Join Room */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <LogIn className="h-5 w-5 mr-2 text-blue-400" />
                Join Existing Room
              </h3>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter Room ID (e.g., ABC123)"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={loading}
              />
              <button
                onClick={handleJoinRoom}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>Join Room</span>
                  </>
                )}
              </button>
              <p className="text-xs text-blue-200">
                Ask the room creator for the Room ID
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;