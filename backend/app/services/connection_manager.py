import asyncio
from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    def connect(self, user_id: str, websocket: WebSocket) -> bool:
        was_offline = user_id not in self.active_connections or len(self.active_connections[user_id]) == 0
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        return was_offline

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
            except ValueError:
                pass

    def is_online(self, user_id: str) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    async def send_personal_message(self, user_id: str, message: dict):
        if user_id not in self.active_connections:
            return

        stale_sockets = []
        sockets = list(self.active_connections[user_id])
        
        async def _send(ws):
            try:
                await ws.send_json(message)
            except Exception:
                stale_sockets.append(ws)

        await asyncio.gather(*[_send(ws) for ws in sockets])

        for ws in stale_sockets:
            self.disconnect(user_id, ws)

    async def broadcast_to_contacts(self, contact_ids: list[str], message: dict):
        await asyncio.gather(*[
            self.send_personal_message(uid, message)
            for uid in contact_ids
        ])

manager = ConnectionManager()

