import { useState, useEffect, useRef, useCallback } from 'react';
import { getSalas, getMensajes, markAsRead } from '../services/chatService';

const getWsUrl = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
  const protocol = backendUrl.startsWith('https') ? 'wss:' : 'ws:';
  const host = backendUrl.replace(/^https?:\/\//, '');
  return `${protocol}//${host}/api/chat/ws`;
};

export function useChat() {
  const [salas, setSalas] = useState([]);
  const [selectedSalaId, setSelectedSalaId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef(null);
  const connectTimeout = useRef(null);
  const shouldReconnectRef = useRef(true);
  const selectedSalaRef = useRef(null);

  useEffect(() => {
    selectedSalaRef.current = selectedSalaId;
  }, [selectedSalaId]);

  const refreshSalas = useCallback(async () => {
    try {
      const data = await getSalas();
      setSalas(data);
    } catch (e) {
      console.error('[Chat] Error cargando salas:', e);
    }
  }, []);

  const loadMessages = useCallback(async (salaId) => {
    if (!salaId) return;
    try {
      const page = await getMensajes(salaId);
      setMessages(page.mensajes);
      setHasMore(page.has_more);
    } catch (e) {
      console.error('[Chat] Error cargando mensajes:', e);
    }
  }, []);

  const syncChatState = useCallback(async () => {
    await refreshSalas();

    if (selectedSalaRef.current) {
      await loadMessages(selectedSalaRef.current);
      await markAsRead(selectedSalaRef.current).catch(() => {});
      await refreshSalas();
    }
  }, [loadMessages, refreshSalas]);

  const loadMoreMessages = useCallback(async () => {
    if (!selectedSalaRef.current || !hasMore || messages.length === 0) return;
    try {
      const oldest = messages[0];
      const page = await getMensajes(selectedSalaRef.current, oldest.fecha_envio);
      setMessages((prev) => [...page.mensajes, ...prev]);
      setHasMore(page.has_more);
    } catch (e) {
      console.error('[Chat] Error cargando historial:', e);
    }
  }, [messages, hasMore]);

  const connectWs = useCallback(() => {
    if (!shouldReconnectRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    setConnectionStatus('connecting');
    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
      clearTimeout(reconnectTimeout.current);
      syncChatState().catch((e) => {
        console.error('[Chat] Error sincronizando estado tras reconexion:', e);
      });
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'pong') return;

      if (data.type === 'contacts_status') {
        setOnlineUsers(new Set(data.online));
        return;
      }

      if (data.type === 'user_online') {
        setOnlineUsers((prev) => new Set([...prev, data.user_id]));
        return;
      }

      if (data.type === 'user_offline') {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.user_id);
          return next;
        });
        return;
      }

      if (data.type === 'new_message') {
        if (data.id_sala === selectedSalaRef.current) {
          setMessages((prev) => {
            if (prev.some(m => m.id_mensaje === data.id_mensaje)) return prev;
            return [...prev, data];
          });
          markAsRead(data.id_sala).catch(() => {});
        }
        refreshSalas(); 
      }
    };

    ws.onclose = (event) => {
      setConnectionStatus('disconnected');
      setOnlineUsers(new Set());
      if (!shouldReconnectRef.current) return;
      if (event.code === 1000 || event.code === 1008) return;

      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current += 1;
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = setTimeout(connectWs, delay);
    };
  }, [refreshSalas, syncChatState]);

  const sendMessage = useCallback((contenido) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN || !selectedSalaRef.current || !contenido.trim()) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'message',
      id_sala: selectedSalaRef.current,
      contenido_texto: contenido.trim(),
    }));
  }, []);

  const selectSala = useCallback((salaId) => {
    setSelectedSalaId(salaId);
    setMessages([]);
    setHasMore(false);
    if (salaId) {
      loadMessages(salaId);
      markAsRead(salaId).catch(() => {});
    }
  }, [loadMessages]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    refreshSalas();
    connectTimeout.current = setTimeout(() => {
      connectWs();
    }, 0);
    return () => {
      shouldReconnectRef.current = false;
      clearTimeout(connectTimeout.current);
      if (wsRef.current) wsRef.current.close(1000);
      clearTimeout(reconnectTimeout.current);
    };
  }, [connectWs, refreshSalas]);

  return {
    salas,
    selectedSalaId,
    selectSala,
    messages,
    sendMessage,
    loadMoreMessages,
    hasMore,
    connectionStatus,
    onlineUsers,
    refreshSalas,
  };
}