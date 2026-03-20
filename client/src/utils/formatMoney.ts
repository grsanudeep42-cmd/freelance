import type { MoneyAmount } from "../types";

export function formatMoney(value: MoneyAmount): string {
  // Minor units (e.g. cents) -> major units.
  const major = value.amount / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: value.currency
  }).format(major);
}

