'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface EditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export function Editor({ content, onChange, placeholder }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: {},
      }),
      Placeholder.configure({
        placeholder:
          placeholder ?? 'Begin your story here…\n\nLet the words flow freely.',
      }),
      CharacterCount,
      Typography,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: { class: 'tiptap-prose outline-none min-h-full' },
    },
    immediatelyRender: false,
  })

  // Sync content when switching chapters
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== content) {
      editor.commands.setContent(content || '', false)
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto">
        <div className="tiptap-editor max-w-2xl mx-auto px-10 py-8 min-h-full">
          <EditorContent editor={editor} className="min-h-full" />
        </div>
      </div>
    </div>
  )
}

type TipTapEditor = NonNullable<ReturnType<typeof useEditor>>

// ── Divider between toolbar groups ───────────────────────────
function Divider() {
  return <div className="w-px h-4 bg-gold-100 mx-0.5 flex-shrink-0" />
}

// ── Single toolbar button ─────────────────────────────────────
function ToolBtn({
  label,
  onClick,
  isActive,
  title,
  disabled,
}: {
  label: React.ReactNode
  onClick: () => void
  isActive?: boolean
  title?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title ?? String(label)}
      disabled={disabled}
      className={cn(
        'px-2.5 py-1 rounded text-[12px] border transition-colors flex-shrink-0 disabled:opacity-40',
        isActive
          ? 'bg-ink-900 text-gold border-ink-900'
          : 'border-gold-100 text-ink-500 hover:bg-cream hover:border-gold-200 hover:text-ink-800'
      )}
    >
      {label}
    </button>
  )
}

function EditorToolbar({ editor }: { editor: TipTapEditor }) {
  return (
    <div className="flex items-center gap-1 px-6 py-2 border-b border-gold-100 bg-paper flex-wrap flex-shrink-0">

      {/* ── Text style ─────────── */}
      <ToolBtn
        label={<b>B</b>}
        title="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
      />
      <ToolBtn
        label={<em>I</em>}
        title="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
      />
      <ToolBtn
        label={<u>U</u>}
        title="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
      />

      <Divider />

      {/* ── Headings ───────────── */}
      <ToolBtn
        label="H1"
        title="Heading 1"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        isActive={editor.isActive('heading', { level: 1 })}
      />
      <ToolBtn
        label="H2"
        title="Heading 2"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        isActive={editor.isActive('heading', { level: 2 })}
      />

      <Divider />

      {/* ── Block elements ─────── */}
      <ToolBtn
        label={<span className="tracking-tight">" "</span>}
        title="Blockquote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
      />
      <ToolBtn
        label="— Break"
        title="Scene break (* * *)"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />

      <Divider />

      {/* ── Alignment ──────────── */}
      <ToolBtn
        label="≡L"
        title="Align left"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
      />
      <ToolBtn
        label="≡C"
        title="Align center"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
      />
      <ToolBtn
        label="≡R"
        title="Align right"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
      />

      <Divider />

      {/* ── History ────────────── */}
      <ToolBtn
        label="↩ Undo"
        title="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      />
      <ToolBtn
        label="↪ Redo"
        title="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      />

      {/* ── Word count ─────────── */}
      <div className="ml-auto flex-shrink-0">
        <span className="text-[11px] text-ink-300 tabular-nums">
          {editor.storage.characterCount?.words() ?? 0} words
        </span>
      </div>
    </div>
  )
}