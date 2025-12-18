'use client';
import {
  channelNameSchema,
  ChannelNameSchemaType,
  transformChannelName,
} from '@/app/schemas/channel';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { orpc } from '@/lib/orpc';
import { zodResolver } from '@hookform/resolvers/zod';
import { isDefinedError } from '@orpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function CreateNewChannel() {
  const [isOpen, setisOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(channelNameSchema),
    defaultValues: { name: '' },
  });

  const createChannelMutation = useMutation(
    orpc.channel.create.mutationOptions({
      onSuccess(newChannel) {
        toast.success(`Channel ${newChannel.name} created successfully`);
        queryClient.invalidateQueries({
          queryKey: orpc.channel.list.queryKey(),
        });

        form.reset();
        setisOpen(false);
      },
      onError(error) {
        if (isDefinedError(error)) {
          toast.error(error.message);
          return;
        }
        toast.error('Failed to create channel. Please try again later.');
      },
    })
  );

  function onSubbmit(values: ChannelNameSchemaType) {
    createChannelMutation.mutate(values);
  }

  const watchedName = form.watch('name');
  const transformedName = watchedName ? transformChannelName(watchedName) : '';
  return (
    <Dialog open={isOpen} onOpenChange={setisOpen}>
      <DialogTrigger asChild>
        <Button variant={'outline'} className="w-full">
          <PlusIcon className="size-4" /> Add Channel
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Chanel</DialogTitle>
          <DialogDescription>
            Create new Channel to get started!
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className=" space-y-6" onSubmit={form.handleSubmit(onSubbmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Channe" {...field} />
                  </FormControl>

                  {transformedName && transformedName !== watchedName && (
                    <p>
                      Will be created as:{' '}
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        {transformedName}
                      </code>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={createChannelMutation.isPending}>
              {createChannelMutation.isPending
                ? 'Creating...'
                : 'Create new Channel'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
