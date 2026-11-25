import type { LucideIcon } from "lucide-react";

export type TApiResponse<T> = {
  data: T;
  message?: string;
  success?: boolean;
  meta?: TMeta;
};

export type TMeta = {
  limit: number;
  page: number;
  total: number;
  // totalPage: number;
};

export type ResponseSuccessType = {
  data: unknown;
  meta?: TMeta;
}

export type IGenericErrorMessage = {
  path?: string | number;
  message?: string;
  statusCode?: number;
  errorMessages?: string
};

export type TApiError = {
  status?: number | string;
  data?: {
    message?: string;
    errorMessages?: IGenericErrorMessage[];
    stack?: string;
  } | string;
  message?: string;
};


export interface TCategory {
  _id?: string;
  name: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = "staff" | "admin" | "superAdmin";

export interface TUser {
  _id?: string;
  username: string;
  email: string;
  contactNumber: string;
  profilePicture?: string;
  role: UserRole;
  isBlocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DrawerItem {
  title: string;
  path: string;
  group: string;
  adminOnly?: boolean;
  icon: LucideIcon;
}

// Paginated endpoints are normalised to this by RTK Query transformResponse.
export interface TPaginatedList<T> {
  items: T[];
  meta: TMeta;
}
