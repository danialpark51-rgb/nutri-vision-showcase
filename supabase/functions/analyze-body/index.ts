import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert fitness and body composition analyst. Analyze the body photo provided and estimate the following metrics. Be realistic and provide ranges where uncertain. Return ONLY valid JSON with this exact structure:
{
  "body_fat_percentage": { "estimate": number, "range": [number, number], "category": "string" },
  "bmi_estimate": { "estimate": number, "category": "string" },
  "muscle_mass": "low" | "moderate" | "high" | "very high",
  "body_type": "ectomorph" | "mesomorph" | "endomorph" | "combination",
  "fitness_level": "beginner" | "intermediate" | "advanced" | "athlete",
  "recommendations": ["string", "string", "string"],
  "calories_maintenance": number,
  "macros_suggestion": { "protein_g": number, "carbs_g": number, "fat_g": number },
  "disclaimer": "string"
}
Categories for body fat: Essential Fat, Athletes, Fitness, Average, Obese.
Categories for BMI: Underweight, Normal, Overweight, Obese.
Always include a disclaimer that these are AI estimates and not medical advice.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this body photo and provide body composition estimates including body fat percentage, BMI estimate, muscle mass assessment, body type, fitness level, calorie maintenance estimate, and macro suggestions."
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_body_analysis",
              description: "Return the body composition analysis results",
              parameters: {
                type: "object",
                properties: {
                  body_fat_percentage: {
                    type: "object",
                    properties: {
                      estimate: { type: "number" },
                      range: { type: "array", items: { type: "number" } },
                      category: { type: "string" }
                    },
                    required: ["estimate", "range", "category"]
                  },
                  bmi_estimate: {
                    type: "object",
                    properties: {
                      estimate: { type: "number" },
                      category: { type: "string" }
                    },
                    required: ["estimate", "category"]
                  },
                  muscle_mass: { type: "string", enum: ["low", "moderate", "high", "very high"] },
                  body_type: { type: "string", enum: ["ectomorph", "mesomorph", "endomorph", "combination"] },
                  fitness_level: { type: "string", enum: ["beginner", "intermediate", "advanced", "athlete"] },
                  recommendations: { type: "array", items: { type: "string" } },
                  calories_maintenance: { type: "number" },
                  macros_suggestion: {
                    type: "object",
                    properties: {
                      protein_g: { type: "number" },
                      carbs_g: { type: "number" },
                      fat_g: { type: "number" }
                    },
                    required: ["protein_g", "carbs_g", "fat_g"]
                  },
                  disclaimer: { type: "string" }
                },
                required: ["body_fat_percentage", "bmi_estimate", "muscle_mass", "body_type", "fitness_level", "recommendations", "calories_maintenance", "macros_suggestion", "disclaimer"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_body_analysis" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    let analysis;
    if (toolCall?.function?.arguments) {
      analysis = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      // Fallback: try parsing content directly
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-body error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
