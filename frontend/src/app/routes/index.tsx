import { useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: IndexComponent,
});

function IndexComponent() {
  const navigate = useNavigate({ from: '/' });

  useEffect(() => {
    const createRoom = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/create-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '0',
        },
      });
      if (response.ok) {
        const data = (await response.json()) as { roomId: string };
        close();
        navigate({ to: '/$roomId', params: { roomId: data.roomId } });
      }
    };
    createRoom();
  }, []);

  return <></>;
}
