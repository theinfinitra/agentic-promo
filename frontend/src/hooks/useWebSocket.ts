import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentResponse, WebSocketMessage } from '../types';

const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'wss://your-api-gateway-url';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<AgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      ws.current = new WebSocket(WEBSOCKET_URL);
      
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttempts.current = 0;
      };
      
      ws.current.onmessage = (event) => {
        try {
          const message: AgentResponse = JSON.parse(event.data);
          setLastMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
          setError('Failed to parse server response');
        }
      };
      
      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setIsConnecting(false);
        
        // Only show error after first successful connection
        if (reconnectAttempts.current > 0) {
          setError('Connection lost. Reconnecting...');
        }
        
        // Auto-reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000;
          setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          setError('Unable to connect. Please refresh the page.');
        }
      };
      
      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Only show error after first connection attempt
        if (reconnectAttempts.current > 0) {
          setError('Connection error. Retrying...');
        }
        setIsConnecting(false);
      };
      
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to connect to server');
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    } else {
      setError('Not connected to server');
      return false;
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    lastMessage,
    error,
    sendMessage,
    connect,
    disconnect
  };
};
