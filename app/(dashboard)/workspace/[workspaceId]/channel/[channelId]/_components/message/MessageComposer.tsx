import RichTextEditor from '@/components/rich-text-editor/Editor';
import { ImageUploadModal } from '@/components/rich-text-editor/ImageUploadModal';
import { Button } from '@/components/ui/button';
import { UseAttachmentUploadType } from '@/hooks/use-attachment-upload';
import { ImageIcon, SendIcon } from 'lucide-react';
import Image from 'next/image';
import { AttachmentChip } from './AttachmentChip';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  upload: UseAttachmentUploadType;
};

const MessageComposer = ({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  upload,
}: Props) => {
  return (
    <>
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
          upload.stagedUrl ? (
            <AttachmentChip url={upload.stagedUrl} onRemove={upload.clear} />
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => upload.setIsOpen(true)}
            >
              <ImageIcon className="size-4 mr-1" />
              Attach
            </Button>
          )
        }
      />
      <ImageUploadModal
        open={upload.isOpen}
        onOpenChange={upload.setIsOpen}
        onUploaded={(url) => upload.onUploaded(url)}
      />
    </>
  );
};

export default MessageComposer;
