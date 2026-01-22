import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';
import Image from 'next/image';

type Props = { url: string; onRemove: () => void };

export const AttachmentChip = ({ url, onRemove }: Props) => {
  return (
    <div className="group relative overflow-hidden rounded-md bg-muted size-10 ">
      <Image src={url} alt="Attachment" fill className="object-cover" />
      <div className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
        <Button
          className="size-6 p-0 rounded-full"
          type="button"
          variant="destructive"
          onClick={onRemove}
        >
          <XIcon className="size-3" />
        </Button>
      </div>
    </div>
  );
};
