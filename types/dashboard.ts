// Mirrors api/src/app/modules/{order,sales,product,lead}.
export type TOrderStatus =
  | "pending" | "confirmed" | "in_progress" | "review" | "delivered" | "completed" | "on_hold" | "cancelled";
export type TOrderType = "project" | "product" | "maintenance" | "other";
export type TOrderSource = "website" | "facebook" | "whatsapp" | "referral" | "marketplace" | "direct" | "other";
export type TOrderPriority = "low" | "normal" | "high" | "urgent";
export type TCurrency = "BDT" | "USD";
export type TPaymentMethod =
  | "bkash" | "nagad" | "bank" | "cash" | "card" | "paypal" | "payoneer" | "wise" | "other";
export type TPaymentStatus = "unpaid" | "partial" | "paid";

export type TUserRef = { _id: string; username: string };

export interface TCustomer {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  country?: string;
}

export interface TPayment {
  _id: string;
  amount: number;
  exchangeRate: number;
  amountBdt: number;
  method: TPaymentMethod;
  paidAt: string;
  trxId?: string;
  note?: string;
  receivedBy?: TUserRef | null;
  voided: boolean;
  voidReason?: string;
  voidedBy?: TUserRef | null;
}

export interface TTimelineEntry {
  type: "created" | "status" | "payment" | "void" | "update" | "note";
  message: string;
  by?: TUserRef | null;
  at: string;
}

export interface TOrder {
  _id: string;
  orderNo: string;
  customer: TCustomer;
  lead?: { _id: string; name: string; email: string; status: string; message: string } | null;
  meeting?: { _id: string; title: string; start: string } | null;
  source: TOrderSource;
  type: TOrderType;
  service?: { _id: string; title: string; slug: string } | null;
  product?: { _id: string; name: string; slug: string } | null;
  title: string;
  description?: string;
  currency: TCurrency;
  exchangeRate: number;
  amount: number;
  discount: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: TPaymentStatus;
  status: TOrderStatus;
  priority: TOrderPriority;
  deadline?: string;
  deliveredAt?: string;
  assignedTo?: TUserRef | null;
  cancelReason?: string;
  payments: TPayment[];
  timeline: TTimelineEntry[];
  createdBy?: TUserRef | null;
  createdAt: string;
}

export interface TOrderInput {
  customer: TCustomer;
  lead?: string;
  meeting?: string;
  source: TOrderSource;
  type: TOrderType;
  service: string;
  product: string;
  title: string;
  description: string;
  currency?: TCurrency;
  exchangeRate?: number;
  amount?: number;
  discount?: number;
  status?: TOrderStatus;
  priority: TOrderPriority;
  deadline: string;
  assignedTo: string;
}

export interface TPaymentInput {
  amount: number;
  method: TPaymentMethod;
  exchangeRate?: number;
  paidAt?: string;
  trxId?: string;
  note?: string;
}

export type TOrderCard = Pick<TOrder, "_id" | "orderNo" | "title" | "customer" | "status"> &
  Partial<Pick<TOrder, "deadline" | "priority" | "total" | "currency" | "createdAt">>;

export interface TOverview {
  byStatus: { status: TOrderStatus; count: number }[];
  overdue: TOrderCard[];
  upcoming: TOrderCard[];
  recent: TOrderCard[];
  newLeads: number;
  meetings: Pick<TMeeting, "_id" | "title" | "start" | "status" | "meetingUrl" | "attendee">[];
  meetingsToday: number;
  recentLeads: { _id: string; name: string; email: string; createdAt: string }[];
}

export type TAmount = { amount: number; count: number };

export interface TSalesSummary {
  range: { from: string; to: string };
  period: TAmount;
  today: TAmount;
  month: TAmount;
  previousMonth: TAmount;
  allTime: TAmount;
  due: TAmount;
  booked: TAmount;
}

export type TSalesPoint = { date: string; amount: number; count: number };
export type TSalesSlice = { key: string; amount: number; count: number };

export interface TTransaction {
  _id: string;
  orderId: string;
  orderNo: string;
  title: string;
  customer: string;
  currency: TCurrency;
  amount: number;
  exchangeRate: number;
  amountBdt: number;
  method: TPaymentMethod;
  paidAt: string;
  trxId?: string;
}

export type TLeadStatus = "new" | "contacted" | "converted" | "lost";

export interface TLead {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  serviceInterested?: { _id: string; title: string; slug: string } | null;
  budget?: string;
  status: TLeadStatus;
  source?: string;
  createdAt: string;
  order?: { _id: string; orderNo: string } | null;
}

export type TMeetingStatus = "pending" | "accepted" | "cancelled" | "rejected";
export type TMeetingOutcome = "none" | "completed" | "no_show" | "follow_up";

export interface TMeeting {
  _id: string;
  calUid: string;
  title: string;
  start: string;
  end: string;
  attendee: { name?: string; email?: string; phone?: string; timeZone?: string };
  guests: string[];
  location?: string;
  meetingUrl?: string;
  bookingNote?: string;
  cancelReason?: string;
  status: TMeetingStatus;
  outcome: TMeetingOutcome;
  internalNote?: string;
  order?: { _id: string; orderNo: string } | null;
}
