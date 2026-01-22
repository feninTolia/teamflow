'use client';

import { UploadDropzone } from '@/lib/uploadthing';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: (url: string) => void;
};

export function ImageUploadModal({ open, onOpenChange, onUploaded }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
        </DialogHeader>
        <UploadDropzone
          className=" ut-button:hover:bg-primary/50 ut-button:hover:cursor-pointer"
          appearance={{
            container: 'bg-card',
            label: 'text-muted-foreground hover:text-primary',
            allowedContent: 'text-xs text-muted-foreground',
            button: 'bg-primary! text-primary-foreground!',
            uploadIcon: 'text-muted-foreground',
          }}
          endpoint={'imageUploader'}
          onClientUploadComplete={(res) => {
            const url = res[0].ufsUrl;
            toast.success('Image uploaded successfully');
            onUploaded(url);
          }}
          onUploadError={(error) => {
            toast.error(error.message);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
