'use client';
import { channelNameSchema, transformChannelName } from '@/app/schemas/channel';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function CreateNewChannel() {
  const [isOpen, setisOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(channelNameSchema),
    defaultValues: { name: '' },
  });

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
          <form className=" space-y-6">
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

            <Button type="submit">Create new Channel</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
