import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are SchemeBot, a friendly and knowledgeable AI assistant for SchemeAtlas — a platform that helps people discover government schemes and benefits they qualify for across India, UK, USA, Nigeria, and Kenya.

Your role:
- Help users find relevant government schemes, welfare programs, and financial benefits
- Explain eligibility requirements in simple language
- Guide users through how to apply for schemes
- Mention what documents are typically needed
- Answer questions about specific government programs (PM Kisan, Universal Credit, SNAP, etc.)
- Be concise, warm, and supportive — many users may be from rural areas or low-income backgrounds

Rules:
- Only discuss government schemes, benefits, welfare programs, and related topics
- If asked something unrelated, politely redirect back to schemes
- Always mention users can visit the scheme detail pages on SchemeAtlas for full info
- Keep answers under 200 words unless a detailed breakdown is genuinely needed
- Support questions in English, Hindi, Swahili, or Yoruba if the user writes in those languages
- Never give legal or medical advice — only scheme information

Tone: Helpful, simple, encouraging. Like a trusted community helper.`;

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    // Build Groq messages (OpenAI-compatible format) — last 10 messages for context
    const recentMessages = messages.slice(-10);

    const groqMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentMessages.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
    ];

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 512,
        top_p: 0.9,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 502 });
    }

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
