# Tricky Cases

This file documents difficult or ambiguous cases encountered during the parsing and evaluation of crypto prediction posts. While the current parser achieves high accuracy on the provided test set, natural language processing for predictions inherently involves complexities that can lead to "tricky cases." These examples highlight scenarios where the parser might still face challenges or where further refinement could be beneficial.

---

## Examples of Potentially Tricky Cases

These cases represent common ambiguities or complexities in natural language that a prediction parser might encounter. Even if the current parser handles them correctly, they illustrate areas where robustness is crucial.

### Case 1: Ambiguous Timeframe (Vague Expressions)

**Input:**
```json
{
  "post_text": "BTC will reach $100k soon",
  "post_created_at": "2025-09-10T12:00:00Z"
}
```
**Explanation:**
The term "soon" is highly subjective and cannot be reliably converted into a precise `start` and `end` timestamp. The parser correctly defaults to `explicit: false` and `start: null`, `end: null`, but handling such vagueness robustly is a constant challenge.

---

### Case 2: Multiple Conflicting Patterns (Ambiguity)

**Input:**
```json
{
  "post_text": "ETH up 30% and consolidating between $3,000-$3,500 next month",
  "post_created_at": "2025-08-01T09:00:00Z"
}
```
**Explanation:**
This post contains elements suggesting both a `pct_change` and a `range` prediction. The parser prioritizes and resolves this by returning `none` due to ambiguity, which is a valid strategy for precision. However, discerning the user's primary intent in such complex sentences remains a challenge.

---

### Case 3: Unrecognized Asset (Out-of-Scope Entities)

**Input:**
```json
{
  "post_text": "Gold will outperform BTC this quarter",
  "post_created_at": "2025-07-01T10:00:00Z"
}
```
**Explanation:**
The asset "Gold" is not a cryptocurrency ticker supported by the parser. The parser correctly identifies "BTC" but ignores "Gold." Ensuring the parser focuses only on relevant assets and gracefully handles irrelevant entities is important.

---

### Case 4: Sarcasm and Negation (Sentiment Nuance)

**Input:**
```json
{
  "post_text": "Yeah right, BTC to $100k by Christmas 🙄 Sure buddy",
  "post_created_at": "2025-08-25T12:00:00Z"
}
```
**Explanation:**
This post expresses a seemingly bullish prediction ("BTC to $100k") but uses sarcastic language and emojis ("🙄") to convey a bearish sentiment. Accurately detecting sarcasm and negations is a significant challenge for sentiment analysis, often requiring more advanced NLP techniques.

---

### Case 5: Implicit Context for Ranking

**Input:**
```json
{
  "post_text": "PEPE top 5 soon",
  "post_created_at": "2025-09-15T15:00:00Z"
}
```
**Explanation:**
The phrase "top 5" implies a ranking, but the context ("by market cap") is implicit. The parser correctly infers `ranking` and assumes "market cap," but relying on implicit context can be fragile.

---

## Possible Next Steps for Improvement

To further enhance the parser's robustness and handle an even wider array of tricky cases, consider the following:

1.  **Advanced Sentiment Analysis:**
    *   Integrate more sophisticated NLP models (e.g., transformer-based models like BERT, RoBERTa) for sentiment detection. These models are better at understanding context, sarcasm, and negation.
    *   Train a custom sentiment model on a larger, domain-specific dataset of crypto social media posts.

2.  **Contextual Ambiguity Resolution:**
    *   Implement a more advanced disambiguation engine that can weigh different prediction patterns based on surrounding keywords, sentence structure, or even external knowledge (e.g., current market conditions).
    *   For cases with multiple assets, explore returning multiple `PredictionOutput` objects, each focusing on a single asset's prediction, if the predictions are clearly separable.

3.  **Expanded Timeframe Normalization:**
    *   Add support for a broader range of vague and relative time expressions (e.g., "next week," "in a few days," "this quarter," "mid-year").
    *   Utilize external libraries or APIs specifically designed for natural language date/time parsing.

4.  **Enhanced Numeric Extraction:**
    *   Improve regex patterns to handle more diverse number formats, including scientific notation, fractions, and numbers written out (e.g., "ten thousand").
    *   Implement error correction for minor typos in numbers.

5.  **Structured Author Attribution:**
    *   For retweets and quotes, extract the original author's handle into a dedicated field within `PredictionOutput` (e.g., `original_author: string | null`) instead of just a note.

6.  **Continuous Learning and Feedback Loop:**
    *   Establish a process for regularly reviewing "tricky cases" identified by the evaluation script.
    *   Use these cases to expand the test suite and iteratively improve the parser's logic and models.
    *   Consider a human-in-the-loop system for labeling ambiguous cases to generate more training data.

---
