from asyncio import CancelledError, Task, create_task, sleep
from logging import getLogger
from traceback import print_exception
from typing import Literal
from uuid import UUID, uuid4

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
logger = getLogger("uvicorn.error")

origins = [
    "http://localhost:5173",  # Local Vite frontend
    "https://yourfrontend.com",  # Production frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Room:
    def __init__(self, room_id: UUID):
        self.room_id: UUID = room_id
        # use websocket id as key
        self.member_list: dict[WebSocket, str] = {}
        self.timer_mode: Literal["focus", "break"] = "focus"
        self.is_paused: bool = False
        self.time_remaining: int = 0
        self.is_timer_active: bool = False
        self.started_by: str | None = None
        self.total_time: int = 0
        self.timer: Task | None = None

    def get_payload(self):
        return {
            "roomId": str(self.room_id),
            "memberList": list(self.member_list.values()),
            "timerMode": self.timer_mode,
            "isPaused": self.is_paused,
            "isTimerActive": self.is_timer_active,
            "startedBy": self.started_by,
            "timeRemaining": self.time_remaining,
            "totalTime": self.total_time,
        }

    async def broadcast(self):
        dead = []
        for conn in self.member_list:
            try:
                await conn.send_json(self.get_payload())
            except Exception as exc:
                print_exception(type(exc), exc, exc.__traceback__)
                dead.append(conn)
        for conn in dead:
            del self.member_list[conn]

    async def _run_timer(self):
        try:
            while self.time_remaining > 0:
                if self.is_paused:
                    # Idle sleep if paused to avoid CPU pinning
                    await sleep(0.2)
                else:
                    await self.broadcast()
                    await sleep(1)
                    self.time_remaining -= 1

            self.is_timer_active = False
            self.started_by = None
            self.total_time = 0
            if self.timer_mode == "focus":
                self.timer_mode = "break"
            else:
                self.timer_mode = "focus"
            await self.broadcast()
        except CancelledError:
            pass

    def start(self, started_by: str | None):
        self.is_timer_active = True
        self.started_by = started_by
        self.time_remaining = self.total_time
        if not self.timer or self.timer.done():
            self.timer = create_task(self._run_timer())

    def pause(self):
        self.is_paused = True

    def resume(self):
        self.is_paused = False


class RoomConnectionManager:
    def __init__(self):
        self.active_rooms: dict[UUID, Room] = {}

    async def disconnect(self, room_id: UUID, websocket: WebSocket):
        if self.active_rooms.get(room_id) and self.active_rooms.get(
            room_id
        ).member_list.get(websocket):
            del self.active_rooms[room_id].member_list[websocket]
            if not self.active_rooms[room_id].member_list:
                del self.active_rooms[room_id]
        else:
            await websocket.close(code=4044, reason="Room does not exist")


manager = RoomConnectionManager()


@app.post("/create-room")
def create_room():
    room_id = uuid4()
    manager.active_rooms[room_id] = Room(room_id)
    logger.info(f"Created room {room_id}")
    return {"roomId": str(room_id)}


@app.websocket("/ws/{room_id}")
async def join_room(websocket: WebSocket, room_id: UUID):
    await websocket.accept()
    logger.info(f"Attemping to join room {room_id}")
    if not manager.active_rooms.get(room_id):
        await websocket.close(code=4044, reason="Room does not exist")
        return
    try:
        while True:
            data = await websocket.receive_json()
            command = data.get("command")

            if command == "start":
                if manager.active_rooms.get(room_id):
                    started_by = manager.active_rooms.get(room_id).member_list.get(
                        websocket
                    )
                    manager.active_rooms.get(room_id).start(started_by)
                    await manager.active_rooms.get(room_id).broadcast()

            elif command == "pause":
                if manager.active_rooms.get(room_id):
                    manager.active_rooms.get(room_id).pause()
                    await manager.active_rooms.get(room_id).broadcast()

            elif command == "resume":
                if manager.active_rooms.get(room_id):
                    manager.active_rooms.get(room_id).resume()
                    await manager.active_rooms.get(room_id).broadcast()

            elif command == "join_room":
                if manager.active_rooms.get(room_id) and data.get("name"):
                    logger.info(manager.active_rooms.get(room_id).get_payload())
                    manager.active_rooms.get(room_id).member_list[websocket] = data.get(
                        "name"
                    )
                    await manager.active_rooms.get(room_id).broadcast()

            elif command == "set_total_time":
                if manager.active_rooms.get(room_id):
                    logger.info(manager.active_rooms.get(room_id).get_payload())
                    manager.active_rooms.get(room_id).total_time = data.get(
                        "total_time"
                    )
                    await manager.active_rooms.get(room_id).broadcast()

    except WebSocketDisconnect:
        pass
    finally:
        logger.info(f"Websocket disconnected from room {room_id}")
        await manager.disconnect(room_id, websocket)
        if manager.active_rooms.get(room_id):
            await manager.active_rooms.get(room_id).broadcast()
