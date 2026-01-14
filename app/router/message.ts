import { standardSecurityMiddleware } from '@/app/middlewares/arcjet/standard';
import { requireAuthMiddleware } from '@/app/middlewares/auth';
import { base } from '@/app/middlewares/base';
import { requiredWorkspaceMiddleware } from '@/app/middlewares/workspace';
import prisma from '@/lib/db';
import { Message } from '@/lib/generated/prisma/client';
import z from 'zod';
import { writeSecurityMiddleware } from '../middlewares/arcjet/write';
import { createMessageSchema } from '../schemas/message';
import { getAvatar } from '@/lib/get-avatar';
import { readSecurityMiddleware } from '../middlewares/arcjet/read';

export const createMessage = base
  .use(requireAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: 'POST',
    path: '/messages',
    summary: 'Create a new message',
    tags: ['messages'],
  })
  .input(createMessageSchema)
  .output(z.custom<Message>())
  .handler(async ({ context, input, errors }) => {
    const channel = await prisma.channel.findFirst({
      where: { id: input.channelId, workspaceId: context.workspace.orgCode },
    });

    if (!channel) {
      throw errors.FORBIDDEN();
    }

    const message = await prisma.message.create({
      data: {
        ...input,
        authorId: context.user.id,
        authorEmail: context.user.email!,
        authorName: context.user.username ?? 'John Doe',
        authorAvatar: getAvatar(context.user.picture, context.user.email!),
        channelId: input.channelId,
      },
    });

    return message;
  });

export const listMessages = base
  .use(requireAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .route({
    method: 'GET',
    path: '/messages',
    summary: 'List all messages',
    tags: ['messages'],
  })
  .input(z.object({ channelId: z.string() }))
  .output(z.array(z.custom<Message>()))
  .handler(async ({ context, input, errors }) => {
    const channel = await prisma.channel.findFirst({
      where: { id: input.channelId, workspaceId: context.workspace.orgCode },
    });

    if (!channel) {
      throw errors.FORBIDDEN();
    }

    const data = await prisma.message.findMany({
      where: { channelId: input.channelId },
      orderBy: { createdAt: 'desc' },
    });

    return data;
  });
