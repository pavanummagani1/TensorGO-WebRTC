import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data, type = 'info') => {
      const notification = {
        id: Date.now(),
        message: data.message || data,
        type,
        timestamp: new Date()
      };
      
      setNotifications(prev => [notification, ...prev].slice(0, 5));

      // Auto remove after 5 seconds
      setTimeout(() => {
        removeNotification(notification.id);
      }, 5000);
    };

    socket.on('user-joined', (data) => handleNotification(data, 'success'));
    socket.on('user-left', (data) => handleNotification(data, 'warning'));
    socket.on('error', (data) => handleNotification(data, 'error'));
    socket.on('room-joined', (data) => handleNotification(data, 'success'));
    socket.on('left-room', (data) => handleNotification(data, 'info'));

    return () => {
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('error');
      socket.off('room-joined');
      socket.off('left-room');
    };
  }, [socket]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getColors = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/30 text-green-100';
      case 'error':
        return 'bg-red-500/20 border-red-500/30 text-red-100';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-100';
      default:
        return 'bg-blue-500/20 border-blue-500/30 text-blue-100';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border backdrop-blur-sm ${getColors(notification.type)} 
                     transform transition-all duration-300 animate-in slide-in-from-right`}
        >
          <div className="flex items-start space-x-3">
            {getIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {notification.message}
              </p>
              <p className="text-xs opacity-75 mt-1">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Notifications;