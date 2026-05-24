import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useChat } from '../../hooks/useChat';

export default function ChatPage() {
  const { token } = useAuth();
  const location = useLocation();
  const currentUserId = token?.id;

  const {
    salas,
    selectedSalaId,
    selectSala,
    messages,
    sendMessage,
    loadMoreMessages,
    hasMore,
    connectionStatus,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (location.state?.salaId && !selectedSalaId) {
      selectSala(location.state.salaId);
    }
  }, [location.state, selectSala, selectedSalaId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const selectedSala = salas.find((s) => s.id_sala === selectedSalaId);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#0a0a0a] text-gray-200">
      <div className={`${selectedSalaId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-red-900/20 bg-[#0d0d0d]`}>
        <div className="p-4 border-b border-red-900/20 font-bold text-white">Mensajes</div>
        <div className="flex-1 overflow-y-auto">
          {salas.length === 0 ? (
            <p className="text-center p-4 text-sm text-gray-500">No tienes conversaciones</p>
          ) : (
            salas.map((sala) => (
              <button
                key={sala.id_sala}
                onClick={() => selectSala(sala.id_sala)}
                className={`w-full text-left p-4 border-b border-gray-800/50 hover:bg-[#141414] transition-colors ${selectedSalaId === sala.id_sala ? 'border-l-2 border-l-red-600 bg-[#141414]' : ''}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm truncate">{sala.nombre_otro}</span>
                  {sala.unread_count > 0 && (
                    <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{sala.unread_count}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{sala.ultimo_mensaje || 'Inicia la conversacion...'}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className={`${!selectedSalaId ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative`}> 
        {selectedSala ? (
          <>
            <div className="p-4 border-b border-red-900/20 bg-[#0d0d0d] flex items-center gap-3">
              <button onClick={() => selectSala(null)} className="md:hidden text-gray-400 font-bold px-2">←</button>
              <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center border border-gray-700">
                {selectedSala.foto_otro ? (
                  <img src={selectedSala.foto_otro} alt={selectedSala.nombre_otro} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 font-bold">{selectedSala.nombre_otro.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">{selectedSala.nombre_otro}</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <p className="text-xs text-gray-500">{connectionStatus === 'connected' ? 'Tunel Activo' : 'Reconectando...'}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a]">
              {hasMore && (
                <button onClick={loadMoreMessages} className="w-full text-xs text-red-500 hover:text-red-400 py-2 font-semibold transition-colors">
                  ↑ Cargar mensajes anteriores ↑
                </button>
              )}
              {messages.map((msg) => {
                const isMine = msg.id_remitente === currentUserId;
                return (
                  <div key={msg.id_mensaje} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 text-sm shadow-md ${isMine ? 'bg-red-800 text-white rounded-2xl rounded-tr-sm' : 'bg-[#1a1a1a] border border-gray-800 text-gray-200 rounded-2xl rounded-tl-sm'}`}>
                      <p className="whitespace-pre-wrap break-words">{msg.contenido_texto}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-red-300' : 'text-gray-500'}`}>
                        {new Date(msg.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-[#0d0d0d] border-t border-red-900/20">
              <div className="flex gap-2">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 bg-[#141414] border border-gray-800 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-red-700 transition-colors"
                  rows="1"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || connectionStatus !== 'connected'}
                  className="bg-red-700 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-6 rounded-xl font-bold transition-all active:scale-95"
                >
                  Enviar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#0a0a0a]">
            <svg className="w-16 h-16 text-gray-800 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Selecciona una conversacion para empezar a chatear</p>
          </div>
        )}
      </div>
    </div>
  );
}
