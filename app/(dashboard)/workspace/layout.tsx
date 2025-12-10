import { orpc } from '@/lib/orpc';
import { getQueryClient, HydrateClient } from '@/lib/query/hydration';
import CreateWorkspace from './_components/CreateWorkspace';
import UserNav from './_components/UserNav';
import WorkspaceList from './_components/WorkspaceList';

const WorkspaceLayout = async ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(orpc.workspace.list.queryOptions());

  return (
    <div className="flex w-full h-screen">
      <div className="flex h-full w-16 flex-col gap-4  items-center bg-secondary py-3 px-2 border-r box-border">
        <HydrateClient client={queryClient}>
          <WorkspaceList />
        </HydrateClient>

        <CreateWorkspace />

        <div className="mt-auto">
          <HydrateClient client={queryClient}>
            <UserNav />
          </HydrateClient>
        </div>
      </div>
      {children}
    </div>
  );
};

export default WorkspaceLayout;
