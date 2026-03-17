import { SafeContent } from '@/components/rich-text-editor/SafeContent';
import { Button } from '@/components/ui/button';
import { orpc } from '@/lib/orpc';
import { useThread } from '@/providers/ThreadProvider';
import { KindeUser } from '@kinde-oss/kinde-auth-nextjs';
import { useQuery } from '@tanstack/react-query';
import { ChevronsDownIcon, MessageSquareIcon, XIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ThreadReply } from './ThreadReply';
import { ThreadReplyForm } from './ThreadReplyForm';
import ThreadSidebarSkeleton from './ThreadSidebarSkeleton';
import SummarizeThread from './SummarizeThread';

type Props = {
  user: KindeUser<Record<string, unknown>>;
};

export const ThreadSidebar = ({ user }: Props) => {
  const { selectedThreadId, closeThread } = useThread();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastMessageCountRef = useRef(0);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const { data, isLoading } = useQuery(
    orpc.message.thread.list.queryOptions({
      input: { messageId: selectedThreadId! },
      enabled: Boolean(selectedThreadId),
    }),
  );

  const messageCount = data?.messages.length ?? 0;

  const isNearBottom = (el: HTMLDivElement) =>
    el.scrollHeight - el.scrollTop - el.clientHeight <= 80;

  const handleScroll = () => {
    const el = scrollRef.current;

    if (!el) return;

    setIsAtBottom(isNearBottom(el));
  };

  useEffect(() => {
    if (messageCount === 0) return;

    const previousMessageCount = lastMessageCountRef.current;
    const el = scrollRef.current;

    if (previousMessageCount > 0 && messageCount !== previousMessageCount) {
      if (el && isNearBottom(el)) {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({
            block: 'end',
            behavior: 'smooth',
          });
        });

        setIsAtBottom(true);
      }
    }

    lastMessageCountRef.current = messageCount;
  }, [messageCount]);

  //keep view pinned to the bottom on late content growth (e.g. images)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollToBottomIfNeeded = () => {
      if (isAtBottom) {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ block: 'end' });
        });
      }
    };

    const onImageLoad = (e: Event) => {
      if (e.target instanceof HTMLImageElement) {
        scrollToBottomIfNeeded();
      }
    };

    el.addEventListener('load', onImageLoad, true);

    const resizeObserver = new ResizeObserver(() => {
      scrollToBottomIfNeeded();
    });

    resizeObserver.observe(el);

    const mutationObserver = new MutationObserver(() => {
      scrollToBottomIfNeeded();
    });

    mutationObserver.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    return () => {
      resizeObserver.disconnect();
      el.removeEventListener('load', onImageLoad, true);
      mutationObserver.disconnect();
    };
  }, [isAtBottom]);

  const scrollToBottom = () => {
    const el = scrollRef.current;

    if (!el) return;

    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });

    setIsAtBottom(true);
  };

  if (isLoading) {
    return <ThreadSidebarSkeleton />;
  }

  return (
    <div className="w-[30rem] border-l flex flex-col h-full">
      {/* Header */}
      <div className="border-b h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquareIcon className="size-4" />
          <span>Thread</span>
        </div>

        <div className="flex items-center gap-2">
          <SummarizeThread messageId={selectedThreadId!} />
          <Button
            variant={'outline'}
            size={'icon'}
            onClick={() => closeThread()}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto"
        >
          {data && (
            <>
              <div className="p-4 border-b bg-muted/20">
                <div className="flex gap-3">
                  <Image
                    src={data.parent.authorAvatar}
                    alt="Author Image"
                    width={32}
                    height={32}
                    className="size-8 rounded-full shrink-0"
                  />
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm ">
                        {data.parent.authorName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Intl.DateTimeFormat('en-UK', {
                          hour: 'numeric',
                          minute: 'numeric',
                          hour12: false,
                          month: 'short',
                          day: 'numeric',
                        }).format(data.parent.createdAt)}
                      </span>
                    </div>

                    <SafeContent
                      content={JSON.parse(data.parent.content)}
                      className="text-sm wrap-break-word prose dark:prose-invert max-w-none marker:text-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Thread Replies */}
              <div className="p-2">
                <p className="text-sm  text-muted-foreground mb-3">
                  {data.messages.length}{' '}
                  {data.messages.length === 1 ? 'reply' : 'replies'}
                </p>

                <div className="space-y-1">
                  {data.messages.slice(0).map((reply) => (
                    <ThreadReply
                      key={reply.id}
                      reply={reply}
                      selectedThreadId={selectedThreadId!}
                    />
                  ))}
                </div>
              </div>

              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Scroll to bottom button */}
        {!isAtBottom && (
          <Button
            type="button"
            size="sm"
            className="absolute bottom-4 right-4 size-10 rounded-full opacity-60 backdrop-blur-3xl"
            variant="outline"
            onClick={scrollToBottom}
          >
            <ChevronsDownIcon className="size-5" />
          </Button>
        )}
      </div>

      {/* Thread reply form */}
      <div className="border-t p-4">
        <ThreadReplyForm threadId={selectedThreadId!} user={user} />
      </div>
    </div>
  );
};
