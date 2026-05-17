import { NextResponse } from 'next/server'
import { continueWriting } from '@/lib/claude'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text?.trim()) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      )
    }

    const result = await continueWriting(text)

    return NextResponse.json({ result })
  } catch (e) {
    return NextResponse.json(
      { error: 'AI continue writing failed' },
      { status: 500 }
    )
  }
}