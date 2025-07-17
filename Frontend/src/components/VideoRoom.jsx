import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Copy, 
  Users,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../hooks/useWebRTC';

const VideoRoom = ({ roomData, onLeaveRoom }) => {
  const [localStream, setLocalStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [copied, setCopied] = useState(false);
  
  const localVideoRef = useRef(null);
  const { socket, leaveRoom } = useSocket();
  
  const {
    remoteStreams,
    initializeLocalMedia,
    connectToPeers,
    toggleVideo,
    toggleAudio,
    cleanupConnections
  } = useWebRTC(socket, roomData.roomId);

  useEffect(() => {
    const setupMedia = async () => {
      try {
        const stream = await initializeLocalMedia();
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Failed to get user media:', error);
      }
    };

    setupMedia();

    return () => {
      cleanupConnections();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('user-joined', (data) => {
      setParticipants(prev => [...prev, data]);
      // Initiate connection with new user
      connectToPeers([data]);
    });

    socket.on('user-left', (data) => {
      setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
    });

    socket.on('room-joined', (data) => {
      setParticipants(data.participants || []);
      if (data.participants && data.participants.length > 0) {
        connectToPeers(data.participants);
      }
    });

    return () => {
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('room-joined');
    };
  }, [socket, connectToPeers]);

  const handleToggleVideo = () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    toggleVideo(newState);
  };

  const handleToggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    toggleAudio(newState);
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      cleanupConnections();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      onLeaveRoom();
    } catch (error) {
      console.error('Error leaving room:', error);
      onLeaveRoom();
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomData.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[90vh] flex flex-col">
      {/* Room Header */}
      <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-white font-medium">Room: {roomData.roomId}</span>
            </div>
            <button
              onClick={copyRoomId}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <Copy className="h-4 w-4" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-blue-200">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{participants.length + 1} participant(s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Local Video */}
        <div className="relative group">
          <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden border border-white/20">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                <div className="text-center">
                  <VideoOff className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Camera off</p>
                </div>
              </div>
            )}
          </div>
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
            You {roomData.isCreator && '(Host)'}
          </div>
          <div className="absolute top-4 right-4 flex space-x-2">
            {!isAudioEnabled && (
              <div className="bg-red-500 p-2 rounded-full">
                <MicOff className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Remote Videos */}
        {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
          <RemoteVideo 
            key={peerId} 
            stream={stream} 
            peerId={peerId}
            participants={participants}
          />
        ))}

        {/* Placeholder for waiting */}
        {participants.length === 0 && (
          <div className="aspect-video bg-slate-800/50 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center">
            <div className="text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">Waiting for participants</h3>
              <p className="text-gray-400 text-sm max-w-xs">
                Share the room ID <strong>{roomData.roomId}</strong> with others to start the call
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg p-6">
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={handleToggleAudio}
            className={`p-4 rounded-full transition-all transform hover:scale-110 ${
              isAudioEnabled 
                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </button>

          <button
            onClick={handleToggleVideo}
            className={`p-4 rounded-full transition-all transform hover:scale-110 ${
              isVideoEnabled 
                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </button>

          <button
            onClick={handleLeaveRoom}
            className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all transform hover:scale-110"
          >
            <PhoneOff className="h-6 w-6" />
          </button>

          <button className="p-4 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-all transform hover:scale-110">
            <Settings className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

const RemoteVideo = ({ stream, peerId, participants }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const participant = participants.find(p => p.socketId === peerId);
  const displayName = participant?.userId || `User ${peerId.slice(-4)}`;

  return (
    <div className="relative group">
      <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden border border-white/20">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
        {displayName}
      </div>
    </div>
  );
};

export default VideoRoom;