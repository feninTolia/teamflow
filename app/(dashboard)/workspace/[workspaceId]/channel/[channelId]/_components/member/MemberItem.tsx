import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getAvatar } from '@/lib/get-avatar';
import { organization_user } from '@kinde/management-api-js';
import Image from 'next/image';

type Props = { member: organization_user };

const MemberItem = ({ member }: Props) => {
  return (
    <div className="px-3 py-2 hover:bg-accent cursor-pointer transition-color group">
      <div className="flex items-center space-x-3 ">
        <div className="relative">
          <Avatar className="size-8">
            <Image
              src={getAvatar(member.picture, member.email!)}
              alt="avatar"
              fill
              className="object-cover"
            />
            <AvatarFallback>
              {member.full_name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Member info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium truncate">{member.full_name}</p>
            <span
              className="inline-flex items-center rounded-md bg-accent/10
                 group-hover:text-muted-foreground dark:group-hover:text-foreground
                 px-2 text-xs font-medium text-accent ring-1 ring-inset ring-accent-700/10"
            >
              Admin
            </span>
          </div>

          <p className="text-xs text-muted-foreground truncate group-hover:text-foreground">
            {member.email}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemberItem;
