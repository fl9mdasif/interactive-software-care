import type { TCurrency } from "@/types";

const TIMEZONE = "Asia/Dhaka";

/** Taka uses lakh grouping (1,23,456); dollars use thousands. */
export const money = (value: number, currency: TCurrency = "BDT") => {
  const digits = Number.isInteger(value) ? 0 : 2;
  const text = Math.abs(value).toLocaleString(currency === "BDT" ? "en-IN" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: 2,
  });
  return `${value < 0 ? "-" : ""}${currency === "BDT" ? "৳" : "$"}${text}`;
};

export const compactMoney = (value: number) =>
  value >= 1e7 ? `৳${+(value / 1e7).toFixed(1)}Cr`
  : value >= 1e5 ? `৳${+(value / 1e5).toFixed(1)}L`
  : value >= 1e3 ? `৳${+(value / 1e3).toFixed(1)}k`
  : `৳${value}`;

export const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: TIMEZONE })
    : "—";

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: TIMEZONE,
  });

export const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TIMEZONE });

/** YYYY-MM-DD in Bangladesh time, for date inputs and API ranges. */
export const toDay = (value: string | Date = new Date()) =>
  new Date(value).toLocaleDateString("en-CA", { timeZone: TIMEZONE });

const SPECIAL: Record<string, string> = {
  bkash: "bKash", nagad: "Nagad", paypal: "PayPal", ai: "AI", saas: "SaaS",
  superAdmin: "Super Admin", published: "Live", whatsapp: "WhatsApp", once: "one-time",
};

export const label = (value: string) =>
  SPECIAL[value] ?? value.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
