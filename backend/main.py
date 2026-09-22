from asyncio import CancelledError, Task, create_task, sleep
from logging import getLogger
from os import getenv
from traceback import print_exception
from typing import Literal
from uuid import UUID, uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

app = FastAPI()
logger = getLogger("uvicorn.error")
load_dotenv()

origins = [
    getenv("FRONTEND_URL") or "http://localhost:5173/",
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
        self.timer: Task[None] | None = None

    def get_payload(self):
        return RoomPayload.from_room(self)

    async def broadcast(self):
        dead: list[WebSocket] = []
        for conn in self.member_list:
            try:
                await conn.send_json(
                    self.get_payload().model_dump(mode="json", by_alias=True)
                )
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


class RoomPayload(BaseModel):
    room_id: str
    member_list: list[str]
    timer_mode: Literal["focus", "break"]
    is_paused: bool
    is_timer_active: bool
    started_by: str | None
    time_remaining: int
    total_time: int

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    @classmethod
    def from_room(cls, room: Room):
        return cls(
            room_id=str(room.room_id),
            member_list=list(room.member_list.values()),
            timer_mode=room.timer_mode,
            is_paused=room.is_paused,
            is_timer_active=room.is_timer_active,
            started_by=room.started_by,
            time_remaining=room.time_remaining,
            total_time=room.total_time,
        )


class RoomConnectionManager:
    def __init__(self):
        self.active_rooms: dict[UUID, Room] = {}

    async def disconnect(self, room_id: UUID, websocket: WebSocket):
        room = self.active_rooms.get(room_id)
        if room and room.member_list.get(websocket):
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
    room = manager.active_rooms.get(room_id)
    if not room:
        await websocket.close(code=4044, reason="Room does not exist")
        return
    try:
        while True:
            data = await websocket.receive_json()
            command = data.get("command")

            room = manager.active_rooms.get(room_id)
            if room is not None:
                if command == "start":
                    started_by = room.member_list.get(websocket)
                    room.start(started_by)
                    await room.broadcast()

                elif command == "pause":
                    room.pause()
                    await room.broadcast()

                elif command == "resume":
                    room.resume()
                    await room.broadcast()

                elif command == "join_room":
                    if data.get("name"):
                        room.member_list[websocket] = data.get("name")
                        await room.broadcast()

                elif command == "set_total_time":
                    room.total_time = data.get("total_time")
                    await room.broadcast()

    except WebSocketDisconnect:
        pass
    finally:
        logger.info(f"Websocket disconnected from room {room_id}")
        await manager.disconnect(room_id, websocket)

        room = manager.active_rooms.get(room_id)
        if room:
            await room.broadcast()
