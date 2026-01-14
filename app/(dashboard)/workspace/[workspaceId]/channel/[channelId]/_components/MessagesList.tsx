'use client';
import { orpc } from '@/lib/orpc';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { MessageItem } from './message/MessageItem';

const MessagesList = () => {
  const params = useParams<{ channelId: string }>();

  const { data: messages } = useQuery(
    orpc.message.list.queryOptions({ input: { channelId: params.channelId } })
  );

  if (messages == null) {
    return <p>No messages</p>;
  }
  return (
    <div className="relative h-full">
      <div className="h-full overflow-y-auto px-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
};

export default MessagesList;
