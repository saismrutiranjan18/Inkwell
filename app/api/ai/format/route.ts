import { NextResponse } from 'next/server'
import { formatChapter } from '@/lib/claude'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text?.trim()) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      )
    }

    const result = await formatChapter(text)

    return NextResponse.json({ result })
  } catch (e) {
    return NextResponse.json(
      { error: 'AI formatting failed' },
      { status: 500 }
    )
  }
}