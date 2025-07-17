import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebRTC = (socket, roomId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [peers, setPeers] = useState(new Map());
  
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  const initializeLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Error getting user media:', error);
      throw error;
    }
  }, []);

  const createPeerConnection = useCallback((targetSocketId, isInitiator = false) => {
    const peerConnection = new RTCPeerConnection(iceServers);
    
    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => new Map(prev.set(targetSocketId, remoteStream)));
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer connection state: ${peerConnection.connectionState}`);
      
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed') {
        // Clean up this peer
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(targetSocketId);
          return newMap;
        });
        
        setPeers(prev => {
          const newMap = new Map(prev);
          newMap.delete(targetSocketId);
          return newMap;
        });
        
        peersRef.current.delete(targetSocketId);
      }
    };

    // Store peer connection
    peersRef.current.set(targetSocketId, peerConnection);
    setPeers(prev => new Map(prev.set(targetSocketId, peerConnection)));

    return peerConnection;
  }, [socket]);

  const connectToPeers = useCallback(async (participants) => {
    if (!socket || !localStreamRef.current || participants.length === 0) return;

    for (const participant of participants) {
      if (!peersRef.current.has(participant.socketId)) {
        const peerConnection = createPeerConnection(participant.socketId, true);
        
        try {
          // Create and send offer
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          
          socket.emit('offer', {
            targetSocketId: participant.socketId,
            offer: offer
          });
        } catch (error) {
          console.error('Error creating offer:', error);
        }
      }
    }
  }, [socket, createPeerConnection]);

  const toggleVideo = useCallback((enabled) => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
      }
    }
  }, []);

  const toggleAudio = useCallback((enabled) => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
      }
    }
  }, []);

  const cleanupConnections = useCallback(() => {
    // Close all peer connections
    peersRef.current.forEach((peerConnection) => {
      peerConnection.close();
    });
    
    // Clear all state
    peersRef.current.clear();
    setPeers(new Map());
    setRemoteStreams(new Map());
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleOffer = async (data) => {
      const { offer, fromSocketId } = data;
      
      if (!peersRef.current.has(fromSocketId)) {
        const peerConnection = createPeerConnection(fromSocketId, false);
        
        try {
          await peerConnection.setRemoteDescription(offer);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          socket.emit('answer', {
            targetSocketId: fromSocketId,
            answer: answer
          });
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      }
    };

    const handleAnswer = async (data) => {
      const { answer, fromSocketId } = data;
      const peerConnection = peersRef.current.get(fromSocketId);
      
      if (peerConnection) {
        try {
          await peerConnection.setRemoteDescription(answer);
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      }
    };

    const handleIceCandidate = async (data) => {
      const { candidate, fromSocketId } = data;
      const peerConnection = peersRef.current.get(fromSocketId);
      
      if (peerConnection) {
        try {
          await peerConnection.addIceCandidate(candidate);
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    };

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
    };
  }, [socket, createPeerConnection]);

  return {
    localStream,
    remoteStreams,
    peers,
    initializeLocalMedia,
    connectToPeers,
    toggleVideo,
    toggleAudio,
    cleanupConnections
  };
};