import { Button } from '@/components/ui/button';
import { MessageSquareTextIcon, PencilIcon } from 'lucide-react';

type Props = {
  messageId: string;
  canEdit: boolean;
  onEdit: () => void;
};

export const MessageHoverToolbar = ({ canEdit, onEdit, messageId }: Props) => {
  return (
    <div
      className="absolute right-4 top-1/2 -translate-y-1/2 items-center gap-1 rounded-md
      border border-foreground/10 px-1.5 py-1 shadow-sm
      backdrop-blur transition-opacity opacity-0 group-hover:opacity-100"
    >
      {canEdit && (
        <Button
          variant={'ghost'}
          size={'icon'}
          onClick={onEdit}
          disabled={!canEdit}
        >
          <PencilIcon className="size-4" />
        </Button>
      )}

      <Button variant={'ghost'} size={'icon'}>
        <MessageSquareTextIcon className="size-4" />
      </Button>
    </div>
  );
};
