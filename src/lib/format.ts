export function formatMoney(value: number | string | null | undefined, currency = "NPR") {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function progressPercent(raised: number | string | null | undefined, goal: number | string | null | undefined) {
  const raisedAmount = Number(raised ?? 0);
  const goalAmount = Number(goal ?? 0);

  if (!Number.isFinite(raisedAmount) || !Number.isFinite(goalAmount) || goalAmount <= 0) {
    return 0;
  }

  return Math.min(Math.round((raisedAmount / goalAmount) * 100), 100);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Not published";

  return new Intl.DateTimeFormat("en-NP", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
