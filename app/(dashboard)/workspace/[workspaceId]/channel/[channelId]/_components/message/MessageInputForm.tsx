'use client';

import {
  createMessageSchema,
  CreateMessageSchemaType,
} from '@/app/schemas/message';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useAttachmentUpload } from '@/hooks/use-attachment-upload';
import { Message } from '@/lib/generated/prisma/client';
import { getAvatar } from '@/lib/get-avatar';
import { orpc } from '@/lib/orpc';
import { zodResolver } from '@hookform/resolvers/zod';
import { KindeUser } from '@kinde-oss/kinde-auth-nextjs';
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import MessageComposer from './MessageComposer';

type Props = {
  channelId: string;
  user: KindeUser<unknown>;
};

type MessagePage = {
  items: Message[];
  nextCursor?: string;
};

type InfiniteMessages = InfiniteData<MessagePage>;

const MessageInputForm = ({ channelId, user }: Props) => {
  const queryClient = useQueryClient();
  const [editorKey, setEditorKey] = useState(0);
  const upload = useAttachmentUpload();

  const form = useForm({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      channelId,
      content: '',
    },
  });

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      onMutate: async (data) => {
        await queryClient.cancelQueries({
          queryKey: ['message.list', channelId],
        });

        const prevData = queryClient.getQueryData<InfiniteMessages>([
          'message.list',
          channelId,
        ]);

        const tempId = `optimistic-${crypto.randomUUID()}`;

        const optimisticMessage: Message = {
          id: tempId,
          content: data.content,
          channelId,
          imageUrl: data.imageUrl ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: user.id,
          authorEmail: user.email!,
          authorName: user.given_name ?? 'Unknown',
          authorAvatar: getAvatar(user.picture, user.email!),
        };

        queryClient.setQueryData<InfiniteMessages>(
          ['message.list', channelId],
          (old) => {
            if (!old) {
              return {
                pages: [
                  {
                    items: [optimisticMessage],
                    nextCursor: undefined,
                  },
                ],
                pageParams: [undefined],
              } satisfies InfiniteMessages;
            }

            const firstPage = old.pages[0] ?? {
              items: [],
              nextCursor: undefined,
            };

            const updatedFirstPage: MessagePage = {
              ...firstPage,
              items: [optimisticMessage, ...firstPage.items],
            };

            return {
              ...old,
              pages: [updatedFirstPage, ...old.pages.slice(1)],
            };
          },
        );

        return { prevData, tempId };
      },
      onSuccess: (data, _variables, context) => {
        queryClient.setQueryData<InfiniteMessages>(
          ['message.list', channelId],
          (old) => {
            if (!old) return old;

            const updatedPages = old.pages.map((page) => ({
              ...page,
              items: page.items.map((m) =>
                m.id === context.tempId ? { ...data } : m,
              ),
            }));

            return { ...old, pages: updatedPages };
          },
        );

        form.reset({ channelId, content: '' });
        upload.clear();
        setEditorKey((k) => k + 1);

        return toast.success('Message sent successfully');
      },
      onError: (_err, _variables, context) => {
        if (context?.prevData) {
          queryClient.setQueryData<InfiniteMessages>(
            ['message.list', channelId],
            context.prevData,
          );
        }

        return toast.error('Failed to send message');
      },
    }),
  );

  const onSubmit = async (data: CreateMessageSchemaType) => {
    createMessageMutation.mutate({
      ...data,
      imageUrl: upload.stagedUrl ?? undefined,
    });
  };

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => {
            return (
              <FormItem>
                <FormControl>
                  <MessageComposer
                    key={editorKey}
                    value={field.value}
                    onChange={field.onChange}
                    onSubmit={() => onSubmit(form.getValues())}
                    isSubmitting={createMessageMutation.isPending}
                    upload={upload}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </form>
    </Form>
  );
};

export default MessageInputForm;
