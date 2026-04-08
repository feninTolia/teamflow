import {
  ChannelEvent,
  ChannelEventSchema,
  RealtimeMessage,
} from '@/app/schemas/realtime';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import usePartySocket from 'partysocket/react';
import { createContext, ReactNode, useContext, useMemo } from 'react';

type Props = {
  channelId: string;
  children: ReactNode;
};

type MessageListPage = { items: RealtimeMessage[]; nextCursor?: string };
type InfiniteMessages = InfiniteData<MessageListPage>;

type ChannelRealtimeContextValue = {
  send: (event: ChannelEvent) => void;
};
const ChannelRealtimeContext =
  createContext<ChannelRealtimeContextValue | null>(null);

export const ChannelRealtimeProvider = ({ channelId, children }: Props) => {
  const queryClient = useQueryClient();

  const socket = usePartySocket({
    host: 'https://teamflow-realtime.fenintolja.workers.dev',
    room: `channel-${channelId}`,
    party: 'chat',
    onMessage(e) {
      try {
        const parsed = JSON.parse(e.data);

        const result = ChannelEventSchema.safeParse(parsed);

        if (!result.success) {
          console.warn('Invalid channel event', result.error);
          return;
        }

        const event = result.data;

        if (event.type === 'message:created') {
          const raw = event.payload.message;

          // Insert at top of first page of infinite list for the channel

          queryClient.setQueryData<InfiniteMessages>(
            ['message.list', channelId],
            (old) => {
              if (!old) {
                return {
                  pageParams: [undefined],
                  pages: [{ items: [raw], nextCursor: undefined }],
                } as InfiniteMessages;
              }

              const first = old.pages[0];

              const updatedFirst: MessageListPage = {
                ...first,
                items: [raw, ...first.items],
              };

              return { ...old, pages: [updatedFirst, ...old.pages.slice(1)] };
            },
          );

          return;
        }

        if (event.type === 'message:updated') {
          const updated = event.payload.message;

          //replace the message in the infifnite list by id
          queryClient.setQueryData<InfiniteMessages>(
            ['message.list', channelId],
            (old) => {
              if (!old) return old;

              const pages = old.pages.map((p) => ({
                ...p,
                items: p.items.map((m) =>
                  m.id === updated.id ? { ...m, ...updated } : m,
                ),
              }));

              return { ...old, pages };
            },
          );

          return;
        }

        if (event.type === 'reaction:updated') {
          const { reactions, messageId } = event.payload;

          queryClient.setQueryData<InfiniteMessages>(
            ['message.list', channelId],
            (old) => {
              if (!old) return old;

              const pages = old.pages.map((p) => ({
                ...p,
                items: p.items.map((m) =>
                  m.id === messageId ? { ...m, reactions } : m,
                ),
              }));

              return { ...old, pages };
            },
          );

          return;
        }

        if (event.type === 'message:replies:increment') {
          const { delta, messageId } = event.payload;

          queryClient.setQueryData<InfiniteMessages>(
            ['message.list', channelId],
            (old) => {
              if (!old) return old;

              const pages = old.pages.map((p) => ({
                ...p,
                items: p.items.map((m) =>
                  m.id === messageId
                    ? {
                        ...m,
                        replyCount: Math.max(
                          0,
                          Number(m.replyCount ?? 0) + Number(delta),
                        ),
                      }
                    : m,
                ),
              }));

              return { ...old, pages };
            },
          );

          return;
        }
      } catch {
        console.log('Something went wrong');
      }
    },
  });

  const value = useMemo<ChannelRealtimeContextValue>(() => {
    return {
      send: (event) => {
        socket.send(JSON.stringify(event));
      },
    };
  }, [socket]);

  return (
    <ChannelRealtimeContext.Provider value={value}>
      {children}
    </ChannelRealtimeContext.Provider>
  );
};

export const useChannelRealtime = (): ChannelRealtimeContextValue => {
  const ctx = useContext(ChannelRealtimeContext);

  if (!ctx) {
    throw new Error(
      'useChannelRealtime must be used within ChannelRealtimeProvider',
    );
  }
  return ctx;
};
