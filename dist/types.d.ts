export interface TargetPrice {
    asset: string;
    price: number;
    currency: string;
    price_original?: string | undefined;
}
export interface PercentageChange {
    asset: string;
    percentage: number;
    currency: string;
}
export interface Range {
    asset: string;
    min: number;
    max: number;
    currency: string;
    min_original?: string | undefined;
    max_original?: string | undefined;
}
export interface Ranking {
    asset: string;
    ranking: number;
    currency: string;
}
export type ExtractedValue = TargetPrice | PercentageChange | Range | Ranking | null;
export type TargetType = 'target_price' | 'pct_change' | 'range' | 'ranking' | 'none';
export interface Timeframe {
    explicit: boolean;
    start: string | null;
    end: string | null;
}
export interface PredictionOutput {
    post_text: string;
    target_type: TargetType;
    extracted_value?: ExtractedValue;
    bear_bull: number;
    timeframe: Timeframe;
    notes: string[];
}
export interface PostInput {
    post_text: string;
    post_created_at: string;
}
//# sourceMappingURL=types.d.ts.map