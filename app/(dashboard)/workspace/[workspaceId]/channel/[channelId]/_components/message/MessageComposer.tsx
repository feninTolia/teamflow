import RichTextEditor from '@/components/rich-text-editor/Editor';
import { Button } from '@/components/ui/button';
import { ImageIcon, SendIcon } from 'lucide-react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
};

const MessageComposer = ({
  value,
  onChange,
  onSubmit,
  isSubmitting,
}: Props) => {
  return (
    <RichTextEditor
      filed={{ value, onChange }}
      sendButton={
        <Button
          type="button"
          size="sm"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          <SendIcon className="size-4 mr-1" />
          {isSubmitting ? 'Sending...' : 'Send'}
        </Button>
      }
      footerLeft={
        <Button type="button" size="sm" variant="outline">
          <ImageIcon className="size-4 mr-1" />
          Attach
        </Button>
      }
    />
  );
};

export default MessageComposer;
