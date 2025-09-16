// --- Concrete Implementations ---
class AssetExtractor {
    CRYPTO_TICKERS = new Set([
        'BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'AVAX', 'PEPE', 'SHIB', 'DOT', 'LINK',
        'MATIC', 'UNI', 'LTC', 'BCH', 'XRP', 'BNB', 'ATOM', 'NEAR', 'FTM', 'ALGO'
    ]);
    NAME_MAP = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH',
        'solana': 'SOL',
        'dogecoin': 'DOGE',
        'cardano': 'ADA',
        'avalanche': 'AVAX'
    };
    extract(text) {
        const upperText = text.toUpperCase();
        for (const ticker of this.CRYPTO_TICKERS) {
            const regex = new RegExp(`\\b${ticker}\\b`, 'i');
            if (regex.test(text)) {
                return ticker;
            }
        }
        for (const [name, ticker] of Object.entries(this.NAME_MAP)) {
            if (upperText.includes(name.toUpperCase())) {
                return ticker;
            }
        }
        return null;
    }
}
class PredictionTypeClassifier {
    classify(text) {
        const lowerText = text.toLowerCase();
        // Priority: pct_change -> range -> ranking -> target_price
        const hasPctChange = /(up|down|rise|fall|increase|decrease)\s+\d+\%/i.test(lowerText);
        if (hasPctChange)
            return 'pct_change';
        const hasRange = /(between|consolidating between|range|from)\s*\$?(\d+(?:,\d{3})*)\s*k?\s*(?:-|–|—|to|and)\s*\$?(\d+(?:,\d{3})*)\s*k?/i.test(lowerText);
        if (hasRange)
            return 'range';
        const hasRanking = /top\s+\d+/i.test(lowerText);
        if (hasRanking)
            return 'ranking';
        const hasTargetPrice = /(\$|R\$|€|USD|BRL|EUR)?\s*\d+(?:,\d{3})*(?:\.\d{2})?\s*k?/i.test(lowerText);
        if (hasTargetPrice)
            return 'target_price';
        return 'none';
    }
}
class NumericExtractor {
    extract(text, type) {
        const asset = new AssetExtractor().extract(text);
        if (!asset)
            return null;
        const currency = this.extractCurrency(text) || 'USD';
        switch (type) {
            case 'target_price':
                return this.extractTargetPrice(text, asset, currency);
            case 'pct_change':
                return this.extractPercentageChange(text, asset, currency);
            case 'range':
                return this.extractRange(text, asset, currency);
            case 'ranking':
                return this.extractRanking(text, asset, currency);
            default:
                return null;
        }
    }
    extractCurrency(text) {
        if (text.includes('$') || text.toUpperCase().includes('USD'))
            return 'USD';
        if (text.toUpperCase().includes('BRL') || text.includes('R$'))
            return 'BRL';
        if (text.toUpperCase().includes('EUR') || text.includes('€'))
            return 'EUR';
        return null;
    }
    extractTargetPrice(text, asset, currency) {
        const priceMatch = text.match(/(\$|R\$|USD)?\s*(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(k)?/i);
        if (priceMatch && priceMatch[2]) {
            let price = parseFloat(priceMatch[2].replace(/\./g, '').replace(',', '.'));
            if ((priceMatch[3] || text.toLowerCase().includes('k')) && price < 1000) {
                price *= 1000;
            }
            return { asset, price, currency, price_original: priceMatch[0].trim() };
        }
        return null;
    }
    extractPercentageChange(text, asset, currency) {
        const pctMatch = text.match(/(up|down|rise|fall|increase|decrease)\s+(\d+)%/i);
        if (pctMatch) {
            let percentage = parseInt(pctMatch[2] ?? '0', 10);
            if (pctMatch[1] && ['down', 'fall', 'decrease'].includes(pctMatch[1].toLowerCase())) {
                percentage = -percentage;
            }
            return { asset, percentage, currency };
        }
        return null;
    }
    extractRange(text, asset, currency) {
        const rangeMatch = text.match(/(between|consolidating between|range|from)\s*\$?(\d+(?:,\d{3})*)\s*k?\s*(?:-|–|—|to|and)\s*\$?(\d+(?:,\d{3})*)\s*k?/i);
        if (rangeMatch && rangeMatch[2] && rangeMatch[3]) {
            let min = parseFloat(rangeMatch[2].replace(/,/g, ''));
            let max = parseFloat(rangeMatch[3].replace(/,/g, ''));
            if (text.toLowerCase().includes('k')) {
                if (min < 1000)
                    min *= 1000;
                if (max < 1000)
                    max *= 1000;
            }
            return { asset, min, max, currency, min_original: rangeMatch[2], max_original: rangeMatch[3] };
        }
        return null;
    }
    extractRanking(text, asset, currency) {
        const rankMatch = text.match(/top\s+(\d+)/i);
        if (rankMatch) {
            const ranking = parseInt(rankMatch[1] ?? '0', 10);
            return { asset, ranking, currency };
        }
        return null;
    }
}
class TimeframeNormalizer {
    normalize(text, createdAt, notes) {
        const lowerText = text.toLowerCase();
        const postDate = new Date(createdAt);
        let explicit = false;
        let start = null;
        let end = null;
        const iso = (date) => date.toISOString().replace(/T.*/, 'T23:59:59Z');
        if (lowerText.includes('end of year') || lowerText.includes('eoy')) {
            explicit = true;
            start = createdAt;
            end = `${postDate.getFullYear()}-12-31T23:59:59Z`;
            notes.push('End of year converted to December 31st');
        }
        else if (lowerText.includes('next month')) {
            explicit = true;
            start = createdAt;
            const nextMonth = new Date(postDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            end = iso(nextMonth);
            notes.push('Next month calculated from post date');
        }
        else if (/within (\d+) months?/.test(lowerText)) {
            const match = lowerText.match(/within (\d+) months?/);
            if (match) {
                explicit = true;
                start = createdAt;
                const months = parseInt(match[1] ?? '0', 10);
                const future = new Date(postDate);
                future.setMonth(future.getMonth() + months);
                end = iso(future);
                notes.push(`Timeframe 'within ${months} months' normalized to ${end}`);
            }
        }
        else if (lowerText.includes('by christmas')) {
            explicit = true;
            start = createdAt;
            end = `${postDate.getFullYear()}-12-25T23:59:59Z`;
            notes.push('Christmas converted to December 25th');
        }
        else if (lowerText.includes('até o fim do ano')) {
            explicit = true;
            start = createdAt;
            end = `${postDate.getFullYear()}-12-31T23:59:59Z`;
            notes.push('End of year converted to December 31st');
        }
        if (!explicit) {
            notes.push('No specific timeframe mentioned');
        }
        return { explicit, start, end };
    }
}
class SentimentAnalyzer {
    BULLISH_KEYWORDS = ['moon', 'rocket', 'pump', 'bull', 'bullish', 'up', 'rise', 'surge', 'breakout', 'ath', 'all-time high', 'lambo', 'diamond hands', 'hodl', 'buy', 'accumulate'];
    BEARISH_KEYWORDS = ['crash', 'dump', 'bear', 'bearish', 'down', 'fall', 'drop', 'collapse', 'bottom', 'capitulation', 'sell', 'short', 'dead cat bounce'];
    BULLISH_EMOJIS = ['🚀', '🌙', '💎', '📈', '💚', '🟢', '⬆️', '🔥'];
    BEARISH_EMOJIS = ['📉', '💀', '🔴', '⬇️', '🩸', '💔', '😱'];
    analyze(text, targetType, extractedValue) {
        let sentiment = 0;
        const lowerText = text.toLowerCase();
        const bullishCount = this.BULLISH_KEYWORDS.filter(word => lowerText.includes(word)).length;
        const bearishCount = this.BEARISH_KEYWORDS.filter(word => lowerText.includes(word)).length;
        sentiment += bullishCount * 20;
        sentiment -= bearishCount * 20;
        for (const emoji of this.BULLISH_EMOJIS) {
            if (text.includes(emoji))
                sentiment += 20;
        }
        for (const emoji of this.BEARISH_EMOJIS) {
            if (text.includes(emoji))
                sentiment -= 20;
        }
        if (targetType === 'pct_change' && extractedValue && 'percentage' in extractedValue) {
            const pctValue = extractedValue.percentage;
            if (Math.abs(pctValue) >= 30) {
                sentiment += Math.sign(pctValue) * 30;
            }
            else {
                sentiment += Math.sign(pctValue) * 15;
            }
        }
        return Math.max(-100, Math.min(100, Math.round(sentiment)));
    }
}
// --- Main Parser ---
class CryptoPredictionParser {
    assetExtractor;
    predictionTypeClassifier;
    numericExtractor;
    timeframeNormalizer;
    sentimentAnalyzer;
    constructor() {
        this.assetExtractor = new AssetExtractor();
        this.predictionTypeClassifier = new PredictionTypeClassifier();
        this.numericExtractor = new NumericExtractor();
        this.timeframeNormalizer = new TimeframeNormalizer();
        this.sentimentAnalyzer = new SentimentAnalyzer();
    }
    parsePrediction(input) {
        const notes = [];
        const text = input.post_text;
        this.handleRetweetAndQuote(text, notes);
        const asset = this.assetExtractor.extract(text);
        const targetType = asset ? this.predictionTypeClassifier.classify(text) : 'none';
        const extractedValue = this.numericExtractor.extract(text, targetType);
        const timeframe = this.timeframeNormalizer.normalize(text, input.post_created_at, notes);
        const bearBull = this.sentimentAnalyzer.analyze(text, targetType, extractedValue);
        if (asset && targetType === 'none' && !extractedValue) {
            notes.push('No measurable prediction made');
        }
        return {
            post_text: text,
            target_type: targetType,
            extracted_value: extractedValue,
            bear_bull: bearBull,
            timeframe,
            notes,
        };
    }
    handleRetweetAndQuote(text, notes) {
        const isRetweet = text.startsWith('RT @') || text.includes('RT @');
        const isQuote = text.includes('"') || text.toLowerCase().includes('disagree');
        if (isRetweet) {
            const match = text.match(/RT @(\w+):/);
            if (match) {
                notes.push(`Retweet - original prediction by @${match[1]}`);
            }
        }
        if (isQuote) {
            notes.push('Quote tweet - prediction attributed to original author');
        }
    }
}
export { CryptoPredictionParser };
//# sourceMappingURL=parser.js.map