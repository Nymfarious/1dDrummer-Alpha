import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Dropbox proxy function called');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DROPBOX_ACCESS_TOKEN = Deno.env.get('DROPBOX_DEV_TOKEN');
    
    console.log('Checking Dropbox token:', DROPBOX_ACCESS_TOKEN ? 'Token exists' : 'Token missing');
    
    if (!DROPBOX_ACCESS_TOKEN) {
      console.error('DROPBOX_DEV_TOKEN environment variable is not set');
      return new Response(
        JSON.stringify({ 
          error: 'Dropbox integration not configured. Please add DROPBOX_DEV_TOKEN secret in Supabase.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, path, fileData, fileName } = await req.json();

    console.log(`Dropbox action: ${action}, path: ${path}`);

    switch (action) {
      case 'upload': {
        const fileBytes = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));
        const uploadPath = `/Apps/dDrummer/${path || 'uploads'}/${fileName}`;
        
        const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({
              path: uploadPath,
              mode: 'add',
              autorename: true,
              mute: false,
            })
          },
          body: fileBytes
        });

        if (!res.ok) {
          const error = await res.text();
          console.error('Dropbox upload error:', error);
          throw new Error(`Upload failed: ${res.status}`);
        }

        const result = await res.json();
        console.log('Upload successful:', result);
        
        return new Response(JSON.stringify({ success: true, result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list': {
        const listPath = path || '/Apps/dDrummer';
        const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ path: listPath, recursive: false })
        });

        if (!res.ok) {
          const error = await res.text();
          console.error('Dropbox list error:', error);
          throw new Error(`List failed: ${res.status}`);
        }

        const data = await res.json();
        return new Response(JSON.stringify({ success: true, entries: data.entries }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'download': {
        const res = await fetch('https://content.dropboxapi.com/2/files/download', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
            'Dropbox-API-Arg': JSON.stringify({ path })
          }
        });

        if (!res.ok) {
          throw new Error(`Download failed: ${res.status}`);
        }

        const arrayBuffer = await res.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        return new Response(JSON.stringify({ success: true, fileData: base64 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'getTempLink': {
        const res = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ path })
        });

        if (!res.ok) {
          throw new Error(`Get temp link failed: ${res.status}`);
        }

        const json = await res.json();
        return new Response(JSON.stringify({ success: true, link: json.link }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const res = await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ path })
        });

        if (!res.ok) {
          throw new Error(`Delete failed: ${res.status}`);
        }

        const result = await res.json();
        return new Response(JSON.stringify({ success: true, result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Dropbox proxy error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
