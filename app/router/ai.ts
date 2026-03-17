import { base } from '@/app/middlewares/base';
import prisma from '@/lib/db';
import { tipTapJsonToMarkdown } from '@/lib/json-to-markdown';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import z from 'zod';
import { requireAuthMiddleware } from '../middlewares/auth';
import { requiredWorkspaceMiddleware } from '../middlewares/workspace';
import { streamToEventIterator } from '@orpc/server';
import { aiSecurityMiddleware } from '../middlewares/arcjet/ai';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_LLM_KEY,
});

// const MODEL_ID = 'z-ai/glm-4.5-air:free';
const MODEL_ID = 'stepfun/step-3.5-flash:free';

const model = openrouter.chat(MODEL_ID);

export const generateThreadSummary = base
  .use(requireAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(aiSecurityMiddleware)
  .route({
    method: 'GET',
    path: '/ai/thread/summary',
    summary: 'Generete thread summary',
    tags: ['Ai'],
  })
  .input(
    z.object({
      messageId: z.string(),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const baseMessage = await prisma.message.findFirst({
      where: {
        id: input.messageId,
        channel: { workspaceId: context.workspace.orgCode },
      },
      select: { id: true, threadId: true, channel: true },
    });

    if (!baseMessage) {
      throw errors.NOT_FOUND();
    }

    const parrentId = baseMessage.threadId ?? baseMessage.id;

    const parent = await prisma.message.findFirst({
      where: {
        id: parrentId,
        channel: { workspaceId: context.workspace.orgCode },
      },

      select: {
        id: true,
        content: true,
        createdAt: true,
        authorName: true,
        replies: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            authorName: true,
          },
        },
      },
    });

    if (!parent) {
      throw errors.NOT_FOUND();
    }

    const replies = parent.replies.slice().reverse();

    const parentText = await tipTapJsonToMarkdown(parent.content);

    const lines = [];

    lines.push(
      `Thread Root - ${parent.authorName} - ${parent.createdAt.toISOString()}`,
    );

    lines.push(parentText);

    if (replies.length > 0) {
      lines.push('\nReplies');
      for (const r of replies) {
        const t = await tipTapJsonToMarkdown(r.content);

        lines.push(`- ${r.authorName} - ${r.createdAt.toISOString()}: ${t}`);
      }
    }

    const compiled = lines.join('\n');

    const system = [
      'You are an expert assistant summarizing Slack-like discussion threads for a product team.',
      'Use only the provided thread content; do not invent facts, names, or timelines.',
      'Output format (Markdown) :',
      "- First, write a single concise paragraph (2-4 sentences) that captures the thread's purpose, key decisions, context, and any blockers or next steps. No heading, no list, no intro text.",
      "- Then add a blank Line followed by exactly 283 bullet points (using '-') with the most important takeaways. Each bullet is one sentence.",
      'Style: neutral, specific, and concise. Preserve terminology from the thread (names, acronyms). Avoid filler or meta-commentary. Do not add a closing sentence.',
      'If the context is insufficient, return a single-sentence summary and omit the bullet list.',
    ].join('\n');

    const result = streamText({
      model,
      system,
      messages: [{ role: 'user', content: compiled }],
      temperature: 0.2,
    });

    return streamToEventIterator(result.toUIMessageStream());
  });

export const generateCompose = base
  .use(requireAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(aiSecurityMiddleware)
  .route({
    method: 'POST',
    path: '/ai/compose/generate',
    summary: 'Compose message',
    tags: ['AI'],
  })
  .input(z.object({ content: z.string() }))
  .handler(async ({ input }) => {
    const markdown = await tipTapJsonToMarkdown(input.content);

    const system = [
      'You are an expert rewriting assistant. You are not a chatbot.',
      'Task: Rewrite the provided content to be clearer and better structured while preserving meaning, facts, terminology, and names.',
      'Do not address the user, ask questions, add greetings, or include commentary.',
      'Keep existing links/mentions intact. Do not change code blocks or inline code content.',
      'Output strictly in Markdown (paragraphs and optional bullet lists). Do not output any HTML or images.',
      'Return ONLY the rewritten content. No preamble, headings, or closing remarks.',
    ].join('\n');

    const result = streamText({
      model,
      messages: [
        {
          role: 'user',
          content: 'Please rewrite and improve the following content:',
        },
        { role: 'user', content: markdown },
      ],
      temperature: 0,
      system,
    });

    return streamToEventIterator(result.toUIMessageStream());
  });
