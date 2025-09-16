import type { PostInput, PredictionOutput } from '../src/types.js';

export const testCases: Array<{
  input: PostInput;
  expected: Partial<PredictionOutput>;
  description: string;
}> = [
  // Target Price Cases
  {
    description: "Simple target price with emoji",
    input: {
      post_text: "BTC breaking $80,000 before end of year! 🚀",
      post_created_at: "2025-08-25T12:00:00Z"
    },
    expected: {
      target_type: "target_price",
      extracted_value: { asset: "BTC", price: 80000, currency: "USD" },
      bear_bull: 75, // High bullish due to rocket emoji + breaking language
      timeframe: { explicit: true, start: "2025-08-25T12:00:00Z", end: "2025-12-31T23:59:59Z" }
    }
  },

  // Percentage Change Cases
  {
    description: "Negative percentage change with retweet",
    input: {
      post_text: "RT @sol_predictions: SOL down 40% from here, bear market incoming 📉",
      post_created_at: "2025-08-25T12:00:00Z"
    },
    expected: {
      target_type: "pct_change",
      extracted_value: { asset: "SOL", percentage: -40, currency: "USD" },
      bear_bull: -70, // Strong bearish
      timeframe: { explicit: false, start: null, end: null }
    }
  },

  // Range Cases
  {
    description: "Price range with explicit timeframe",
    input: {
      post_text: "ETH consolidating between $3,200-$3,800 next month. Chart analysis attached 📊",
      post_created_at: "2025-08-25T12:00:00Z"
    },
    expected: {
      target_type: "range",
      extracted_value: { asset: "ETH", min: 3200, max: 3800, currency: "USD" },
      bear_bull: 15, // Slightly bullish consolidation
      timeframe: { explicit: true, start: "2025-08-25T12:00:00Z", end: "2025-09-25T23:59:59Z" }
    }
  },

  // Ranking Cases
  {
    description: "Market cap ranking prediction",
    input: {
      post_text: "Disagree with this take. PEPE will crack top 10 by market cap this cycle, not crash 🐸💎",
      post_created_at: "2025-08-25T12:00:00Z"
    },
    expected: {
      target_type: "ranking",
      extracted_value: { asset: "PEPE", ranking: 10, currency: "USD" },
      bear_bull: 65, // Strong bullish due to diamond hands
      timeframe: { explicit: false, start: null, end: null }
    }
  },

  // None Cases
  {
    description: "No measurable prediction",
    input: {
      post_text: "RT @market_news: Crypto market volatility hits new highs this week. This is exactly why I don't make predictions anymore 🤷‍♂️",
      post_created_at: "2025-08-25T12:00:00Z"
    },
    expected: {
      target_type: "none",
      bear_bull: -20, // Slight negative due to anti-prediction stance
      timeframe: { explicit: false, start: null, end: null }
    }
  },

  // Edge Cases
  {
    description: "Sarcastic prediction",
    input: {
      post_text: "Yeah right, BTC to $100k by Christmas 🙄 Sure buddy",
      post_created_at: "2025-08-25T12:00:00Z"
    },
    expected: {
      target_type: "target_price",
      extracted_value: { asset: "BTC", price: 100000, currency: "USD" },
      bear_bull: -30, // Should detect sarcasm and invert sentiment
      timeframe: { explicit: true, start: "2025-08-25T12:00:00Z", end: "2025-12-25T23:59:59Z" }
    }
  },

  {
    description: "K notation price",
    input: {
      post_text: "BTC 50k is the new floor. Diamond hands! 💎",
      post_created_at: "2025-08-25T12:00:00Z"
    },
    expected: {
      target_type: "target_price",
      extracted_value: { asset: "BTC", price: 50000, currency: "USD" },
      bear_bull: 60,
      timeframe: { explicit: false, start: null, end: null }
    }
  },

  {
    description: "BRL currency detection",
    input: {
      post_text: "BTC vai a R$ 500.000 até o fim do ano! 🇧🇷🚀",
      post_created_at: "2025-08-25T12:00:00Z"
    },
    expected: {
      target_type: "target_price",
      extracted_value: { asset: "BTC", price: 500000, currency: "BRL" },
      bear_bull: 70,
      timeframe: { explicit: true, start: "2025-08-25T12:00:00Z", end: "2025-12-31T23:59:59Z" }
    }
  }
];
