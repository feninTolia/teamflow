'use client';
import {
  inviteMemberSchema,
  InviteMemberSchemaType,
} from '@/app/schemas/Member';
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
import { useMutation } from '@tanstack/react-query';
import { UserPlusIcon } from 'lucide-react';
import { useState } from 'react';
import {
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  useForm,
  UseFormStateReturn,
} from 'react-hook-form';
import { toast } from 'sonner';

export const InviteMember = () => {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { name: '', email: '' },
  });

  const inviteMutation = useMutation(
    orpc.workspace.member.invite.mutationOptions({
      onSuccess: () => {
        toast.success('Member invited successfully');
        form.reset();
        setIsOpen(false);
      },
      onError: () => {
        toast.error('Failed to invite member');
      },
    }),
  );

  const onSubmit = async (data: InviteMemberSchemaType) => {
    inviteMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlusIcon />
          Invite member
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            Invite a new member to your workspace by using their email
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter name..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              name={'name'}
              control={form.control}
            />

            <FormField
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter email..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              name={'email'}
              control={form.control}
            />

            <Button type="submit">Send Invite</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
