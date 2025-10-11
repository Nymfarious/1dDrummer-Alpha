import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { getEnv, logEnvReport } from '../_shared/env-resolver.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: Track requests per user
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  console.log(`[${requestId}] 🗺️ Maps config request received`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log environment resolution on first request (or periodically)
    if (!globalThis._envLogged) {
      logEnvReport('get-maps-config');
      globalThis._envLogged = true;
    }

    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error(`[${requestId}] ❌ Missing authorization header`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is authenticated
    const supabaseUrl = getEnv('SUPABASE_URL', true)!;
    const supabaseKey = getEnv('SUPABASE_ANON_KEY', true)!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error(`[${requestId}] ❌ Authentication failed:`, authError?.message || 'Unknown error');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[${requestId}] ✓ User authenticated: ${user.id}`);

    // Rate limiting check
    const userId = user.id;
    const now = Date.now();
    const userRequests = requestCounts.get(userId);

    if (userRequests) {
      if (now < userRequests.resetTime) {
        if (userRequests.count >= RATE_LIMIT) {
          const resetIn = Math.ceil((userRequests.resetTime - now) / 1000 / 60);
          console.warn(`[${requestId}] ⚠️ Rate limit exceeded for user ${userId} (${userRequests.count}/${RATE_LIMIT}). Resets in ${resetIn}min`);
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded. Please try again later.',
              resetIn: `${resetIn} minutes`
            }), 
            { 
              status: 429, 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': RATE_LIMIT.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': userRequests.resetTime.toString()
              } 
            }
          );
        }
        userRequests.count++;
      } else {
        // Reset the counter
        userRequests.count = 1;
        userRequests.resetTime = now + RATE_WINDOW;
        console.log(`[${requestId}] 🔄 Rate limit reset for user ${userId}`);
      }
    } else {
      requestCounts.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
      console.log(`[${requestId}] 📝 New rate limit tracker for user ${userId}`);
    }

    // Get Google Maps API key from Supabase Secrets (with alias resolution)
    const googleMapsApiKey = getEnv('GOOGLE_MAPS_API_KEY');
    
    if (!googleMapsApiKey) {
      console.error(`[${requestId}] ❌ Google Maps API key not configured in Supabase Secrets`);
      console.error(`[${requestId}] 💡 Add secret: GOOGLE_MAPS_API_KEY in Supabase Dashboard → Settings → Edge Functions`);
      return new Response(
        JSON.stringify({ error: 'Maps configuration not available' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const elapsed = Date.now() - startTime;
    const requestCount = userRequests?.count || 1;
    const remaining = RATE_LIMIT - requestCount;
    
    console.log(`[${requestId}] ✅ Maps config returned to user ${userId}`);
    console.log(`[${requestId}] 📊 Rate limit: ${requestCount}/${RATE_LIMIT} (${remaining} remaining)`);
    console.log(`[${requestId}] ⏱️ Request completed in ${elapsed}ms`);

    return new Response(
      JSON.stringify({ 
        apiKey: googleMapsApiKey,
        libraries: ['places']
      }), 
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': (userRequests?.resetTime || (now + RATE_WINDOW)).toString()
        } 
      }
    );

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[${requestId}] ❌ Error in get-maps-config function:`, error);
    console.error(`[${requestId}] ⏱️ Failed after ${elapsed}ms`);
    
    // Log stack trace for debugging
    if (error instanceof Error && error.stack) {
      console.error(`[${requestId}] Stack trace:`, error.stack);
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        requestId // Include request ID for debugging
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
