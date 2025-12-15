import { heavyWriteSecurityMiddleware } from '@/app/middlewares/arcjet/heavy-write';
import { standardSecurityMiddleware } from '@/app/middlewares/arcjet/standard';
import { requireAuthMiddleware } from '@/app/middlewares/auth';
import { base } from '@/app/middlewares/base';
import { requiredWorkspaceMiddleware } from '@/app/middlewares/workspace';
import { channelNameSchema } from '@/app/schemas/channel';
import z from 'zod';

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
  .output(
    z.object({
      channelName: z.string(), //TODO
    })
  )
  .handler(async ({ context, errors, input }) => {
    try {
    } catch {
      throw errors.FORBIDDEN();
    }

    return {
      channelName: '',
    };
  });
