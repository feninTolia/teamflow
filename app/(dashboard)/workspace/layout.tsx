import CreateWorkspace from './_components/CreateWorkspace';
import UserNav from './_components/UserNav';
import WorkspaceList from './_components/WorkspaceList';

const WorkspaceLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex w-full h-screen">
      <div className="flex h-full w-16 flex-col gap-4  items-center bg-secondary py-3 px-2 border-r box-border">
        <WorkspaceList />
        <CreateWorkspace />

        <div className="mt-auto">
          <UserNav />
        </div>
      </div>
      {children}
    </div>
  );
};

export default WorkspaceLayout;
