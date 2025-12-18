'use client';
import { orpc } from '@/lib/orpc';
import { useSuspenseQuery } from '@tanstack/react-query';

const WorkspaceHeader = () => {
  const {
    data: { currentWorkspace },
  } = useSuspenseQuery(orpc.channel.list.queryOptions());

  return <h2 className="text-2xl font-bold">{currentWorkspace.orgName}</h2>;
};

export default WorkspaceHeader;
