export type TCategoryRef = { _id: string; name: string; slug: string };

export interface TService {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  icon?: string;
  category?: TCategoryRef | string | null;
  order: number;
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface TPortfolioItem {
  /** Absent on the sample projects used when the API is empty. */
  status?: TProjectStatus;
  _id: string;
  title: string;
  slug: string;
  client?: string;
  description: string;
  techStack: string[];
  thumbnail: string;
  gallery?: string[];
  liveUrl?: string;
  category?: TCategoryRef | string | null;
  isFeatured: boolean;
  order: number;
  metaTitle?: string;
  metaDescription?: string;
}

export interface TTestimonial {
  _id: string;
  clientName: string;
  clientRole?: string;
  clientCompany?: string;
  photo?: string;
  quote: string;
  rating: number;
  relatedPortfolioItem?: { _id: string; title: string; slug: string } | string | null;
  isApproved: boolean;
  isFeatured: boolean;
}

export interface TSocialLink {
  platform: string;
  url: string;
}

export interface TSettings {
  fbPixelId?: string;
  gaId?: string;
  gtmId?: string;
  searchConsoleTag?: string;
  contactEmail?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  officeAddress?: string;
  socialLinks?: TSocialLink[];
}

export interface TLeadInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
  serviceInterested?: string;
  budget?: string;
  source?: string;
  website: string;
}

export type TProductType = "saas" | "ai" | "tool";
export type TProductPublishStatus = "draft" | "coming_soon" | "published" | "under_maintenance" | "discontinued";
export type TProjectStatus = "in_progress" | "delivered" | "live" | "under_maintenance" | "retired";

export interface TPricingPlan {
  name: string;
  price: number;
  currency: "BDT" | "USD";
  period: "month" | "year" | "once";
  features: string[];
}

export interface TProduct {
  _id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  type: TProductType;
  features: string[];
  techStack: string[];
  pricingPlans: TPricingPlan[];
  thumbnail: string;
  gallery: string[];
  demoUrl?: string;
  liveUrl?: string;
  status: TProductPublishStatus;
  isFeatured: boolean;
  order: number;
  metaTitle?: string;
  metaDescription?: string;
}
