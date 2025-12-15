import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HashIcon } from 'lucide-react';
import Link from 'next/link';

const CHNNEL_LIST = [
  {
    id: 1,
    name: 'General',
  },
  {
    id: 2,
    name: 'Announcements',
  },
  {
    id: 3,
    name: 'Feedback',
  },
  {
    id: 4,
    name: 'Random',
  },
];

const ChannelList = () => {
  return (
    <div className="space-y-0.5 py-1">
      {CHNNEL_LIST.map((channel) => (
        <Link
          key={channel.id}
          href={'#'}
          className={buttonVariants({
            variant: 'ghost',
            className: cn(
              'w-full justify-start px-2 py-1 h-7 text-muted-foreground  hover:text-accent-foreground hover:bg-accent!'
            ),
          })}
        >
          <HashIcon className="size-4" />
          <span className="truncate"> {channel.name}</span>
        </Link>
      ))}
    </div>
  );
};

export default ChannelList;
