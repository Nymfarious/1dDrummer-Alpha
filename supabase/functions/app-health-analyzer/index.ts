import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { codeSnapshot } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert code analyzer for the dDrummer app. Analyze the provided code and return a JSON structure with:
1. A flowchart showing the app architecture
2. Color-coded status for each component using RSG (Red-Stop-Go) system:
   - RED: Not working/broken/missing
   - YELLOW: Partially working/needs attention
   - GREEN: Fully working/complete
   - BLUE: Planned/future feature
   - GRAY: Deprecated/to be removed

Return ONLY valid JSON in this exact format:
{
  "nodes": [
    {
      "id": "string",
      "label": "string",
      "status": "red" | "yellow" | "green" | "blue" | "gray",
      "position": { "x": number, "y": number },
      "type": "frontend" | "backend" | "integration" | "database",
      "issues": ["string"],
      "progress": number (0-100)
    }
  ],
  "edges": [
    {
      "id": "string",
      "source": "string",
      "target": "string"
    }
  ],
  "summary": {
    "totalComponents": number,
    "working": number,
    "partiallyWorking": number,
    "broken": number,
    "planned": number
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Analyze this app structure and provide a comprehensive status report:\n\n${JSON.stringify(codeSnapshot, null, 2)}` 
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // Extract JSON from markdown if present
    let analysisResult;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      analysisResult = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI analysis");
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
