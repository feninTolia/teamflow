import { useState } from 'react';
import { usePartySocket } from 'partysocket/react';
import {
  PresenceMessage,
  PresenceMessageSchema,
  User,
} from '@/app/schemas/realtime';

interface Props {
  room: string;
  currentUser: User | null;
}

export function usePresence({ room, currentUser }: Props) {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  const socket = usePartySocket({
    host: 'http://localhost:8787',
    room,
    party: 'chat',
    onOpen: () => {
      console.log('Connected to presence room:', room);

      if (currentUser) {
        const message: PresenceMessage = {
          type: 'add-user',
          payload: currentUser,
        };

        socket.send(JSON.stringify(message));
      }
    },

    onMessage: (event) => {
      try {
        const message = JSON.parse(event.data);

        const result = PresenceMessageSchema.safeParse(message);

        if (result.success && result.data.type === 'presence') {
          setOnlineUsers(result.data.payload.users);
        }
      } catch (error) {
        console.log('Failed to parse message', error);
      }
    },

    onClose: () => {
      console.log('Disconected from presence room', room);
    },

    onError: (error) => {
      console.error('Websocket error', error);
    },
  });

  return { onlineUsers, socket };
}
