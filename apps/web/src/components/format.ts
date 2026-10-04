/** Parse a money/number value from the API (decimals arrive as strings); invalid input becomes 0. */
export function toNumber(value: string | number | null | undefined) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value || "0");
  return Number.isNaN(parsed) ? 0 : parsed;
}

// Intl formatters are expensive to build, so create them once.
const moneyFormat = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 2,
});

export function formatMoney(value: string | number) {
  return moneyFormat.format(toNumber(value));
}

/** The shop operates in Thailand; dates shown or computed on the server must not depend on the host timezone. */
export const SHOP_TIME_ZONE = "Asia/Bangkok";

export function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString("th-TH", { timeZone: SHOP_TIME_ZONE });
}

/** Today's date in the shop's timezone, as YYYY-MM-DD. */
export function shopToday(now: Date = new Date()) {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: SHOP_TIME_ZONE }).format(now);
}

/** Add (or subtract) whole days to a YYYY-MM-DD date. */
export function shiftIsoDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
