import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useChat } from '../../hooks/useChat';

export default function ChatPage() {
  const { token } = useAuth();
  const location = useLocation();
  const currentUserId = token?.id ? String(token.id) : null;

  const { salas, selectedSalaId, selectSala, messages, sendMessage, loadMoreMessages, hasMore, connectionStatus, onlineUsers } = useChat();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (location.state?.salaId && !selectedSalaId) selectSala(location.state.salaId);
  }, [location.state, selectSala, selectedSalaId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const selectedSala = salas.find((s) => s.id_sala === selectedSalaId);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#050505] text-gray-200 overflow-hidden font-sans">
      {/* Fondo con textura sutil */}
      <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ef4444 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}></div>

      {/* Sidebar: Estilo "Command Center" */}
      <div className={`${selectedSalaId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-red-900/30 bg-[#0d0d0d]/90 backdrop-blur-xl z-10`}>
        <div className="p-5 font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 text-xl tracking-tighter">CHAT CENTRAL</div>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-red-900">
          {salas.map((sala) => {
            const isOnline = onlineUsers.has(sala.contraparte_user_id);
            return (
              <button key={sala.id_sala} onClick={() => selectSala(sala.id_sala)}
                className={`w-full text-left p-4 transition-all hover:bg-red-900/10 border-b border-white/5 ${selectedSalaId === sala.id_sala ? 'bg-red-900/20 border-l-4 border-l-red-600' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center font-bold text-red-500 shadow-lg">{sala.nombre_otro.charAt(0)}</div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0d0d0d] ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate">{sala.nombre_otro}</p>
                    <p className="text-[10px] text-gray-500 truncate">{sala.ultimo_mensaje || 'No hay mensajes aún'}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area: Estilo "Cyberpunk" */}
      <div className={`${!selectedSalaId ? 'hidden md:flex' : 'flex'} flex-1 flex-col z-10 bg-black/20`}>
        {selectedSala ? (
          <>
            <div className="p-4 border-b border-red-900/30 bg-[#0d0d0d]/80 backdrop-blur-md flex items-center gap-4">
              <button onClick={() => selectSala(null)} className="md:hidden text-red-500 font-bold">←</button>
              <div className="w-10 h-10 rounded-lg bg-red-600/10 flex items-center justify-center text-red-500 border border-red-500/20 font-black">
                {selectedSala.nombre_otro.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-white">{selectedSala.nombre_otro}</h3>
                <span className={`text-[9px] uppercase tracking-widest ${onlineUsers.has(selectedSala.contraparte_user_id) ? 'text-green-500' : 'text-gray-500'}`}>
                  {onlineUsers.has(selectedSala.contraparte_user_id) ? '● En línea' : '○ Desconectado'}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {hasMore && <button onClick={loadMoreMessages} className="w-full text-xs text-red-500 hover:text-red-400 py-2">Cargar historial...</button>}
              {messages.map((msg) => {
                const isMine = msg.id_remitente === currentUserId;
                return (
                  <div key={msg.id_mensaje} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 px-5 rounded-2xl ${isMine ? 'bg-red-700 text-white rounded-br-none shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-[#1a1a1a] border border-white/5 rounded-bl-none'}`}>
                      <p className="text-sm">{msg.contenido_texto}</p>
                      <p className={`text-[9px] mt-1 opacity-70 text-right ${isMine ? 'text-red-200' : 'text-gray-400'}`}>
                        {new Date(msg.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-[#0d0d0d] border-t border-red-900/30">
              <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-full border border-white/5 shadow-inner">
                <input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe algo épico..."
                  className="flex-1 bg-transparent px-5 py-2 text-sm focus:outline-none text-white"
                />
                <button onClick={handleSend} className="bg-red-600 hover:bg-red-500 text-white px-8 rounded-full font-bold text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] active:scale-95">
                  Enviar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-700">
            <div className="text-6xl mb-4">🚀</div>
            <p className="font-bold text-gray-500">Selecciona un chat para despegar</p>
          </div>
        )}
      </div>
    </div>
  );
}