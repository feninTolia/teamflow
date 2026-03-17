import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { client } from '@/lib/orpc';
import { useChat } from '@ai-sdk/react';
import { eventIteratorToStream } from '@orpc/server';
import { SparklesIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

interface ComposeAssistantProps {
  content: string;
  onAccept?: (markdown: string) => void;
}

const ComposeAssistant = ({ content, onAccept }: ComposeAssistantProps) => {
  const [isOpen, setisOpen] = useState(false);

  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const {
    messages,
    status,
    stop,
    error,
    clearError,
    sendMessage,
    setMessages,
  } = useChat({
    id: `compose-assistant`,
    transport: {
      async sendMessages(options) {
        return eventIteratorToStream(
          await client.ai.compose.generate(
            { content: contentRef.current },
            { signal: options.abortSignal },
          ),
        );
      },
      reconnectToStream: () => {
        throw new Error('Unsupported');
      },
    },
  });

  const lastAssistent = messages.findLast((m) => m.role === 'assistant');
  const composedText =
    lastAssistent?.parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('\n\n') ?? '';

  const handleOpenChange = (nextOpen: boolean) => {
    setisOpen(nextOpen);

    if (nextOpen) {
      const hasAssistantMessage = messages.some((m) => m.role === 'assistant');

      if (status !== 'ready' || hasAssistantMessage) {
        return;
      }

      sendMessage({ text: 'Rewrite' });
    } else {
      stop();
      clearError();
      setMessages([]);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          className="relative overflow-hidden bg-linear-to-tr
          via-violet-600 from-blue-600 to-fuchsia-600 shadow-md text-white hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring"
          type="button"
          size={'sm'}
        >
          <span className="flex items-center gap-1.5">
            <SparklesIcon className="size-3.5" />
            <span className="text-xs font-bold">Compose</span>
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[25rem] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className=" flex items-center gap-2">
            <span className="relative inline-flex items-center justify-center gap-2">
              <SparklesIcon className="text-fuchsia-600 dark:text-fuchsia-300" />
              <span className="font-bold">Compose Assistant (Preview)</span>
            </span>
          </div>

          {status === 'streaming' && (
            <Button
              onClick={() => stop()}
              type="button"
              size={'sm'}
              variant={'outline'}
            >
              Stop
            </Button>
          )}
        </div>

        <div className="px-4 py-3 max-h-80 overflow-auto">
          {error ? (
            <div>
              <p className="text-red-500">{error.message}</p>
              <Button
                type="button"
                size={'sm'}
                onClick={() => {
                  clearError();
                  setMessages([]);
                  sendMessage({ text: 'Summarize thread' });
                }}
              >
                Try Again
              </Button>
            </div>
          ) : composedText ? (
            <p className="">{composedText}</p>
          ) : status === 'submitted' || status === 'streaming' ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Click compose to generate
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-3 py-2 bg-muted/30">
          <Button
            type="submit"
            size="sm"
            variant={'outline'}
            onClick={() => {
              stop();
              clearError();
              setMessages([]);
              setisOpen(false);
            }}
          >
            Decline
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!composedText}
            onClick={() => {
              if (!composedText) return;
              onAccept?.(composedText);
              stop();
              clearError();
              setMessages([]);
              setisOpen(false);
            }}
          >
            Accept
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ComposeAssistant;
