import { useState, useEffect, useRef } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Modal, Button, TextInput, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import MemberRail from '@/components/MemberRail';
import Timer from '@/components/Timer';
import TimerPicker from '@/components/TimerPicker';

interface IRoom {
  roomId: string;
  memberList: string[];
  timerMode: TimerMode;
  isPaused: boolean;
  isTimerActive: boolean;
  timeRemaining: number;
  totalTime: number;
  startedBy: string | null;
}

export type TimerMode = 'focus' | 'break';

export const Route = createFileRoute('/$roomId')({
  component: Room,
});

function Room() {
  const [opened, { close }] = useDisclosure(true);
  const { roomId } = Route.useParams();

  const [room, setRoom] = useState<IRoom | null>(null);

  const navigate = useNavigate({ from: '/$roomId' });

  const [name, setName] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(`${import.meta.env.VITE_API_URL ?? ''}/ws/${roomId}`);
    wsRef.current = socket;

    socket.onmessage = (event) => {
      const data: IRoom = JSON.parse(event.data);
      setRoom(data);
    };

    socket.onclose = (event) => {
      if (event.code === 4044) {
        navigate({ to: '/' });
      }
    };

    return () => {
      socket.close(1000, 'component unmounted');
    };
  }, [roomId]);

  const joinRoom = () => {
    if (!name) {
      return;
    }
    wsRef.current?.send(JSON.stringify({ command: 'join_room', name: name }));
    close();
  };

  return (
    <>
      <Modal
        aria-labelledby="Name Select"
        opened={opened}
        onClose={close}
        centered
        withCloseButton={false}
        closeOnClickOutside={false}
      >
        <Stack align="center">
          <TextInput
            variant="unstyled"
            aria-label="Name input"
            placeholder="What's your name?"
            styles={{ input: { textAlign: 'center' } }}
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          <Button
            variant="default"
            aria-label="Join room"
            onClick={joinRoom}
            disabled={name === ''}
          >
            JOIN ROOM
          </Button>
        </Stack>
      </Modal>
      {room && (
        <Stack h="75%" align="center">
          {!room.isTimerActive && (
            <TimerPicker
              timerMode={room.timerMode}
              memberCount={room.memberList.length}
              totalTime={room.totalTime}
              setTotalTime={(minutes: number) => {
                wsRef.current?.send(
                  JSON.stringify({ command: 'set_total_time', total_time: minutes * 60 })
                );
              }}
              start={() => {
                if (room.isTimerActive === false) {
                  wsRef.current?.send(JSON.stringify({ command: 'start' }));
                }
              }}
            />
          )}
          {room.isTimerActive && (
            <Timer
              isPaused={room.isPaused}
              timeRemaining={room.timeRemaining}
              timerMode={room.timerMode}
              totalTime={room.totalTime}
              startedBy={room.startedBy}
              resume={() => {
                if (room.isPaused === true) {
                  wsRef.current?.send(JSON.stringify({ command: 'resume' }));
                }
              }}
              pause={() => {
                if (room.isPaused === false) {
                  wsRef.current?.send(JSON.stringify({ command: 'pause' }));
                }
              }}
            />
          )}
          <MemberRail
            members={room.memberList}
            timeRemaining={room.timeRemaining}
            paused={room.isPaused}
          />
        </Stack>
      )}
    </>
  );
}
