import { ENV } from "./_core/env";

interface CaptionSuggestion {
  caption: string;
  hashtags: string[];
}

/**
 * Generate AI caption and hashtag suggestions using LLM
 */
export async function generateCaptionSuggestions(
  mediaType: "photo" | "video",
  userContext?: string
): Promise<CaptionSuggestion> {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    throw new Error("LLM service not configured");
  }

  try {
    const baseUrl = ENV.forgeApiUrl.endsWith("/")
      ? ENV.forgeApiUrl
      : `${ENV.forgeApiUrl}/`;

    const fullUrl = new URL(
      "llm.v1.LLMService/GenerateText",
      baseUrl
    ).toString();

    const prompt = `You are a social media expert. Generate a catchy, engaging caption for a ${mediaType} post on a TikTok-like platform. 
${userContext ? `User context: ${userContext}` : ""}

Requirements:
- Caption should be 1-2 sentences, engaging and trendy
- Include 5-7 relevant hashtags
- Make it viral-worthy and authentic

Respond in JSON format:
{
  "caption": "your caption here",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "connect-protocol-version": "1",
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        prompt,
        model: "MODEL_GPT_4O_MINI",
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `LLM request failed (${response.status})${detail ? `: ${detail}` : ""}`
      );
    }

    const result = (await response.json()) as {
      text?: string;
    };

    if (!result.text) {
      throw new Error("Empty response from LLM");
    }

    // Parse the JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from LLM response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      caption: parsed.caption || "",
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
    };
  } catch (error) {
    console.error("[AI Captions] Generation failed:", error);
    // Return fallback suggestions
    return {
      caption: `Check out this amazing ${mediaType}! 🎬✨`,
      hashtags: ["foryoupage", "viral", "trending", "javan", "creator"],
    };
  }
}

/**
 * Generate multiple caption variations
 */
export async function generateCaptionVariations(
  mediaType: "photo" | "video",
  count: number = 3
): Promise<CaptionSuggestion[]> {
  const variations: CaptionSuggestion[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const suggestion = await generateCaptionSuggestions(mediaType);
      variations.push(suggestion);
    } catch (error) {
      console.error(`Failed to generate variation ${i + 1}:`, error);
    }
  }

  return variations.length > 0
    ? variations
    : [
        {
          caption: `Check out this amazing ${mediaType}! 🎬✨`,
          hashtags: ["foryoupage", "viral", "trending", "javan"],
        },
      ];
}
