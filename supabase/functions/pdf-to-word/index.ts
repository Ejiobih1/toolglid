import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get ConvertAPI secret from environment
    const convertApiSecret = Deno.env.get('CONVERTAPI_SECRET');

    if (!convertApiSecret) {
      throw new Error('ConvertAPI secret not configured. Please set CONVERTAPI_SECRET in Supabase secrets.');
    }

    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client to verify user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user is premium
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('is_premium')
      .eq('id', user.id)
      .single();

    if (dbError || !userData?.is_premium) {
      return new Response(
        JSON.stringify({
          error: 'Premium subscription required. PDF to Word conversion is a premium feature that preserves formatting, images, and tables - just like SmallPDF!'
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the file from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Convert file to base64 for ConvertAPI
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Call ConvertAPI to convert PDF to DOCX
    const convertApiUrl = `https://v2.convertapi.com/convert/pdf/to/docx?Secret=${convertApiSecret}`;

    const convertResponse = await fetch(convertApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Parameters: [
          {
            Name: 'File',
            FileValue: {
              Name: file.name,
              Data: base64,
            },
          },
          {
            Name: 'StoreFile',
            Value: 'true',
          },
        ],
      }),
    });

    if (!convertResponse.ok) {
      const errorText = await convertResponse.text();
      console.error('ConvertAPI error:', errorText);
      throw new Error(`ConvertAPI error: ${errorText}`);
    }

    const convertResult = await convertResponse.json();

    // Log the full response for debugging
    console.log('ConvertAPI response:', JSON.stringify(convertResult, null, 2));

    // Get the converted file URL
    const fileUrl = convertResult.Files?.[0]?.Url;

    if (!fileUrl) {
      console.error('No URL found in ConvertAPI response. Full response:', convertResult);
      throw new Error(`Invalid URL: ${fileUrl === undefined ? 'undefined' : String(fileUrl)}. ConvertAPI response: ${JSON.stringify(convertResult)}`);
    }

    // Download the converted file
    const fileResponse = await fetch(fileUrl);

    if (!fileResponse.ok) {
      throw new Error('Failed to download converted file');
    }

    const docxBlob = await fileResponse.blob();

    // Return the DOCX file
    return new Response(docxBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${file.name.replace('.pdf', '.docx')}"`,
      },
    });

  } catch (error) {
    console.error('PDF to Word conversion error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Conversion failed. Please try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
