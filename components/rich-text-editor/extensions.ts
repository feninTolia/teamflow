import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import TextAlign from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extensions/placeholder';
import StarterKit from '@tiptap/starter-kit';
import { all, createLowlight } from 'lowlight';

const lowlight = createLowlight(all);

export const baseExtensions = [
  StarterKit.configure({ codeBlock: false }),
  TextAlign.configure({ types: ['paragraph', 'heading'] }),
  CodeBlockLowlight.configure({
    lowlight,
  }),
];

export const editorExtensions = [
  ...baseExtensions,
  Placeholder.configure({
    placeholder: 'Type your message...',
  }),
];
