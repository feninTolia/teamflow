import { Button } from '@/components/ui/button';
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from '@/components/ui/emoji-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SmilePlusIcon } from 'lucide-react';
import { useState } from 'react';

interface Props {
  onSelect: (emoji: string) => void;
}

const EmojiReaction = ({ onSelect }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    onSelect(emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button size={'icon'} variant={'ghost'} className="size-6">
          <SmilePlusIcon className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-fit p-0"
        align="start"
        // onMouseLeave={() => setIsOpen(false)}
      >
        <EmojiPicker
          className="h-[330px] overflow-y-auto"
          onEmojiSelect={(e) => handleEmojiSelect(e.emoji)}
        >
          <EmojiPickerSearch />
          <EmojiPickerContent />
          <EmojiPickerFooter className="[&>span]:text-foreground" />
        </EmojiPicker>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiReaction;
