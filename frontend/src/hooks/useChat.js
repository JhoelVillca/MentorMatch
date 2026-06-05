import { useState, useEffect, useRef, useCallback } from 'react';
import { getSalas, getMensajes, markAsRead } from '../services/chatService';
import { useAuth } from '../AuthContext';

const getWsUrl = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
  const protocol = backendUrl.startsWith('https') ? 'wss:' : 'ws:';
  const host = backendUrl.replace(/^https?:\/\//, '').replace(/\/api\/?$/, '');
  const token = localStorage.getItem('access_token') || '';
  return `${protocol}//${host}/chat/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`;
};

export function useChat() {
  const { token } = useAuth();
  const currentUserId = token?.id ? String(token.id) : null;

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
        const esSalaEnFoco = data.id_sala === selectedSalaRef.current;
        if (esSalaEnFoco) {
          setMessages((prev) => {
            if (prev.some(m => m.id_mensaje === data.id_mensaje)) return prev;
            return [...prev, data];
          });
          if (data.id_remitente !== currentUserId) {
            markAsRead(data.id_sala).catch(() => {});
          }
        }
        setSalas((prevSalas) => {
          const updated = prevSalas.map((sala) => {
            if (sala.id_sala === data.id_sala) {
              return {
                ...sala,
                ultimo_mensaje: data.contenido_texto,
                ultimo_mensaje_fecha: data.fecha_envio,
                unread_count: esSalaEnFoco ? 0 : (sala.unread_count || 0) + 1,
              };
            }
            return sala;
          });
          return [...updated].sort((a, b) => new Date(b.ultimo_mensaje_fecha || 0) - new Date(a.ultimo_mensaje_fecha || 0));
        });
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
      setSalas((prevSalas) =>
        prevSalas.map((sala) =>
          sala.id_sala === salaId ? { ...sala, unread_count: 0 } : sala
        )
      );
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