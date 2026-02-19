
import asyncio
import json
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_FILE = "output.json"

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async contract(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

async def watch_pathway_output():
    """Reads the last line of output.json and broadcasts via WebSocket."""
    last_pos = 0
    while True:
        if os.path.exists(OUTPUT_FILE):
            with open(OUTPUT_FILE, "r") as f:
                f.seek(last_pos)
                lines = f.readlines()
                last_pos = f.tell()
                
                for line in lines:
                    if line.strip():
                        await manager.broadcast(line.strip())
        
        await asyncio.sleep(0.5) # Poll for new lines written by Pathway

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(watch_pathway_output())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.contract(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
