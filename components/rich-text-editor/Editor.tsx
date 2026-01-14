'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import { editorExtensions } from './extensions';
import MenuBar from './MenuBar';
import { ReactNode } from 'react';

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filed: any;
  sendButton: ReactNode;
  footerLeft?: ReactNode;
};

const RichTextEditor = ({ filed, sendButton, footerLeft }: Props) => {
  const editor = useEditor({
    extensions: editorExtensions,
    content: (() => {
      if (!filed?.value) return '';

      try {
        return JSON.parse(filed.value);
      } catch {
        return '';
      }
    })(),
    onUpdate: ({ editor }) => {
      if (filed?.onChange) {
        filed.onChange(JSON.stringify(editor.getJSON()));
      }
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          '!max-w-none !min-h-[125px] focus:outline-none p-4 prose dark:prose-invert marker:text-primary',
      },
    },
  });

  return (
    <div className="relative w-full border border-input rounded-lg overflow-hidden dark:bg-input/30 flex flex-col ">
      <MenuBar editor={editor} />

      <EditorContent
        editor={editor}
        className="max-h-[200px] overflow-y-auto"
      />

      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-input bg-card">
        <div className="min-h-8 flex items-center">{footerLeft}</div>
        <div className=" shrink-0">{sendButton}</div>
      </div>
    </div>
  );
};

export default RichTextEditor;
