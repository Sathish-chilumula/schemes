import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';


const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      console.error('Chat AI error: GROQ_API_KEY not configured');
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const bodyText = await req.text();
    if (!bodyText) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }
    
    const { messages, userProfile } = JSON.parse(bodyText);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    // 1. Build context-aware System Prompt
    let userContextStr = '';
    if (userProfile) {
      userContextStr = `\n\nCURRENT USER PROFILE:\n- Name: ${userProfile.name || 'Unknown'}\n- Country Code: ${userProfile.country || 'Unknown'}\n- Phone: ${userProfile.phone || 'Unknown'} (This user is already signed in!)`;
    }

    const systemPrompt = `You are SchemeBot, an advanced AI agent for SchemeAtlas.
Your job is to help users find government schemes and benefits they qualify for across the world.

Rules:
- NEVER guess or hallucinate schemes if you don't know them. Instead, ALWAYS use the 'search_schemes_database' tool to look up real schemes from our Supabase database.
- Keep answers concise, warm, and supportive. Use simple formatting (bolding key terms).
- If the user asks for schemes for a specific demographic (e.g. "farmers in India"), use the tool to search country_code="IN" and keywords="farmer".
- The user profile might already have their country, use that if they don't specify one!${userContextStr}`;

    const recentMessages = messages.slice(-10);
    const groqMessages: any[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
    ];

    // 2. Define the exact tools the LLM can use (The "Agent Blueprint")
    const tools = [
      {
        type: 'function',
        function: {
          name: 'search_schemes_database',
          description: 'Queries the live SchemeAtlas Supabase database for official government schemes. Use this whenever the user asks for schemes for their demographic.',
          parameters: {
            type: 'object',
            properties: {
              country_code: {
                type: 'string',
                description: '2-letter ISO country code to search in (e.g., IN, US, GB). If you know the user context, use that.'
              },
              search_keyword: {
                type: 'string',
                description: 'A single strong keyword to search for in scheme names or descriptions (e.g., "farmer", "student", "maternity", "housing"). Avoid generic words.'
              }
            },
            required: ['country_code']
          }
        }
      }
    ];

    // 3. Make initial request to Groq LLM (LLaMA 3)
    const firstResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        tools: tools,
        tool_choice: 'auto',
        temperature: 0.3, // Lower temp for reliable tool calling
        max_tokens: 512,
      }),
    });

    if (!firstResponse.ok) {
      console.error('Groq Error:', await firstResponse.text());
      return NextResponse.json({ error: 'AI unavailable' }, { status: 502 });
    }

    const firstData = await firstResponse.json();
    const assistantMessage = firstData.choices?.[0]?.message;

    // 4. Did the LLM want to use a tool? (The "QueryEngine" loop behavior)
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      
      if (toolCall.function.name === 'search_schemes_database') {
        const args = JSON.parse(toolCall.function.arguments);
        
        // Execute the tool (Query Supabase)
        const supabase = supabaseAdmin();
        let query = supabase.from('schemes').select('name, category, what_you_get, eligibility, official_url').eq('is_published', true);
        
        if (args.country_code) {
          query = query.eq('country_code', args.country_code.toUpperCase());
        }
        
        if (args.search_keyword) {
          query = query.or(`name.ilike.%${args.search_keyword}%,category.ilike.%${args.search_keyword}%,target_group.cs.{${args.search_keyword}}`);
        }
        
        const { data: dbSchemes, error: dbError } = await query.limit(3);

        let toolResultStr = '';
        if (dbError) {
          toolResultStr = `Database error: ${dbError.message}`;
        } else if (!dbSchemes || dbSchemes.length === 0) {
          toolResultStr = `No matching schemes found in ${args.country_code} for "${args.search_keyword || 'all'}".`;
        } else {
          toolResultStr = JSON.stringify(dbSchemes);
        }

        // Add the tool call memory to context
        groqMessages.push(assistantMessage); // Push the assistant's intent to use tool
        
        // Send the tool result back
        groqMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResultStr
        });

        // 5. Make the SECOND request to Groq so it can read the DB output and reply to user
        const secondResponse = await fetch(GROQ_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            temperature: 0.7, // Normal temp for conversational output
            max_tokens: 512,
          }),
        });

        const secondData = await secondResponse.json();
        return NextResponse.json({ reply: secondData.choices[0].message.content });
      }
    }

    // Direct answer (LLM chose not to use a tool)
    return NextResponse.json({ reply: assistantMessage.content });

  } catch (err) {
    console.error('Chat AI error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


