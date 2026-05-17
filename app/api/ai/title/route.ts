import { NextResponse } from 'next/server'
import { suggestTitles } from '@/lib/claude'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text?.trim()) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      )
    }

    const titles = await suggestTitles(text)

    return NextResponse.json({ titles })
  } catch (e) {
    return NextResponse.json(
      { error: 'AI title generation failed' },
      { status: 500 }
    )
  }
}