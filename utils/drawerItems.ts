import {
  Boxes, FolderKanban, Inbox, LayoutDashboard, LineChart, Settings, ShoppingCart, Tags, Users,
} from "lucide-react";
import { USER_ROLE } from "@/contains/role";
import type { DrawerItem, UserRole } from "@/types";

const ITEMS: DrawerItem[] = [
  { title: "Overview", path: "/dashboard", group: "General", icon: LayoutDashboard },

  { title: "Orders", path: "/dashboard/orders", group: "Tracking", icon: ShoppingCart },
  { title: "Sales", path: "/dashboard/sales", group: "Tracking", icon: LineChart, adminOnly: true },
  { title: "Leads", path: "/dashboard/leads", group: "Tracking", icon: Inbox },

  { title: "Projects", path: "/dashboard/projects", group: "Content", icon: FolderKanban, adminOnly: true },
  { title: "Products", path: "/dashboard/products", group: "Content", icon: Boxes, adminOnly: true },
  { title: "Categories", path: "/dashboard/categories", group: "Content", icon: Tags, adminOnly: true },

  { title: "Users", path: "/dashboard/users", group: "Management", icon: Users, adminOnly: true },
  { title: "Settings", path: "/dashboard/settings", group: "Management", icon: Settings },
];

export const isAdminRole = (role?: UserRole) => role === USER_ROLE.ADMIN || role === USER_ROLE.SUPER_ADMIN;

export const drawerItems = (role: UserRole) => ITEMS.filter((item) => !item.adminOnly || isAdminRole(role));

/** The menu entry that owns a path, e.g. /dashboard/orders/123 belongs to Orders. */
export const activeItem = (pathname: string) =>
  [...ITEMS].reverse().find((i) => pathname === i.path || (i.path !== "/dashboard" && pathname.startsWith(`${i.path}/`))) ??
  ITEMS[0];
