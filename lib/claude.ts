import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const MODEL = 'claude-sonnet-4-20250514'

// ── Format chapter ────────────────────────────────────────
export async function formatChapter(text: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: `You are a professional literary editor. The user gives you a chapter of a novel.
Improve paragraph breaks, ensure dialogue is properly punctuated with curly quotes ("" and ''),
fix obvious typos, add a "* * *" scene break where there is a clear tonal shift.
Return ONLY the improved text. No commentary, no preamble, no markdown fences.`,
    messages: [{ role: 'user', content: text }],
  })
  return (msg.content[0] as { text: string }).text
}

// ── Fix grammar ───────────────────────────────────────────
export async function fixGrammar(text: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: `You are a copyeditor. Fix only clear grammar, punctuation and spelling errors.
Do not change the author's style, voice, or word choices.
Return ONLY the corrected text. No commentary.`,
    messages: [{ role: 'user', content: text }],
  })
  return (msg.content[0] as { text: string }).text
}

// ── Suggest titles ────────────────────────────────────────
export async function suggestTitles(text: string): Promise<string[]> {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: `You are a literary editor. Based on the chapter content, suggest exactly 5 evocative,
literary chapter titles. Return them as a JSON array of strings only.
Example: ["Into the Dark", "What the River Knows", "A Quiet Kind of Grief", "Before the Rain", "The Last Summer"]
No markdown, no explanation, just the JSON array.`,
    messages: [{ role: 'user', content: text }],
  })
  const raw = (msg.content[0] as { text: string }).text.trim()
  try {
    return JSON.parse(raw) as string[]
  } catch {
    return raw.split('\n').map(t => t.replace(/^[-•*"[\]0-9.\s]+/, '').replace(/[",\]]+$/, '').trim()).filter(Boolean).slice(0, 5)
  }
}

// ── Continue writing ──────────────────────────────────────
export async function continueWriting(text: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are a novelist's writing assistant. Continue the story naturally from where it left off.
Write 2–3 paragraphs that match the established tone, voice and pace.
Return ONLY the continuation text — no commentary, no "Here is the continuation:" preamble.`,
    messages: [{ role: 'user', content: text }],
  })
  return (msg.content[0] as { text: string }).text
}
