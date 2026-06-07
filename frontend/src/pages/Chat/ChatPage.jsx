import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useChat } from '../../hooks/useChat';
import { Send, MessageSquare, Search, ChevronLeft } from 'lucide-react';

export default function ChatPage() {
  const { token } = useAuth();
  const location = useLocation();
  const currentUserId = token?.id ? String(token.id) : '1';

  const {
    salas,
    selectedSalaId,
    selectSala,
    messages,
    sendMessage,
    loadMoreMessages,
    hasMore,
    connectionStatus,
    onlineUsers,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (location.state?.salaId && !selectedSalaId) {
      selectSala(location.state.salaId);
    }
  }, [location.state, selectSala, selectedSalaId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedSalaId) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedSalaId]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedSala = salas.find(s => s.id_sala === selectedSalaId);
  const isConnected = connectionStatus === 'connected';

  const filteredSalas = searchQ.trim()
    ? salas.filter(s => s.nombre_otro?.toLowerCase().includes(searchQ.toLowerCase()))
    : salas;

  const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Hoy';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div className={`${selectedSalaId ? 'hidden md:flex' : 'flex'} w-full md:w-72 lg:w-80 flex-col bg-white border-r border-slate-100 flex-shrink-0`}>
        {/* Sidebar header */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900">Mensajes</h2>
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
              isConnected ? 'text-green-700 bg-green-50' : 'text-slate-500 bg-slate-100'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
              {isConnected ? 'En línea' : 'Reconectando'}
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar conversación..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
            />
          </div>
        </div>

        {/* Sala list */}
        <div className="flex-1 overflow-y-auto">
          {filteredSalas.length === 0 ? (
            <div className="text-center p-10">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
                <MessageSquare size={20} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">Sin conversaciones.</p>
            </div>
          ) : (
            filteredSalas.map((sala, i) => {
              const isOnline = onlineUsers.has(sala.contraparte_user_id);
              const isActive = selectedSalaId === sala.id_sala;
              return (
                <button
                  key={sala.id_sala}
                  onClick={() => selectSala(sala.id_sala)}
                  className={`w-full text-left px-4 py-3.5 border-b border-slate-50 transition-all duration-150 slide-up ${
                    isActive
                      ? 'bg-primary-50 border-l-[3px] border-l-primary-500'
                      : 'hover:bg-slate-50 border-l-[3px] border-l-transparent'
                  }`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        isActive ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {sala.nombre_otro?.charAt(0).toUpperCase()}
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold truncate ${isActive ? 'text-primary-700' : 'text-slate-900'}`}>
                          {sala.nombre_otro}
                        </span>
                        {sala.unread_count > 0 && (
                          <span className="bg-primary-600 text-white text-[10px] font-bold min-w-[18px] h-4.5 px-1 rounded-full flex items-center justify-center flex-shrink-0 ml-1">
                            {sala.unread_count > 99 ? '99+' : sala.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{sala.ultimo_mensaje || 'Inicia la conversación...'}</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`${!selectedSalaId ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 bg-white`}>
        {selectedSala ? (
          <>
            {/* Chat header */}
            <div className="px-5 py-3.5 bg-white border-b border-slate-100 flex items-center gap-3 shadow-sm flex-shrink-0">
              <button
                onClick={() => selectSala(null)}
                className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                  {selectedSala.foto_otro ? (
                    <img src={selectedSala.foto_otro} alt={selectedSala.nombre_otro} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    selectedSala.nombre_otro.charAt(0).toUpperCase()
                  )}
                </div>
                {onlineUsers.has(selectedSala.contraparte_user_id) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedSala.nombre_otro}</p>
                <p className="text-xs text-slate-500">
                  {onlineUsers.has(selectedSala.contraparte_user_id) ? (
                    <span className="text-green-600 font-medium">En línea</span>
                  ) : 'Desconectado'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-1 bg-slate-50/50">
              {hasMore && (
                <button onClick={loadMoreMessages} className="w-full text-xs text-primary-600 hover:text-primary-700 py-2.5 font-medium transition-colors bg-white rounded-xl border border-slate-100 mb-4">
                  Cargar mensajes anteriores
                </button>
              )}

              {messages.map((msg, i) => {
                const isMine = msg.id_remitente === currentUserId;
                const prevMsg = messages[i - 1];
                const isNewGroup = !prevMsg || prevMsg.id_remitente !== msg.id_remitente;
                const showDate = !prevMsg || formatDate(msg.fecha_envio) !== formatDate(prevMsg.fecha_envio);

                return (
                  <div key={msg.id_mensaje}>
                    {showDate && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-[11px] text-slate-400 font-medium bg-white border border-slate-100 px-3 py-1 rounded-full flex-shrink-0">
                          {formatDate(msg.fecha_envio)}
                        </span>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                    )}
                    <div
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isNewGroup ? 'mt-3' : 'mt-0.5'} slide-up`}
                      style={{ animationDelay: `${Math.min(i * 30, 200)}ms` }}
                    >
                      {!isMine && isNewGroup && (
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold mr-2 mt-auto mb-0.5 flex-shrink-0">
                          {selectedSala.nombre_otro.charAt(0)}
                        </div>
                      )}
                      {!isMine && !isNewGroup && <div className="w-7 mr-2 flex-shrink-0" />}

                      <div className={`max-w-[70%] group ${isMine ? '' : ''}`}>
                        <div className={`px-4 py-2.5 text-sm leading-relaxed ${
                          isMine
                            ? 'bg-primary-600 text-white rounded-2xl rounded-tr-md shadow-sm shadow-primary-600/20'
                            : 'bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-tl-md shadow-sm'
                        }`}>
                          <p className="whitespace-pre-wrap break-words">{msg.contenido_texto}</p>
                        </div>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-right text-slate-400' : 'text-slate-400'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {formatTime(msg.fecha_envio)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-4 bg-white border-t border-slate-100 flex-shrink-0">
              <div className="flex gap-3 items-end">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje... (Enter para enviar)"
                  rows="1"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all placeholder:text-slate-400 leading-relaxed max-h-32"
                  style={{ minHeight: '44px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || !isConnected}
                  className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90 shadow-sm shadow-primary-600/20"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 pl-1">Enter para enviar · Shift+Enter nueva línea</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 animate-in">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5">
              <MessageSquare size={36} className="text-slate-200" />
            </div>
            <p className="text-base font-semibold text-slate-700">Tus mensajes</p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">Selecciona una conversación de la lista para comenzar a chatear.</p>
          </div>
        )}
      </div>
    </div>
  );
}
