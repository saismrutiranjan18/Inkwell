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
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, horizontalRule: {} }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Begin your story here...\n\nLet the words flow freely.',
      }),
      CharacterCount,
      Typography,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    onUpdate: ({ editor }) => { onChange(editor.getHTML()) },
    editorProps: { attributes: { class: 'tiptap-prose outline-none min-h-full' } },
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
        <div className="tiptap-editor max-w-2xl mx-auto px-8 py-6 min-h-full">
          <EditorContent editor={editor} className="min-h-full" />
        </div>
      </div>
    </div>
  )
}

type TipTapEditor = NonNullable<ReturnType<typeof useEditor>>

function EditorToolbar({ editor }: { editor: TipTapEditor }) {
  const btn = (label: string, action: () => void, isActive?: boolean, title?: string) => (
    <button key={label} onClick={action} title={title ?? label}
      className={cn('px-2.5 py-1 rounded text-sm border transition-colors',
        isActive ? 'bg-ink-900 text-gold border-ink-900'
                 : 'border-gold-200 text-ink-600 hover:bg-cream hover:border-gold-300')}>
      {label}
    </button>
  )

  return (
    <div className="flex items-center gap-1.5 px-6 py-2 border-b border-gold-100 bg-paper flex-wrap">
      {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
      {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
      {btn('U', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
      <div className="w-px h-4 bg-gold-200 mx-1" />
      {btn('H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
      {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
      <div className="w-px h-4 bg-gold-200 mx-1" />
      {btn('" "', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'), 'Blockquote')}
      {btn('— Break', () => editor.chain().focus().setHorizontalRule().run(), false, 'Scene Break')}
      <div className="w-px h-4 bg-gold-200 mx-1" />
      {btn('↩ Undo', () => editor.chain().focus().undo().run(), false, 'Undo')}
      {btn('↪ Redo', () => editor.chain().focus().redo().run(), false, 'Redo')}
    </div>
  )
}