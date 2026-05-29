import type { ProjectInfo } from "./boqPdf";

export const CURRENCIES = [
  { code: "USD", label: "US Dollar (USD)", locale: "en-US", symbol: "$" },
  { code: "INR", label: "Indian Rupee (INR)", locale: "en-IN", symbol: "₹" },
  { code: "EUR", label: "Euro (EUR)", locale: "de-DE", symbol: "€" },
  { code: "GBP", label: "British Pound (GBP)", locale: "en-GB", symbol: "£" },
  { code: "AED", label: "UAE Dirham (AED)", locale: "en-AE", symbol: "AED" },
  { code: "SGD", label: "Singapore Dollar (SGD)", locale: "en-SG", symbol: "S$" },
  { code: "AUD", label: "Australian Dollar (AUD)", locale: "en-AU", symbol: "A$" },
  { code: "CAD", label: "Canadian Dollar (CAD)", locale: "en-CA", symbol: "C$" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const TAX_PRESETS = [
  { id: "gst-18", label: "GST 18% (India)", taxLabel: "GST", taxRate: 18 },
  { id: "gst-5", label: "GST 5%", taxLabel: "GST", taxRate: 5 },
  { id: "vat-20", label: "VAT 20%", taxLabel: "VAT", taxRate: 20 },
  { id: "vat-5-uae", label: "VAT 5% (UAE)", taxLabel: "VAT", taxRate: 5 },
  { id: "sales-10", label: "Sales tax 10%", taxLabel: "Sales tax", taxRate: 10 },
  { id: "none", label: "No tax (0%)", taxLabel: "Tax", taxRate: 0 },
] as const;

/** Suggested FX from USD catalogue list prices → quote currency */
export const DEFAULT_FX_FROM_USD: Record<CurrencyCode, number> = {
  USD: 1,
  INR: 83,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  SGD: 1.34,
  AUD: 1.53,
  CAD: 1.36,
};

export type QuoteSettings = {
  currency: CurrencyCode;
  fxRate: number;
  taxRate: number;
  taxLabel: string;
};

export function normalizeQuoteSettings(project: ProjectInfo): QuoteSettings {
  const currency = CURRENCIES.some((c) => c.code === project.currency)
    ? (project.currency as CurrencyCode)
    : "USD";
  const fxRate =
    typeof project.fxRate === "number" && project.fxRate > 0 ? project.fxRate : 1;
  const taxRate =
    typeof project.taxRate === "number" && project.taxRate >= 0 && project.taxRate <= 100
      ? project.taxRate
      : 18;
  const taxLabel = (project.taxLabel || "GST").trim() || "Tax";
  return { currency, fxRate, taxRate, taxLabel };
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  const meta = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  const fraction = currency === "INR" ? 0 : 0;
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency: meta.code,
      maximumFractionDigits: fraction,
      minimumFractionDigits: fraction,
    }).format(amount);
  } catch {
    return `${meta.symbol}${Math.round(amount).toLocaleString()}`;
  }
}

export function taxLineLabel(taxLabel: string, taxRate: number): string {
  if (taxRate <= 0) return `${taxLabel} (0%)`;
  return `${taxLabel} @ ${taxRate}%`;
}

export function totalInclTaxLabel(taxLabel: string, taxRate: number): string {
  if (taxRate <= 0) return "Grand total";
  return `Grand total (incl. ${taxLabel})`;
}

export function computeTaxTotals(grandTotalUsd: number, settings: QuoteSettings) {
  const subtotal = grandTotalUsd * settings.fxRate;
  const tax = subtotal * (settings.taxRate / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

export function convertUsdToQuote(amountUsd: number, fxRate: number): number {
  return amountUsd * fxRate;
}
