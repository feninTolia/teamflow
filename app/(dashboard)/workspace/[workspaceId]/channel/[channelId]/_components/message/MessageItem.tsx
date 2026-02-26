import { SafeContent } from '@/components/rich-text-editor/SafeContent';
import { getAvatar } from '@/lib/get-avatar';
import { orpc } from '@/lib/orpc';
import { MessageListItem } from '@/lib/types';
import { useThread } from '@/providers/ThreadProvider';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquareIcon } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { EditMessage } from '../toolbar/EditMessage';
import { MessageHoverToolbar } from '../toolbar/MessageHoverToolbar';
import ReactionsBar from '../reactions/RactionsBar';

type Props = {
  message: MessageListItem;
  currentUserId: string;
};

export const MessageItem = ({ message, currentUserId }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const { openThread } = useThread();
  const queryClient = useQueryClient();

  const prefetchThread = useCallback(() => {
    const options = orpc.message.thread.list.queryOptions({
      input: { messageId: message.id },
    });

    queryClient
      .prefetchQuery({ ...options, staleTime: 60_000 })
      .catch(() => {});
  }, [message.id, queryClient]);

  return (
    <div className="flex space-x-3 relative p-3 rounded-lg group hover:bg-muted/50">
      <Image
        src={getAvatar(message.authorAvatar, message.authorEmail)}
        alt="User Avatar"
        width={32}
        height={32}
        className="size-8 rounded-lg"
      />

      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center gap-x-2">
          <p className=" font-medium leading-none">{message.authorName}</p>
          <p className="text-xs text-muted-foreground leading-none">
            {new Intl.DateTimeFormat('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }).format(message.createdAt)}{' '}
            {new Intl.DateTimeFormat('en-GB', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
            }).format(message.createdAt)}
          </p>
        </div>

        {isEditing ? (
          <EditMessage
            message={message}
            onCancel={() => setIsEditing(false)}
            onSave={() => setIsEditing(false)}
          />
        ) : (
          <>
            <SafeContent
              className="text-sm wrap-break-word prose dark:prose-invert max-w-none marker:text-primary"
              content={JSON.parse(message.content)}
            />

            {message.imageUrl && (
              <div className="mt-2">
                <Image
                  src={message.imageUrl}
                  alt="Message attachment"
                  width={512}
                  height={512}
                  className="max-h-[320px] w-auto object-contain "
                />
              </div>
            )}

            <ReactionsBar
              messageId={message.id}
              reactions={message.reactions}
              context={{ type: 'list', channelId: message.channelId! }}
            />

            {message.replyCount > 0 && (
              <button
                onClick={() => openThread(message.id)}
                onMouseEnter={prefetchThread}
                onFocus={prefetchThread}
                type="button"
                className="mt-1 cursor-pointer text-xs text-accent inline-flex items-center gap-1 hover:text-foreground 
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <MessageSquareIcon className="size-3.5" />
                <span>
                  {message.replyCount}{' '}
                  {message.replyCount === 1 ? 'reply' : 'replies'}
                </span>
              </button>
            )}
          </>
        )}
      </div>

      {!isEditing && (
        <MessageHoverToolbar
          messageId={message.id}
          onEdit={() => setIsEditing(true)}
          canEdit={message.authorId === currentUserId}
        />
      )}
    </div>
  );
};
