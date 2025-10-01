import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check AI access trial status
    const { data: aiAccess, error: accessError } = await supabaseClient
      .from('user_ai_access')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (accessError) {
      console.error('Error fetching AI access:', accessError);
      throw new Error('Unable to verify AI access');
    }

    // Check if trial period has ended
    const now = new Date();
    const trialEnds = new Date(aiAccess.trial_ends_at);
    
    if (now > trialEnds) {
      return new Response(
        JSON.stringify({ 
          error: 'trial_ended',
          message: 'Your free AI Practice Coach trial has come to an end. To continue using this feature, please upgrade your account.',
          trialEndedAt: aiAccess.trial_ends_at
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { message, context } = await req.json();

    // Build context for the AI
    const systemPrompt = `You are an expert Scottish pipe band drumming coach. You help drummers improve their practice sessions.

Current practice context:
- BPM: ${context?.bpm || 'not specified'}
- Time Signature: ${context?.timeSignature || 'not specified'}
- Session duration: ${context?.sessionDuration || 'not specified'}

Provide concise, actionable practice advice. Focus on:
1. Technique improvement
2. Practice routine suggestions
3. Scottish pipe band drumming traditions
4. Metronome usage tips

Keep responses under 150 words unless asked for detailed explanations.`;

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('AI service not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      throw new Error('AI service unavailable');
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0]?.message?.content;

    // Update request count
    await supabaseClient
      .from('user_ai_access')
      .update({ 
        total_requests: aiAccess.total_requests + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        requestsUsed: aiAccess.total_requests + 1,
        trialEndsAt: aiAccess.trial_ends_at
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in practice-coach function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});