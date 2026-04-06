'use client';
import {
  createMessageSchema,
  CreateMessageSchemaType,
} from '@/app/schemas/message';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { useAttachmentUpload } from '@/hooks/use-attachment-upload';
import { getAvatar } from '@/lib/get-avatar';
import { orpc } from '@/lib/orpc';
import { MessageListItem } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { KindeUser } from '@kinde-oss/kinde-auth-nextjs';
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import MessageComposer from '../message/MessageComposer';
import { useChannelRealtime } from '@/providers/ChannelRealtimeProvider';

type Props = {
  threadId: string;
  user: KindeUser<Record<string, unknown>>;
};

export const ThreadReplyForm = ({ threadId, user }: Props) => {
  const { channelId } = useParams<{ channelId: string }>();
  const upload = useAttachmentUpload();
  const [editorKey, setEditorKey] = useState(0);
  const queryClient = useQueryClient();
  const { send } = useChannelRealtime();

  const form = useForm({
    resolver: zodResolver(createMessageSchema),
    defaultValues: { content: '', channelId, threadId },
  });

  useEffect(() => {
    form.setValue('threadId', threadId);
  }, [threadId, form]);

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      onMutate: async ({ content, channelId, threadId, imageUrl }) => {
        const listOptions = orpc.message.thread.list.queryOptions({
          input: { messageId: threadId! },
        });

        type MessagePage = {
          items: MessageListItem[];
          nextCursor: string | null;
        };

        type InfiniteMessagePage = InfiniteData<MessagePage>;

        await queryClient.cancelQueries({ queryKey: listOptions.queryKey });

        const previous = queryClient.getQueryData(listOptions.queryKey);

        const optimistic: MessageListItem = {
          id: `optimistic-${crypto.randomUUID()}`,
          content,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: user.id,
          authorEmail: user.email!,
          authorName: user.given_name ?? 'Unknown user',
          authorAvatar: getAvatar(user.picture, user.email!),
          channelId,
          threadId: threadId!,
          imageUrl: imageUrl ?? null,
          reactions: [],
          replyCount: 0,
        };

        queryClient.setQueryData(listOptions.queryKey, (old) => {
          if (!old) return old;

          return { ...old, messages: [...old.messages, optimistic] };
        });

        //optimisticaly bump replies count in messages list
        queryClient.setQueryData<InfiniteMessagePage>(
          ['message.list', channelId],
          (old) => {
            if (!old) return old;

            const pages = old.pages.map((page) => ({
              ...page,
              items: page.items.map((message) =>
                message.id === threadId
                  ? { ...message, replyCount: message.replyCount + 1 }
                  : message,
              ),
            }));

            return { ...old, pages };
          },
        );

        return { listOptions, previous };
      },

      onSuccess: (_data, _vars, ctx) => {
        queryClient.invalidateQueries({
          queryKey: ctx.listOptions.queryKey,
        });

        form.reset({ channelId, content: '', threadId });
        upload.clear();
        setEditorKey((prev) => prev + 1);

        send({
          type: 'message:replies:increment',
          payload: { messageId: threadId, delta: 1 },
        });
        return toast.success('Message created successfully');
      },

      onError: (_err, _var, ctx) => {
        if (!ctx) return;

        const { listOptions, previous } = ctx;

        if (previous) {
          queryClient.setQueryData(listOptions.queryKey, previous);
        }

        return toast.error('Failed to create message');
      },
    }),
  );

  function onSubmit(data: CreateMessageSchemaType) {
    createMessageMutation.mutate({
      ...data,
      imageUrl: upload.stagedUrl ?? undefined,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <MessageComposer
                  value={field.value}
                  onChange={field.onChange}
                  upload={upload}
                  key={editorKey}
                  onSubmit={() => onSubmit(form.getValues())}
                  isSubmitting={createMessageMutation.isPending}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
