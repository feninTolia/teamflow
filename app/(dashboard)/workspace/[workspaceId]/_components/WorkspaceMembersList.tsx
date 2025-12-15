import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';

const members = [
  {
    id: 1,
    name: 'Anatoliy Fisher',
    imageUrl: 'https://avatar.vercel.sh/Anatoliy',
    email: 'anatoliy.fisher@example.com',
  },
  {
    id: 2,
    name: 'John Doe',
    imageUrl: 'https://avatar.vercel.sh/John',
    email: 'john.doe@example.com',
  },
  {
    id: 3,
    name: 'Jane Doe',
    imageUrl: 'https://avatar.vercel.sh/Jane',
    email: 'jane.doe@example.com',
  },
  {
    id: 4,
    name: 'Alex Johnson',
    imageUrl: 'https://avatar.vercel.sh/shmAlex',
    email: 'alex.johnson@example.com',
  },
];

export function WorkspaceMembersList() {
  return (
    <div className="space-y-0.5 py-1">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-3 px-3 py-3 hover:bg-accent cursor-pointer transition-colors"
        >
          <div className="relative">
            <Avatar className="size-8 relative">
              <Image
                src={member.imageUrl}
                alt={member.name}
                className="object-cover"
                fill
              />
              <AvatarFallback>
                {member.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{member.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {member.email}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
