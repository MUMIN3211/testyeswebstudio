export function formatMoney(value: string | number) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value || "0");
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(Number.isNaN(parsed) ? 0 : parsed);
}
