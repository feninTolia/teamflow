import { SafeContent } from '@/components/rich-text-editor/SafeContent';
import { MessageListItem } from '@/lib/types';
import Image from 'next/image';
import ReactionsBar from '../reactions/RactionsBar';

type Props = {
  reply: MessageListItem;
  selectedThreadId: string;
};

export const ThreadReply = ({ reply, selectedThreadId }: Props) => {
  console.log('reply', reply);

  return (
    <div className="flex space-x-3 p-3 hover:bg-muted/70 rounded-lg">
      <Image
        src={reply.authorAvatar}
        alt="Author Image"
        width={24}
        height={24}
        className="size-6 rounded-full shrink-0"
      />
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm ">{reply.authorName}</span>
          <span className="text-xs text-muted-foreground">
            {Intl.DateTimeFormat('en-UK', {
              hour: 'numeric',
              minute: 'numeric',
              hour12: false,
              month: 'short',
              day: 'numeric',
            }).format(reply.createdAt)}
          </span>
        </div>

        <SafeContent
          content={JSON?.parse?.(reply?.content)}
          className="text-sm wrap-break-word prose dark:prose-invert max-w-none marker:text-primary"
        />

        {reply.imageUrl && (
          <div className="mt-2">
            <Image
              src={reply.imageUrl}
              alt="Message Attachment"
              width={512}
              height={512}
              className="rounded-md max-h-[320px] w-auto object-contain"
            />
          </div>
        )}

        <ReactionsBar
          context={{ type: 'thread', threadId: selectedThreadId }}
          messageId={reply.id}
          reactions={reply.reactions}
        />
      </div>
    </div>
  );
};
