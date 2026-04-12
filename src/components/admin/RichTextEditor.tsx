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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInlineMarkdown(value: string) {
  let output = escapeHtml(value);

  output = output.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/\*(.+?)\*/g, '<em>$1</em>');
  output = output.replace(/`([^`]+)`/g, '<code>$1</code>');
  output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');

  return output;
}

function normalizeMarkdownText(value: string) {
  return value
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\\r\\n|\\n|\\r/g, '\n')
    .replace(/`r`n|`n|`r/g, '\n')
    .replace(/([^\n])\s+(#{1,6}\s)/g, '$1\n\n$2')
    .replace(/([^\n])\s+(\d+\.\s+)/g, '$1\n\n$2')
    .replace(/\n{3,}/g, '\n\n');
}

function looksLikeMarkdown(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  if (/<\/?[a-z][\s\S]*>/i.test(trimmed)) {
    return false;
  }

  return /(^|\n)#{1,6}\s|(^|\n)\d+\.\s|\*\*.+?\*\*/.test(trimmed);
}

function markdownToHtmlLite(value: string) {
  const normalized = normalizeMarkdownText(value);
  const lines = normalized.split('\n');
  const blocks: string[] = [];
  let listItems: string[] = [];
  let pendingHeadingLevel: number | null = null;

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push(`<ol>${listItems.join('')}</ol>`);
      listItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // Support broken markdown where heading marker is alone on one line, e.g. "###".
    const markerOnly = line.replace(/\s+/g, '');
    if (/^#{1,6}$/.test(markerOnly)) {
      flushList();
      pendingHeadingLevel = markerOnly.length >= 3 ? 3 : 2;
      continue;
    }

    if (pendingHeadingLevel) {
      flushList();
      blocks.push(`<h${pendingHeadingLevel}>${renderInlineMarkdown(line)}</h${pendingHeadingLevel}>`);
      pendingHeadingLevel = null;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length >= 3 ? 3 : 2;
      blocks.push(`<h${level}>${renderInlineMarkdown(headingMatch[2].trim())}</h${level}>`);
      continue;
    }

    const listMatch = line.match(/^\d+\.\s+(.+)$/);
    if (listMatch) {
      listItems.push(`<li>${renderInlineMarkdown(listMatch[1].trim())}</li>`);
      continue;
    }

    flushList();
    blocks.push(`<p>${renderInlineMarkdown(line)}</p>`);
  }

  if (pendingHeadingLevel) {
    blocks.push(`<h${pendingHeadingLevel}>Subjudul</h${pendingHeadingLevel}>`);
  }

  flushList();

  return blocks.join('') || '<p></p>';
}

function ToolbarButton({ label, active = false, onClick, disabled = false }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${active ? 'bg-slate-900 text-white dark:bg-teal-600' : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {label}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, onUploadImage }: RichTextEditorProps) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [uploading, setUploading] = useState(false);
  const fileInputId = useId();
  const convertedInitialMarkdownRef = useRef(false);
  const onChangeRef = useRef(onChange);
  // Tracks the last HTML value the editor emitted (or we pushed in), so we can
  // skip echoes without relying on editor.isFocused (which is unreliable in
  // React 18 concurrent mode).
  const externalValueRef = useRef(value ?? '');

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
        class: 'min-h-[24rem] rounded-b-[1.4rem] px-5 py-5 text-slate-900 dark:text-slate-100 focus:outline-none',
      },
    },
    onUpdate({ editor: currentEditor }) {
      const html = currentEditor.getHTML();
      externalValueRef.current = html;
      onChangeRef.current(html);
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const shouldConvertMarkdown = !convertedInitialMarkdownRef.current && looksLikeMarkdown(value);
    const nextContent = shouldConvertMarkdown
      ? markdownToHtmlLite(value)
      : value || '<p></p>';

    // If the incoming value is the same as what the editor last emitted, it's
    // just a React echo of the editor's own change — skip to avoid resetting
    // the editor while the user is typing.
    if (!shouldConvertMarkdown && nextContent === externalValueRef.current) {
      return;
    }

    editor.commands.setContent(nextContent, { emitUpdate: false });
    externalValueRef.current = nextContent;

    if (shouldConvertMarkdown) {
      convertedInitialMarkdownRef.current = true;
      onChangeRef.current(nextContent);
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
    <div className="overflow-hidden rounded-[1.6rem] border border-slate-300 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          {[
            ['visual', 'Visual'],
            ['html', 'HTML'],
          ].map(([valueMode, label]) => (
            <button
              key={valueMode}
              type="button"
              onClick={() => setMode(valueMode as 'visual' | 'html')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${mode === valueMode ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}
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
            <label htmlFor={fileInputId} className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${uploading ? 'cursor-wait bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400' : 'cursor-pointer bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'}`}>
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
          className="min-h-[24rem] w-full resize-y border-0 bg-transparent px-5 py-5 font-mono text-sm text-slate-900 outline-none dark:text-slate-100"
        />
      )}
    </div>
  );
}
