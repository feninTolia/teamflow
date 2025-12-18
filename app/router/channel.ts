import { heavyWriteSecurityMiddleware } from '@/app/middlewares/arcjet/heavy-write';
import { standardSecurityMiddleware } from '@/app/middlewares/arcjet/standard';
import { requireAuthMiddleware } from '@/app/middlewares/auth';
import { base } from '@/app/middlewares/base';
import { requiredWorkspaceMiddleware } from '@/app/middlewares/workspace';
import { channelNameSchema } from '@/app/schemas/channel';
import prisma from '@/lib/db';
import { Channel } from '@/lib/generated/prisma/client';
import { KindeOrganization } from '@kinde-oss/kinde-auth-nextjs';
import {
  init,
  organization_user,
  Organizations,
} from '@kinde/management-api-js';
import z from 'zod';

export const listChannels = base
  .use(requireAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .route({
    method: 'GET',
    path: '/channels',
    summary: 'List all channels',
    tags: ['channels'],
  })
  .input(z.void())
  .output(
    z.object({
      channels: z.array(z.custom<Channel>()),
      members: z.array(z.custom<organization_user>()),
      currentWorkspace: z.custom<KindeOrganization<unknown>>(),
    })
  )
  .handler(async ({ context }) => {
    const [channels, members] = await Promise.all([
      prisma.channel.findMany({
        where: { workspaceId: context.workspace.orgCode },
        orderBy: { createdAt: 'desc' },
      }),

      (async () => {
        init();

        const usersInOrg = await Organizations.getOrganizationUsers({
          orgCode: context.workspace.orgCode,
          sort: 'name_asc',
        });

        return usersInOrg.organization_users ?? [];
      })(),
    ]);

    return { channels, members, currentWorkspace: context.workspace };
  });

export const createChannel = base
  .use(requireAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: 'POST',
    path: '/channels',
    summary: 'Create a new channel',
    tags: ['channels'],
  })
  .input(channelNameSchema)
  .output(z.custom<Channel>())
  .handler(async ({ context, input }) => {
    const channel = await prisma.channel.create({
      data: {
        name: input.name,
        workspaceId: context.workspace.orgCode,
        createdById: context.user.id,
      },
    });

    return channel;
  });
