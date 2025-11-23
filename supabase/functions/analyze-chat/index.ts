import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chatContent } = await req.json();

    if (!chatContent || typeof chatContent !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid chat content provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an expert at analyzing WhatsApp group chat conversations and extracting actionable project insights.

Your task is to analyze the chat and extract:
1. **Tasks**: Action items mentioned, who they're assigned to (if mentioned), and priority level
2. **Deadlines**: Time-sensitive items with dates/times when mentioned
3. **Decisions**: Key decisions made by the group
4. **Responsibilities**: Who is responsible for what

Extract information even if not perfectly formatted. Look for:
- Tasks: "need to", "should", "will do", "TODO", "action item", "let's", etc.
- Deadlines: dates, times, "by", "due", "before", "deadline", etc.
- Decisions: "decided", "agreed", "we'll go with", "final", "approved", etc.
- Responsibilities: "I'll", "you can", "assigned to", names followed by tasks, etc.

Return a JSON object with this EXACT structure (no markdown, just JSON):
{
  "summary": "A brief 2-3 sentence overview of the conversation",
  "tasks": [
    {"task": "description", "assignee": "name or null", "priority": "high/medium/low or null"}
  ],
  "deadlines": [
    {"deadline": "description", "date": "extracted date/time or null", "description": "context"}
  ],
  "decisions": [
    {"decision": "description", "context": "brief context"}
  ],
  "responsibilities": [
    {"person": "name", "responsibility": "description"}
  ]
}

Be thorough but concise. If a category has no items, return an empty array.`;

    console.log('Sending request to Lovable AI...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this WhatsApp chat:\n\n${chatContent}` }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Received response from AI');

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'Invalid AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let analysisResults;
    try {
      analysisResults = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysisResults = JSON.parse(jsonMatch[1]);
      } else {
        return new Response(
          JSON.stringify({ error: 'Failed to parse AI response' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify(analysisResults),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
