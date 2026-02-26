import { standardSecurityMiddleware } from '@/app/middlewares/arcjet/standard';
import { requireAuthMiddleware } from '@/app/middlewares/auth';
import { base } from '@/app/middlewares/base';
import { requiredWorkspaceMiddleware } from '@/app/middlewares/workspace';
import prisma from '@/lib/db';
import { Message } from '@/lib/generated/prisma/client';
import { getAvatar } from '@/lib/get-avatar';
import { MessageListItem } from '@/lib/types';
import z from 'zod';
import { readSecurityMiddleware } from '../middlewares/arcjet/read';
import { writeSecurityMiddleware } from '../middlewares/arcjet/write';
import {
  createMessageSchema,
  GroupedReactionSchemaType,
  toggleReactionSchema,
  updateMessageSchema,
} from '../schemas/message';

function groupReactions(
  reactions: { emoji: string; userId: string }[],
  userId: string,
): GroupedReactionSchemaType[] {
  const reactionMap = new Map<
    string,
    { count: number; reactedByMe: boolean }
  >();

  for (const reaction of reactions) {
    const existing = reactionMap.get(reaction.emoji);

    if (existing) {
      existing.count++;
      if (reaction.userId === userId) {
        existing.reactedByMe = true;
      }
    } else {
      reactionMap.set(reaction.emoji, {
        count: 1,
        reactedByMe: reaction.userId === userId,
      });
    }
  }

  return Array.from(
    reactionMap.entries().map(([emoji, data]) => ({
      emoji,
      count: data.count,
      reactedByMe: data.reactedByMe,
    })),
  );
}

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

    //If this is a thread reply, validate the parent message
    if (input.threadId) {
      const parentMessage = await prisma.message.findFirst({
        where: {
          id: input.threadId,
          channel: { workspaceId: context.workspace.orgCode },
        },
      });

      if (
        !parentMessage ||
        parentMessage.channelId !== input.channelId ||
        parentMessage.threadId !== null
      ) {
        throw errors.BAD_REQUEST();
      }
    }

    const message = await prisma.message.create({
      data: {
        ...input,
        authorId: context.user.id,
        authorEmail: context.user.email!,
        authorName: context.user.given_name ?? 'John Doe',
        authorAvatar: getAvatar(context.user.picture, context.user.email!),
        channelId: input.channelId,
        threadId: input.threadId,
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
      items: z.array(z.custom<MessageListItem>()),
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
      where: {
        channelId: input.channelId,
        threadId: null,
      },
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        _count: { select: { replies: true } },
        MessageReactions: { select: { emoji: true, userId: true } },
      },
    });

    const items: MessageListItem[] = messages.map((m) => ({
      ...m,
      replyCount: m._count.replies,
      reactions: groupReactions(
        m.MessageReactions.map((r) => ({ emoji: r.emoji, userId: r.userId })),
        context.user.id,
      ),
    }));
    const nextCursor =
      messages.length === limit ? messages[messages.length - 1].id : undefined;

    return { items, nextCursor };
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

export const listThreadMessages = base
  .use(requireAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .route({
    method: 'GET',
    path: '/messages/:messageId/thread',
    summary: 'List replies in a thread',
    tags: ['messages'],
  })
  .input(z.object({ messageId: z.string() }))
  .output(
    z.object({
      parent: z.custom<MessageListItem>(),
      messages: z.array(z.custom<MessageListItem>()),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const parrentRow = await prisma.message.findFirst({
      where: {
        id: input.messageId,
        channel: { workspaceId: context.workspace.orgCode },
      },
      include: {
        _count: { select: { replies: true } },
        MessageReactions: { select: { emoji: true, userId: true } },
      },
    });

    if (!parrentRow) {
      throw errors.NOT_FOUND();
    }

    // Fetch messages with replies
    const messagesQuery = await prisma.message.findMany({
      where: { threadId: input.messageId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      include: {
        _count: { select: { replies: true } },
        MessageReactions: { select: { emoji: true, userId: true } },
      },
    });

    const parent: MessageListItem = {
      ...parrentRow,
      replyCount: parrentRow._count.replies,
      reactions: groupReactions(
        parrentRow.MessageReactions.map((r) => ({
          emoji: r.emoji,
          userId: r.userId,
        })),
        context.user.id,
      ),
    };

    const messages: MessageListItem[] = messagesQuery.map((m) => ({
      ...m,
      replyCount: m._count.replies,
      reactions: groupReactions(
        m.MessageReactions.map((r) => ({
          emoji: r.emoji,
          userId: r.userId,
        })),
        context.user.id,
      ),
    }));

    return { parent, messages };
  });

export const toggleReaction = base
  .use(requireAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: 'POST',
    path: '/messages/:messageId/reactions',
    summary: 'Toggle a reaction',
    tags: ['messages'],
  })
  .input(toggleReactionSchema)
  .output(
    z.object({
      messageId: z.string(),
      reactions: z.array(z.custom<GroupedReactionSchemaType>()),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const message = await prisma.message.findFirst({
      where: {
        id: input.messageId,
        channel: { workspaceId: context.workspace.orgCode },
      },
      select: { id: true },
    });

    if (!message) {
      throw errors.NOT_FOUND();
    }

    const inserted = await prisma.messageReaction.createMany({
      data: [
        {
          emoji: input.emoji,
          userId: context.user.id,
          userEmail: context.user.email!,
          userName: context.user.given_name ?? 'John Doe',
          userAvatar: getAvatar(context.user.picture, context.user.email!),
          messageId: input.messageId,
        },
      ],
      skipDuplicates: true,
    });

    if (inserted.count === 0) {
      await prisma.messageReaction.deleteMany({
        where: {
          emoji: input.emoji,
          messageId: input.messageId,
          userId: context.user.id,
        },
      });
    }

    const updated = await prisma.message.findUnique({
      where: { id: input.messageId },
      include: {
        MessageReactions: { select: { emoji: true, userId: true } },
        _count: { select: { replies: true } },
      },
    });

    if (!updated) {
      throw errors.NOT_FOUND();
    }

    return {
      messageId: updated.id,
      reactions: groupReactions(
        (updated.MessageReactions ?? []).map((r) => ({
          emoji: r.emoji,
          userId: r.userId,
        })),
        context.user.id,
      ),
    };
  });
