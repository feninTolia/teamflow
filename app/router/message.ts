import { standardSecurityMiddleware } from '@/app/middlewares/arcjet/standard';
import { requireAuthMiddleware } from '@/app/middlewares/auth';
import { base } from '@/app/middlewares/base';
import { requiredWorkspaceMiddleware } from '@/app/middlewares/workspace';
import prisma from '@/lib/db';
import { Message } from '@/lib/generated/prisma/client';
import { getAvatar } from '@/lib/get-avatar';
import z from 'zod';
import { readSecurityMiddleware } from '../middlewares/arcjet/read';
import { writeSecurityMiddleware } from '../middlewares/arcjet/write';
import { createMessageSchema, updateMessageSchema } from '../schemas/message';

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
        authorName: context.user.given_name ?? 'John Doe',
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
  .input(
    z.object({
      channelId: z.string(),
      limit: z.number().min(1).max(100).optional(),
      cursor: z.string().optional(),
    }),
  )
  .output(
    z.object({
      items: z.array(z.custom<Message>()),
      nextCursor: z.string().optional(),
    }),
  )
  .handler(async ({ context, input, errors }) => {
    const channel = await prisma.channel.findFirst({
      where: { id: input.channelId, workspaceId: context.workspace.orgCode },
    });

    if (!channel) {
      throw errors.FORBIDDEN();
    }
    const limit = input.limit ?? 30;

    const messages = await prisma.message.findMany({
      where: { channelId: input.channelId },
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    const nextCursor =
      messages.length === limit ? messages[messages.length - 1].id : undefined;

    return { items: messages, nextCursor };
  });

export const updateMessage = base
  .use(requireAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: 'PUT',
    path: '/messages/:messageId',
    description: 'Update a message',
    tags: ['messages'],
  })
  .input(updateMessageSchema)
  .output(z.object({ message: z.custom<Message>(), canEdit: z.boolean() }))
  .handler(async ({ input, context, errors }) => {
    const message = await prisma.message.findFirst({
      where: {
        id: input.messageId,
        channel: { workspaceId: context.workspace.orgCode },
      },
      select: { id: true, authorId: true },
    });

    if (!message) {
      throw errors.NOT_FOUND();
    }

    if (message.authorId !== context.user.id) {
      throw errors.FORBIDDEN();
    }

    const updated = await prisma.message.update({
      where: { id: input.messageId },
      data: { content: input.content },
    });

    return { message: updated, canEdit: updated.authorId === context.user.id };
  });
