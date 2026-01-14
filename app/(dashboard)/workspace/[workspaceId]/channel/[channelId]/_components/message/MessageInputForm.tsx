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
import { orpc } from '@/lib/orpc';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import MessageComposer from './MessageComposer';

type Props = {
  channelId: string;
};

const MessageInputForm = ({ channelId }: Props) => {
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      channelId,
      content: '',
    },
  });

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.message.list.key(),
        });
        return toast.success('Message sent successfully');
      },
      onError: () => {
        return toast.error('Failed to send message');
      },
    })
  );

  const onSubmit = async (data: CreateMessageSchemaType) => {
    createMessageMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => {
            return (
              <FormItem>
                <FormControl>
                  <MessageComposer
                    value={field.value}
                    onChange={field.onChange}
                    onSubmit={() => onSubmit(form.getValues())}
                    isSubmitting={createMessageMutation.isPending}
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
