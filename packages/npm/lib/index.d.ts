export interface LineItem { key: string; label: string; share: number }
export interface Preset { label: string; construction: number; permit: number }
export interface Options {
  /** Sales tax as a fraction (0.103 = 10.3%). */
  taxRate?: number;
  /** Contingency reserve as a fraction. */
  contingencyRate?: number;
  /** Permit allowance in dollars. */
  permit?: number;
  /** Share overrides by line item key; merged with defaults and normalised. */
  shares?: Record<string, number>;
}
export interface Line { key: string; label: string; share: number; amount: number }
export interface Breakdown {
  mode: 'split' | 'estimate';
  lines: Line[];
  construction: number;
  contingency: number;
  tax: number;
  permit: number;
  total: number;
  taxRate: number;
  contingencyRate: number;
  preset?: string;
  label?: string;
}
export const LINE_ITEMS: readonly LineItem[];
export const PRESETS: Readonly<Record<'minor-midrange' | 'major-midrange' | 'major-upscale', Preset>>;
export const DEFAULT_TAX_RATE: number;
export const DEFAULT_CONTINGENCY_RATE: number;
export const PRESET_SOURCE: string;
export const SHARE_SOURCE: string;
export function estimate(construction: number, opts?: Options): Breakdown;
export function splitBudget(total: number, opts?: Options): Breakdown;
export function estimatePreset(name: string, opts?: Options): Breakdown;
export function normaliseShares(overrides?: Record<string, number>): LineItem[];
export function formatTable(r: Breakdown): string;
export function money(v: number): string;
