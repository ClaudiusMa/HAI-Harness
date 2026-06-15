"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, Heading1, Heading2, List, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TipTapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  return (
    <div className="flex flex-wrap gap-1 border-b bg-gray-50 p-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn('h-8 w-8 p-0', editor.isActive('bold') && 'bg-gray-200')}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn('h-8 w-8 p-0', editor.isActive('italic') && 'bg-gray-200')}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn('h-8 w-8 p-0', editor.isActive('heading', { level: 1 }) && 'bg-gray-200')}
        aria-label="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn('h-8 w-8 p-0', editor.isActive('heading', { level: 2 }) && 'bg-gray-200')}
        aria-label="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn('h-8 w-8 p-0', editor.isActive('bulletList') && 'bg-gray-200')}
        aria-label="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          const url = window.prompt('Enter URL:')
          if (url) {
            editor.chain().focus().setLink({ href: url }).run()
          }
        }}
        className={cn('h-8 w-8 p-0', editor.isActive('link') && 'bg-gray-200')}
        aria-label="Add Link"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  className,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl',
          'max-w-none focus:outline-none',
          'min-h-[300px] p-4',
          className
        ),
      },
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
