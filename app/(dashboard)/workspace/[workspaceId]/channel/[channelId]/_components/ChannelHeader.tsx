import { ThemeToggle } from '@/components/ui/theme-toggle';
import { orpc } from '@/lib/orpc';
import { useSuspenseQuery } from '@tanstack/react-query';

const ChannelHeader = () => {
  // const {
  //   data: { channels },
  // } = useSuspenseQuery(orpc.channel.list.queryOptions());

  return (
    <div className="flex items-center justify-between h-14 px-4 border-b">
      <h1 className="text-lg font-semibold"># cool-channel-11</h1>

      <div className="flex items-center space-x-2">
        <ThemeToggle />
      </div>
    </div>
  );
};

export default ChannelHeader;
