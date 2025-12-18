import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { orpc } from '@/lib/orpc';
import { getQueryClient, HydrateClient } from '@/lib/query/hydration';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import ChannelList from './_components/ChannelList';
import CreateNewChannel from './_components/CreateNewChannel';
import WorkspaceHeader from './_components/WorkspaceHeader';
import { WorkspaceMembersList } from './_components/WorkspaceMembersList';

const ChannelListLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(orpc.channel.list.queryOptions());

  return (
    <>
      <div className="flex h-full w-80 flex-col bg-secondary border-r border-border">
        {/* Header */}
        <div className="flex items-center px-4 h-14 border-b border-border">
          <HydrateClient client={queryClient}>
            <WorkspaceHeader />
          </HydrateClient>
        </div>

        <div className="px-4 py-2">
          <CreateNewChannel />
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto px-4">
          <Collapsible defaultOpen>
            <CollapsibleTrigger
              className="flex w-full items-center justify-between px-2 py-1 text-sm font-medium text-muted-foreground 
            hover:text-accent-foreground [&[data-state=open]>svg]:rotate-180"
            >
              Main
              <ChevronDownIcon className="size-4 transition-transform duration-200" />
            </CollapsibleTrigger>

            <CollapsibleContent>
              <HydrateClient client={queryClient}>
                <ChannelList />
              </HydrateClient>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Members List */}
        <div className="px-4 py-2 border-t border-border">
          <Collapsible defaultOpen>
            <CollapsibleTrigger
              className="flex w-full items-center justify-between
             px-2 py-1 text-sm font-medium text-muted-foreground hover:text-accent-foreground [&[data-state=open]>svg]:rotate-180"
            >
              Members
              <ChevronUpIcon className="size-4 transition-transform duration-200" />
            </CollapsibleTrigger>

            <CollapsibleContent>
              <HydrateClient client={queryClient}>
                <WorkspaceMembersList />
              </HydrateClient>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
      {children}
    </>
  );
};

export default ChannelListLayout;
