'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onUploadImage: (file: File) => Promise<string>;
};

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
};

function ToolbarButton({ label, active = false, onClick, disabled = false }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${active ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {label}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, onUploadImage }: RichTextEditorProps) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [uploading, setUploading] = useState(false);
  const fileInputId = useId();
  const skipUpdateRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image,
      Placeholder.configure({
        placeholder: 'Mulai menulis artikel seperti editor visual WordPress...',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'min-h-[24rem] rounded-b-[1.4rem] px-5 py-5 focus:outline-none',
      },
    },
    onUpdate({ editor: currentEditor }) {
      if (skipUpdateRef.current) {
        skipUpdateRef.current = false;
        return;
      }

      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const current = editor.getHTML();

    if (value !== current) {
      skipUpdateRef.current = true;
      editor.commands.setContent(value || '<p></p>', { emitUpdate: false });
    }
  }, [editor, value]);

  async function handleImageFile(file: File) {
    setUploading(true);

    try {
      const url = await onUploadImage(file);
      editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
    } finally {
      setUploading(false);
    }
  }

  function promptForLink() {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Masukkan URL link', previousUrl || 'https://');

    if (url === null) {
      return;
    }

    if (url.trim() === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-white/70 bg-white/85">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            ['visual', 'Visual'],
            ['html', 'HTML'],
          ].map(([valueMode, label]) => (
            <button
              key={valueMode}
              type="button"
              onClick={() => setMode(valueMode as 'visual' | 'html')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${mode === valueMode ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'visual' ? (
          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton label="B" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} />
            <ToolbarButton label="I" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} />
            <ToolbarButton label="H2" active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} />
            <ToolbarButton label="H3" active={editor?.isActive('heading', { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} />
            <ToolbarButton label="List" active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
            <ToolbarButton label="Quote" active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()} />
            <ToolbarButton label="Code" active={editor?.isActive('codeBlock')} onClick={() => editor?.chain().focus().toggleCodeBlock().run()} />
            <ToolbarButton label="Link" active={editor?.isActive('link')} onClick={promptForLink} />
            <label htmlFor={fileInputId} className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${uploading ? 'cursor-wait bg-slate-200 text-slate-500' : 'cursor-pointer bg-white text-slate-700 hover:bg-slate-100'}`}>
              {uploading ? 'Upload...' : 'Gambar'}
            </label>
            <input
              id={fileInputId}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';

                if (!file) {
                  return;
                }

                await handleImageFile(file);
              }}
            />
          </div>
        ) : null}
      </div>

      {mode === 'visual' ? (
        <div className="admin-editor-shell">
          <EditorContent editor={editor} />
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={18}
          className="min-h-[24rem] w-full resize-y border-0 px-5 py-5 font-mono text-sm text-slate-900 outline-none"
        />
      )}
    </div>
  );
}