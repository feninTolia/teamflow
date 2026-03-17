import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { client } from '@/lib/orpc';
import { useChat } from '@ai-sdk/react';
import { eventIteratorToStream } from '@orpc/client';
import { SparklesIcon } from 'lucide-react';
import { useState } from 'react';
type Props = {
  messageId: string;
};

const SummarizeThread = ({ messageId }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    messages,
    status,
    error,
    sendMessage,
    setMessages,
    stop,
    clearError,
  } = useChat({
    id: `thread-summary:${messageId}`,
    transport: {
      async sendMessages(options) {
        return eventIteratorToStream(
          await client.ai.thread.summary.generate(
            { messageId },
            { signal: options.abortSignal },
          ),
        );
      },

      reconnectToStream() {
        throw new Error(`Unsupported`);
      },
    },
  });

  const lastAssistent = messages.findLast((m) => m.role === 'assistant');
  const summaryText =
    lastAssistent?.parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('\n\n') ?? '';

  function handleOpenChange(nextOpen: boolean) {
    setIsOpen(nextOpen);
    if (nextOpen) {
      const hasAssistantMessage = messages.some((m) => m.role === 'assistant');
      if (status !== 'ready' || hasAssistantMessage) {
        return;
      }

      sendMessage({ text: 'Summarize thread' });
    } else {
      stop();
      clearError();
      setMessages([]);
    }
  }

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
            <span className="text-xs font-bold">Summarize</span>
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[25rem] p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className=" flex items-center gap-2">
            <span className="relative inline-flex items-center justify-center gap-2">
              <SparklesIcon className="text-fuchsia-600 dark:text-fuchsia-300" />
              <span className="font-bold">AI Summary (Preview)</span>
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
          ) : summaryText ? (
            <p className="">{summaryText}</p>
          ) : status === 'submitted' || status === 'streaming' ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Click summarize to generate
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SummarizeThread;
