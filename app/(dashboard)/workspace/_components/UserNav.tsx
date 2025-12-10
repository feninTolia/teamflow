'use client';

import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAvatar } from '@/lib/get-avatar';
import { orpc } from '@/lib/orpc';
import {
  LogoutLink,
  PortalLink,
} from '@kinde-oss/kinde-auth-nextjs/components';
import { AvatarFallback } from '@radix-ui/react-avatar';
import { useSuspenseQuery } from '@tanstack/react-query';
import { CreditCardIcon, LogOutIcon, UserIcon } from 'lucide-react';

const UserNav = () => {
  const {
    data: { user },
  } = useSuspenseQuery(orpc.workspace.list.queryOptions());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full hover:scale-105 hover:border-accent"
        >
          <Avatar className="flex items-center justify-center">
            <AvatarImage
              src={getAvatar(user.picture, user.email!)}
              alt="User image"
              className="object-cover"
            />
            <AvatarFallback>
              {user.given_name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="right"
        sideOffset={8}
        className="w-[200px]"
      >
        <DropdownMenuLabel className="font-normal flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <Avatar className="relative size-8 rounded-lg">
            <AvatarImage
              src={getAvatar(user.picture, user.email!)}
              alt="User image"
              className="object-cover"
            />
            <AvatarFallback>
              {user.given_name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <p className="font-medium truncate">{user.given_name}</p>
            <p className="font-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <PortalLink>
              <UserIcon />
              Account
            </PortalLink>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCardIcon />
            Billing
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <LogoutLink>
            <LogOutIcon />
            Log Out
          </LogoutLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNav;
