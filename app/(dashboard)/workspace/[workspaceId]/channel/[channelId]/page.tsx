'use client';
import { Skeleton } from '@/components/ui/skeleton';
import { orpc } from '@/lib/orpc';
import { KindeUser } from '@kinde-oss/kinde-auth-nextjs';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import ChannelHeader from './_components/ChannelHeader';
import MessageInputForm from './_components/message/MessageInputForm';
import MessagesList from './_components/MessagesList';

const ChannelPageMain = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const { data, error, isLoading } = useQuery(
    orpc.channel.get.queryOptions({ input: { channelId } }),
  );

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="flex h-screen w-full ">
      <div className="flex flex-col flex-1 min-w-0">
        {isLoading ? (
          <div className="flex justify-between items-center px-4 h-14 border-b">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ) : (
          <ChannelHeader channelName={data?.channelName} />
        )}

        {/* Scrollable messages */}
        <div className="flex-1 overflow-hidden mb-4">
          <MessagesList />
        </div>

        {/* Fixed input */}
        <div className="border-t bg-background p-4">
          <MessageInputForm
            channelId={channelId}
            user={data?.currentUser as KindeUser<unknown>}
          />
        </div>
      </div>
    </div>
  );
};

export default ChannelPageMain;
