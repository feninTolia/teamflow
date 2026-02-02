import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { client } from '@/lib/orpc';
import { HashIcon } from 'lucide-react';
import { redirect } from 'next/navigation';
import CreateNewChannel from './_components/CreateNewChannel';

interface IAppProps {
  params: Promise<{ workspaceId: string }>;
}

const WorkspaceIdPage = async ({ params }: IAppProps) => {
  const { channels } = await client.channel.list();

  if (channels.length > 0) {
    return redirect(
      `/workspace/${(await params).workspaceId}/channel/${channels[0].id}`,
    );
  }
  return (
    <div className="flex flex-1 p-16">
      <Empty className="border border-dashed from-muted/50 to-background h-full bg-gradient-to-b from-30%">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HashIcon />
          </EmptyMedia>
          <EmptyTitle>No channels yet!</EmptyTitle>
          <EmptyDescription>
            Create a channel to start chatting.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="max-w-xs mx-auto">
          <CreateNewChannel />
        </EmptyContent>
      </Empty>
    </div>
  );
};

export default WorkspaceIdPage;
