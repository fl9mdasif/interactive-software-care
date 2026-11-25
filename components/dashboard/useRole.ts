"use client";

import { useGetMeQuery } from "@/redux/api/authApi";
import { isAdminRole } from "@/utils/drawerItems";

/** The signed-in user as the server sees them now, not as the old token says. */
export function useRole() {
  const { data: me } = useGetMeQuery();
  return { me, isAdmin: isAdminRole(me?.role) };
}
