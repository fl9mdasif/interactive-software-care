import type {
  TProductPublishStatus, TProjectStatus, TOrderPriority, TOrderSource, TOrderStatus, TOrderType, TPaymentMethod, TPaymentStatus,
} from "@/types";

export const PROJECT_STATUSES: TProjectStatus[] = ["in_progress", "delivered", "live", "under_maintenance", "retired"];
/** "published" is the stored value for a live product. */
export const PRODUCT_STATUSES: TProductPublishStatus[] = [
  "draft", "coming_soon", "published", "under_maintenance", "discontinued",
];

export const ORDER_STATUSES: TOrderStatus[] = [
  "pending", "confirmed", "in_progress", "review", "delivered", "completed", "on_hold", "cancelled",
];
/** The normal path of an order; on_hold and cancelled sit outside it. */
export const ORDER_FLOW: TOrderStatus[] = ["pending", "confirmed", "in_progress", "review", "delivered", "completed"];
export const ORDER_TYPES: TOrderType[] = ["project", "product", "maintenance", "other"];
export const ORDER_SOURCES: TOrderSource[] = [
  "website", "facebook", "whatsapp", "referral", "marketplace", "direct", "other",
];
export const ORDER_PRIORITIES: TOrderPriority[] = ["low", "normal", "high", "urgent"];
export const PAYMENT_STATUSES: TPaymentStatus[] = ["unpaid", "partial", "paid"];
export const PAYMENT_METHODS: TPaymentMethod[] = [
  "bkash", "nagad", "bank", "cash", "card", "paypal", "payoneer", "wise", "other",
];
