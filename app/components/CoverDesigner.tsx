'use client'

import { useState, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { cn } from '@/lib/utils'
import { COVER_THEMES, COVER_ORNAMENTS } from '@/types'
import type { Book, CoverThemeName, CoverTheme } from '@/types'

interface CoverDesignerProps {
  book: Book
  onBookChange: (book: Book) => void
}

// ── Google Font options ───────────────────────────────────────
export const COVER_FONTS = [
  { name: 'Playfair Display', label: 'Playfair',    style: 'serif',       url: 'Playfair+Display:wght@400;700' },
  { name: 'Lora',             label: 'Lora',         style: 'serif',       url: 'Lora:wght@400;700' },
  { name: 'Cormorant Garamond', label: 'Cormorant', style: 'serif',       url: 'Cormorant+Garamond:wght@400;700' },
  { name: 'EB Garamond',      label: 'EB Garamond',  style: 'serif',       url: 'EB+Garamond:wght@400;700' },
  { name: 'Libre Baskerville',label: 'Baskerville',  style: 'serif',       url: 'Libre+Baskerville:wght@400;700' },
  { name: 'Merriweather',     label: 'Merriweather', style: 'serif',       url: 'Merriweather:wght@400;700' },
  { name: 'Crimson Text',     label: 'Crimson',      style: 'serif',       url: 'Crimson+Text:wght@400;700' },
  { name: 'Spectral',         label: 'Spectral',     style: 'serif',       url: 'Spectral:wght@400;700' },
  { name: 'Cinzel',           label: 'Cinzel',       style: 'serif',       url: 'Cinzel:wght@400;700' },
  { name: 'Josefin Slab',     label: 'Josefin Slab', style: 'serif',       url: 'Josefin+Slab:wght@400;700' },
  { name: 'Raleway',          label: 'Raleway',      style: 'sans-serif',  url: 'Raleway:wght@300;700' },
  { name: 'Montserrat',       label: 'Montserrat',   style: 'sans-serif',  url: 'Montserrat:wght@300;700' },
  { name: 'Oswald',           label: 'Oswald',       style: 'sans-serif',  url: 'Oswald:wght@300;700' },
  { name: 'Bebas Neue',       label: 'Bebas Neue',   style: 'sans-serif',  url: 'Bebas+Neue' },
  { name: 'Abril Fatface',    label: 'Abril Fatface', style: 'display',    url: 'Abril+Fatface' },
  { name: 'Righteous',        label: 'Righteous',    style: 'display',     url: 'Righteous' },
] as const

type CoverFont = typeof COVER_FONTS[number]

// ── Load a Google Font dynamically ───────────────────────────
function loadGoogleFont(font: CoverFont) {
  const id = `gfont-${font.name.replace(/\s/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id   = id
  link.rel  = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${font.url}&display=swap`
  document.head.appendChild(link)
}

export function CoverDesigner({ book, onBookChange }: CoverDesignerProps) {
  const supabase  = getSupabaseClient()
  const fileRef   = useRef<HTMLInputElement>(null)

  const [saving,       setSaving]       = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [imgError,     setImgError]     = useState('')

  // ── Persist a partial book update ───────────────────────────
  async function updateBook(patch: Partial<Book>) {
    const updated = { ...book, ...patch }
    onBookChange(updated)
    setSaving(true)
    const { error } = await supabase
      .from('books')
      .update(patch)
      .eq('id', book.id)
    if (error) console.error('Cover save error:', error)
    setSaving(false)
  }

  // ── Theme picker ─────────────────────────────────────────────
  function setTheme(name: CoverThemeName) {
    updateBook({ cover_theme: COVER_THEMES[name] })
  }

  function isActiveTheme(name: CoverThemeName) {
    return book.cover_theme?.bg === COVER_THEMES[name].bg
  }

  // ── Font picker ──────────────────────────────────────────────
  function setFont(font: CoverFont) {
    loadGoogleFont(font)
    updateBook({ cover_font: font.name })
  }

  // ── Image upload ─────────────────────────────────────────────
  async function handleImageUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setImgError('Image must be under 5 MB.')
      return
    }
    setUploadingImg(true)
    setImgError('')

    const ext  = file.name.split('.').pop()
    const path = `covers/${book.id}/bg.${ext}`

    const { error: upErr } = await supabase.storage
      .from('cover-images')
      .upload(path, file, { upsert: true })

    if (upErr) {
      setImgError('Upload failed. Check Supabase storage bucket.')
      setUploadingImg(false)
      return
    }

    const { data } = supabase.storage
      .from('cover-images')
      .getPublicUrl(path)

    await updateBook({ cover_image_url: data.publicUrl })
    setUploadingImg(false)
  }

  async function removeImage() {
    await updateBook({ cover_image_url: null })
  }

  // ── Group fonts by style ──────────────────────────────────────
  const fontGroups = [
    { label: 'Serif',       fonts: COVER_FONTS.filter(f => f.style === 'serif') },
    { label: 'Sans-serif',  fonts: COVER_FONTS.filter(f => f.style === 'sans-serif') },
    { label: 'Display',     fonts: COVER_FONTS.filter(f => f.style === 'display') },
  ]

  return (
    <aside className="w-72 bg-cream border-r border-gold-200 flex flex-col overflow-y-auto flex-shrink-0">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gold-200 flex-shrink-0">
        <h2 className="font-serif text-lg text-ink-900">Cover Design</h2>
        <p className="text-xs text-ink-400 mt-0.5">
          {saving ? '⟳ Saving…' : '✓ Changes save automatically'}
        </p>
      </div>

      <div className="p-5 space-y-6">

        {/* ── Cover title ──────────────────────────────────── */}
        <Field label="Cover Title">
          <input
            value={book.title}
            onChange={e => updateBook({ title: e.target.value })}
            className={inputCls}
            placeholder="Your Book Title"
          />
        </Field>

        {/* ── Cover subtitle ───────────────────────────────── */}
        <Field label="Subtitle">
          <input
            value={book.cover_subtitle ?? ''}
            onChange={e => updateBook({ cover_subtitle: e.target.value })}
            className={inputCls}
            placeholder="A Novel"
          />
        </Field>

        {/* ── Author name ──────────────────────────────────── */}
        <Field label="Author Name">
          <input
            value={book.author_name}
            onChange={e => updateBook({ author_name: e.target.value })}
            className={inputCls}
            placeholder="Your Name"
          />
        </Field>

        {/* ── Theme ────────────────────────────────────────── */}
        <Field label="Theme">
          <div className="grid grid-cols-2 gap-2">
            {(
              Object.entries(COVER_THEMES) as [CoverThemeName, CoverTheme][]
            ).map(([name, theme]) => (
              <button
                key={name}
                onClick={() => setTheme(name)}
                className={cn(
                  'py-2.5 px-3 rounded-lg text-xs font-medium capitalize border-2 transition-all',
                  isActiveTheme(name)
                    ? 'border-gold scale-[1.02] shadow-md'
                    : 'border-transparent hover:scale-[1.01] hover:border-gold-400'
                )}
                style={{ background: theme.bg, color: theme.text }}
              >
                {name.replace('-', ' ')}
              </button>
            ))}
          </div>
        </Field>

        {/* ── Cover font ───────────────────────────────────── */}
        <Field label="Cover Font">
          <div className="space-y-3">
            {fontGroups.map(group => (
              <div key={group.label}>
                <p className="text-[9px] uppercase tracking-widest text-ink-300 mb-1.5">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.fonts.map(font => {
                    const isActive = book.cover_font === font.name
                    return (
                      <button
                        key={font.name}
                        onClick={() => setFont(font)}
                        onMouseEnter={() => loadGoogleFont(font)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all',
                          isActive
                            ? 'border-gold bg-gold-50 shadow-sm'
                            : 'border-transparent hover:border-gold-200 hover:bg-paper'
                        )}
                      >
                        <span
                          className="text-lg leading-none text-ink-800 w-8 text-center flex-shrink-0"
                          style={{ fontFamily: `'${font.name}', ${font.style}` }}
                        >
                          Aa
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-ink-700 truncate">
                            {font.label}
                          </p>
                          <p className="text-[10px] text-ink-300 capitalize">
                            {font.style}
                          </p>
                        </div>
                        {isActive && (
                          <span className="ml-auto text-gold text-xs flex-shrink-0">
                            ✓
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </Field>

        {/* ── Ornament ─────────────────────────────────────── */}
        <Field label="Ornament">
          <div className="flex flex-wrap gap-2">
            {COVER_ORNAMENTS.map(o => (
              <button
                key={o}
                onClick={() => updateBook({ cover_ornament: o })}
                className={cn(
                  'w-10 h-10 rounded-lg border text-xl flex items-center justify-center transition-all',
                  book.cover_ornament === o
                    ? 'border-gold bg-gold-50 scale-110 shadow'
                    : 'border-gold-200 hover:border-gold bg-paper'
                )}
              >
                {o}
              </button>
            ))}
          </div>
        </Field>

        {/* ── Background image ─────────────────────────────── */}
        <Field label="Cover Image">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleImageUpload(f)
            }}
          />

          {book.cover_image_url ? (
            <div className="relative rounded-lg overflow-hidden border border-gold-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={book.cover_image_url}
                alt="Cover background"
                className="w-full h-24 object-cover"
              />
              <div className="absolute inset-0 bg-ink-900/40 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-xs bg-paper text-ink-800 px-3 py-1 rounded-md font-medium"
                >
                  Change
                </button>
                <button
                  onClick={removeImage}
                  className="text-xs bg-red-800 text-red-100 px-3 py-1 rounded-md font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingImg}
              className="w-full border-2 border-dashed border-gold-200 hover:border-gold rounded-xl py-5 flex flex-col items-center gap-1.5 transition-colors disabled:opacity-60"
            >
              {uploadingImg ? (
                <span className="text-sm text-ink-400">⟳ Uploading…</span>
              ) : (
                <>
                  <span className="text-2xl opacity-30">🖼</span>
                  <span className="text-xs text-ink-400">
                    Click to upload image
                  </span>
                  <span className="text-[10px] text-ink-300">
                    PNG · JPG · WEBP · max 5 MB
                  </span>
                </>
              )}
            </button>
          )}

          {imgError && (
            <p className="text-xs text-red-500 mt-1">{imgError}</p>
          )}

          {book.cover_image_url && (
            <div className="mt-2">
              <p className="text-[10px] text-ink-400 mb-1">
                Image opacity
              </p>
              <input
                type="range"
                min={10}
                max={90}
                step={5}
                value={book.cover_image_opacity ?? 35}
                onChange={e =>
                  updateBook({
                    cover_image_opacity: Number(e.target.value),
                  })
                }
                className="w-full accent-gold"
              />
              <div className="flex justify-between text-[10px] text-ink-300 mt-0.5">
                <span>Subtle</span>
                <span>{book.cover_image_opacity ?? 35}%</span>
                <span>Bold</span>
              </div>
            </div>
          )}
        </Field>

      </div>
    </aside>
  )
}

// ── Helpers ───────────────────────────────────────────────────
function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-medium text-ink-400 mb-2">
        {label}
      </p>
      {children}
    </div>
  )
}

const inputCls =
  'w-full bg-paper border border-gold-200 rounded-lg px-3 py-2 text-sm text-ink-800 outline-none focus:border-gold transition-colors'