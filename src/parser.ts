import axios from 'axios';
import type { PostInput, PredictionOutput, TargetPrice, PercentageChange, Range, Ranking, ExtractedValue, TargetType, Timeframe } from './types.js';

// The entire parsing logic is now handled by an LLM.
// The class structure is kept for compatibility with server.ts.
export class CryptoPredictionParser {
  private readonly openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly apiKey = process.env.OPENROUTER_API_KEY;

  // This is the master prompt that instructs the LLM on how to behave.
  // It includes all the type definitions to ensure the output is structured correctly.
  private readonly systemPrompt = `
    You are an expert financial analyst specializing in parsing cryptocurrency social media posts.
    Your task is to analyze a given post and extract a prediction into a structured JSON format.
    The JSON output MUST conform to the following TypeScript interfaces:

    // --- TYPE DEFINITIONS ---
    export interface TargetPrice {
      asset: string; // Ticker: BTC, ETH, SOL, etc.
      price: number;
      currency: string; // USD, BRL, EUR
    }
    export interface PercentageChange {
      asset: string;
      percentage: number; // e.g., 20 for +20%, -15 for -15%
      currency: string;
    }
    export interface Range {
      asset: string;
      min: number;
      max: number;
      currency: string;
    }
    export interface Ranking {
      asset: string;
      ranking: number; // e.g., 5 for "top 5"
      currency: string;
    }
    export type ExtractedValue = TargetPrice | PercentageChange | Range | Ranking | null;
    export type TargetType = 'target_price' | 'pct_change' | 'range' | 'ranking' | 'none';
    export interface Timeframe {
      explicit: boolean; // true if a timeframe is clearly mentioned (e.g., "by EOY", "next month")
      start: string | null; // ISO 8601 format
      end: string | null;   // ISO 8601 format
    }
    export interface PredictionOutput {
      post_text: string;
      target_type: TargetType;
      extracted_value: ExtractedValue;
      bear_bull: number; // Sentiment score from -100 (very bearish) to 100 (very bullish)
      timeframe: Timeframe;
      notes: string[];
    }
    // --- END OF TYPE DEFINITIONS ---

    // --- RULES ---
    1.  Analyze the post_text provided by the user.
    2.  'post_created_at' is the reference date for timeframes like "next month". Current date is ${new Date().toISOString()}.
    3.  Determine the 'target_type'. If no specific, quantifiable prediction is made, it must be 'none'.
    4.  Based on the 'target_type', populate 'extracted_value'. If 'target_type' is 'none', 'extracted_value' must be null.
    5.  'currency' should be inferred (USD, BRL, EUR), default to 'USD' if unclear.
    6.  'bear_bull' sentiment must be between -100 and 100.
    7.  'timeframe.explicit' is true only if the post contains words like "by", "in", "within", "next", "eoy", "q4", etc.
    8.  'timeframe.start' and 'timeframe.end' must be full ISO 8601 date-time strings (YYYY-MM-DDTHH:mm:ssZ) or null.
    9.  Add any important observations to the 'notes' array (e.g., "This is a retweet", "The prediction is vague").
    10. Your final output MUST be ONLY the JSON object, without any surrounding text, explanations, or markdown code blocks.
  `;

  public async parsePrediction(input: PostInput): Promise<PredictionOutput> {
    if (!this.apiKey) {
      console.error("OpenRouter API key is not configured. Please set OPENROUTER_API_KEY environment variable.");
      return this.createErrorOutput(input.post_text, "Server configuration error: API key not found.");
    }

    try {
      const response = await axios.post(
        this.openRouterUrl,
        {
          model: 'mistralai/mistral-7b-instruct:free', // A good, free model for starting
          messages: [
            { role: 'system', content: this.systemPrompt },
            {
              role: 'user',
              content: `Here is the post data. Analyze it and provide the JSON output.
                - post_text: "${input.post_text}"
                - post_created_at: "${input.post_created_at}"`
            },
          ],
          response_format: { type: "json_object" }, // Request JSON output
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const parsedJson = JSON.parse(content);
      
      // Ensure the post_text from the original input is preserved
      parsedJson.post_text = input.post_text;

      return parsedJson as PredictionOutput;

    } catch (error) {
      console.error("Error calling OpenRouter API or parsing response:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return this.createErrorOutput(input.post_text, `LLM parsing failed: ${errorMessage}`);
    }
  }

  private createErrorOutput(postText: string, note: string): PredictionOutput {
    return {
      post_text: postText,
      target_type: 'none',
      extracted_value: null,
      bear_bull: 0,
      timeframe: {
        explicit: false,
        start: null,
        end: null,
      },
      notes: [note],
    };
  }
}