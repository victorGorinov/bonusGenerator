export const SEGMENTS = ['new', 'mid', 'vip'] as const;
export type Segment = typeof SEGMENTS[number];
export const isSegment = (s: unknown): s is Segment => SEGMENTS.includes(s as Segment);
