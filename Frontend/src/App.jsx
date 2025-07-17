import React, { useState, useEffect } from 'react';
import { Video, Phone, PhoneOff, Users, Settings } from 'lucide-react';
import VideoRoom from './components/VideoRoom';
import LobbyScreen from './components/LobbyScreen';
import { SocketProvider } from './context/SocketContext';
import Notifications from './components/Notifications';

function App() {
  const [currentScreen, setCurrentScreen] = useState('lobby');
  const [roomData, setRoomData] = useState(null);

  const handleJoinRoom = (data) => {
    setRoomData(data);
    setCurrentScreen('video-room');
  };

  const handleLeaveRoom = () => {
    setRoomData(null);
    setCurrentScreen('lobby');
  };

  return (
    <SocketProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(156, 146, 172, 0.05) 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, rgba(156, 146, 172, 0.05) 0%, transparent 50%)`
          }}></div>
        </div>
        
        <div className="relative z-10">
          {/* Header */}
          <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Video className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">SyncRoom</h1>
                    <p className="text-sm text-blue-200">Real-time video streaming</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {roomData && (
                    <div className="flex items-center space-x-2 text-white">
                      <Users className="h-5 w-5" />
                      <span className="text-sm">Room: {roomData.roomId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentScreen === 'lobby' && (
              <LobbyScreen onJoinRoom={handleJoinRoom} />
            )}
            
            {currentScreen === 'video-room' && roomData && (
              <VideoRoom 
                roomData={roomData} 
                onLeaveRoom={handleLeaveRoom}
              />
            )}
          </main>
        </div>

        <Notifications />
      </div>
    </SocketProvider>
  );
}

export default App;