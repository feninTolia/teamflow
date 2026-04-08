import { GroupedReactionSchemaType } from '@/app/schemas/message';
import { Button } from '@/components/ui/button';
import { orpc } from '@/lib/orpc';
import { MessageListItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useChannelRealtime } from '@/providers/ChannelRealtimeProvider';
import { useOptionalThreadRealTime } from '@/providers/ThreadRealtimeProvider';
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import EmojiReaction from './EmojiReaction';

type ThreadContext = {
  type: 'thread';
  threadId: string;
};

type ListContext = {
  type: 'list';
  channelId: string;
};

type MessagePage = {
  items: MessageListItem[];
  nextCursor?: string;
};

type InfiniteReplies = InfiniteData<MessagePage>;

type Props = {
  messageId: string;
  reactions?: GroupedReactionSchemaType[];
  context?: ThreadContext | ListContext;
};

const ReactionsBar = ({ messageId, reactions, context }: Props) => {
  const { channelId } = useParams<{ channelId: string }>();
  const queryClient = useQueryClient();
  const { send } = useChannelRealtime();
  const threadRealtime = useOptionalThreadRealTime();

  const toggleMutation = useMutation(
    orpc.message.reaction.toggle.mutationOptions({
      onMutate: async (vars: { messageId: string; emoji: string }) => {
        const bump = (reactions: GroupedReactionSchemaType[]) => {
          const found = reactions.find((r) => r.emoji === vars.emoji);

          if (!found) {
            return [
              ...reactions,
              { emoji: vars.emoji, count: 1, reactedByMe: true },
            ];
          }

          if (found.reactedByMe) {
            // User is removing their reaction
            const nextCount = found.count - 1;

            return nextCount <= 0
              ? reactions.filter((r) => r.emoji !== found.emoji)
              : reactions.map((r) =>
                  r.emoji === found.emoji
                    ? { ...r, reactedByMe: false, count: nextCount }
                    : r,
                );
          }

          // User is adding their reaction
          return reactions.map((r) =>
            r.emoji === found.emoji
              ? { ...r, reactedByMe: true, count: found.count + 1 }
              : r,
          );
        };

        const isThread = context && context.type === 'thread';

        if (isThread) {
          const listOptions = orpc.message.thread.list.queryOptions({
            input: { messageId: context.threadId },
          });

          await queryClient.cancelQueries({ queryKey: listOptions.queryKey });
          const prevThread = queryClient.getQueryData(listOptions.queryKey);

          queryClient.setQueryData(listOptions.queryKey, (old) => {
            if (!old) return old;

            if (vars.messageId === context.threadId) {
              return {
                ...old,
                parent: {
                  ...old.parent,
                  reactions: bump(old.parent.reactions),
                },
              };
            }

            return {
              ...old,
              messages: old.messages.map((m) =>
                m.id === vars.messageId
                  ? { ...m, reactions: bump(m.reactions) }
                  : m,
              ),
            };
          });

          return { prevThread, threadQueryKey: listOptions.queryKey };
        }

        const listKey = ['message.list', channelId];
        await queryClient.cancelQueries({ queryKey: listKey });
        const previous = queryClient.getQueryData(listKey);

        queryClient.setQueryData<InfiniteReplies>(listKey, (old) => {
          if (!old) return old;

          const pages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((m) => {
              if (m.id !== messageId) return m;

              return { ...m, reactions: bump(m.reactions) };
            }),
          }));

          return { ...old, pages };
        });

        return { previous, listKey };
      },
      onSuccess: (data) => {
        send({ type: 'reaction:updated', payload: data });

        if (context && context.type === 'thread' && threadRealtime) {
          const threadId = context.threadId;

          threadRealtime.send({
            type: 'thread:reaction:updated',
            payload: { ...data, threadId },
          });
        }
        return toast.success('Reaction toggled');
      },
      onError: (_err, _vars, ctx) => {
        if (ctx?.threadQueryKey && ctx.prevThread) {
          queryClient.setQueryData(ctx.threadQueryKey, ctx.prevThread);
        }

        if (ctx?.listKey && ctx.previous) {
          queryClient.setQueryData(ctx.listKey, ctx.previous);
        }
        return toast.error('Emoji not found');
      },
    }),
  );

  const handleToggle = (emoji: string) => {
    toggleMutation.mutate({ messageId, emoji });
  };

  return (
    <div className="mt-1 flex items-center gap-1">
      {reactions?.map((r) => (
        <Button
          key={r.emoji}
          type="button"
          variant="ghost"
          size={'sm'}
          className={cn(
            'h-6 px-2 text-xs bg-accent/10 hover:text-foreground',
            r.reactedByMe && 'bg-accent/20 border-accent/40 border',
          )}
          onClick={() => handleToggle(r.emoji)}
        >
          <span>{r.emoji}</span>
          <span>{r.count}</span>
        </Button>
      ))}
      <EmojiReaction onSelect={handleToggle} />
    </div>
  );
};

export default ReactionsBar;
