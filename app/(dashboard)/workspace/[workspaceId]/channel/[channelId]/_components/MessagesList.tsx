'use client';
import EmptyState from '@/components/general/EmptyState';
import { Button } from '@/components/ui/button';
import { orpc } from '@/lib/orpc';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ChevronDownIcon, ChevronsDownIcon, Loader2Icon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageItem } from './message/MessageItem';

const MessagesList = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isNewMessages, setIsNewMessages] = useState(false);
  const lastItemIdRef = useRef<string | undefined>(undefined);

  const infiniteOptions = orpc.message.list.infiniteOptions({
    input: (pageParam: string | undefined) => ({
      channelId,
      cursor: pageParam,
      limit: 10,
    }),
    queryKey: ['message.list', channelId],
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => ({
      pages: [...data.pages]
        .map((p) => ({ ...p, items: [...p.items].reverse() }))
        .reverse(),
      pageParams: [...data.pageParams].reverse(),
    }),
  });

  const {
    data,
    hasNextPage,
    isFetching,
    fetchNextPage,
    isLoading,
    error,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...infiniteOptions,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  //scroll to bottom on messages first load
  useEffect(() => {
    if (!hasInitialScrolled && data?.pages.length) {
      const el = scrollRef.current;

      if (el) {
        bottomRef.current?.scrollIntoView({ block: 'end' });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasInitialScrolled(true);
        setIsAtBottom(true);
      }
    }
  }, [hasInitialScrolled, data?.pages.length]);

  //keep view pinned to the bottom on late content growth (e.g. images)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollToBottomIfNeeded = () => {
      if (isAtBottom || !hasInitialScrolled) {
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
      mutationObserver.disconnect();
      el.removeEventListener('load', onImageLoad, true);
    };
  }, [hasInitialScrolled, isAtBottom]);

  const isNearBottom = (el: HTMLDivElement) =>
    el.scrollHeight - el.scrollTop - el.clientHeight <= 80;

  const handleScroll = () => {
    const el = scrollRef.current;

    if (!el) return;

    if (el.scrollTop <= 80 && hasNextPage && !isFetching) {
      const prevScrollHeight = el.scrollHeight;
      const prevScrollTop = el.scrollTop;

      fetchNextPage().then(() => {
        const newScrollHeight = el.scrollHeight;

        el.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
      });
    }

    setIsAtBottom(isNearBottom(el));
  };

  const items = useMemo(() => {
    return data?.pages.flatMap((p) => p.items) ?? [];
  }, [data]);

  const isEmpty = !isLoading && !error && items.length === 0;

  useEffect(() => {
    if (!items.length) return;

    const lastId = items[items.length - 1].id;

    const prevLastId = lastItemIdRef.current;

    const el = scrollRef.current;

    if (prevLastId && lastId !== prevLastId) {
      if (el && isNearBottom(el)) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsNewMessages(false);
        setIsAtBottom(true);
      } else {
        setIsNewMessages(true);
      }
    }

    lastItemIdRef.current = lastId;
  }, [items]);

  const scrollToBottom = () => {
    const el = scrollRef.current;

    if (!el) return;

    bottomRef.current?.scrollIntoView({ block: 'end' });

    setIsNewMessages(false);
    setIsAtBottom(true);
  };

  return (
    <div className="relative h-full">
      <div
        className="h-full overflow-y-auto px-4"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {isEmpty ? (
          <div className="h-full flex pt-4">
            <EmptyState
              title="No messages yet"
              description="Be the first to send a message"
              buttonText="Send a message"
              href="#"
            />
          </div>
        ) : (
          items.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))
        )}

        <div ref={bottomRef}></div>
      </div>

      {isFetchingNextPage && (
        <div className="pointer-events-none absolute top-0 left-0 right-0 z-20 flex items-center justify-center py-2">
          <div className="flex items-center gap-2 rounded-3xl bg-linear-to-b from-card/80  to-card/20 px-4 py-2 backdrop-blur">
            <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
          </div>
        </div>
      )}

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

      {isNewMessages && !isAtBottom ? (
        <Button
          type="button"
          className="absolute bottom-4 right-1/2 translate-x-1/2 opacity-85 backdrop-blur-3xl"
          onClick={scrollToBottom}
        >
          New messages
          <ChevronDownIcon />
        </Button>
      ) : null}
    </div>
  );
};

export default MessagesList;
