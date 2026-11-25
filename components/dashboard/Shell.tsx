"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { label } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGetMeQuery, useLogoutMutation } from "@/redux/api/authApi";
import { baseApi } from "@/redux/api/baseApi";
import { useAppDispatch } from "@/redux/hooks";
import { isLoggedIn, removeUser } from "@/services/auth.services";
import { activeItem, drawerItems, isAdminRole } from "@/utils/drawerItems";
import type { TUser } from "@/types";
import { Button, EmptyState, ErrorState, Loading, LinkButton } from "./ui";

function Sidebar({ user, onNavigate }: { user: TUser; onNavigate: () => void }) {
  const pathname = usePathname();
  const items = drawerItems(user.role);
  const current = activeItem(pathname).path;
  const groups = [...new Set(items.map((i) => i.group))];

  return (
    <nav aria-label="Dashboard" className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2 px-2 font-display font-semibold">
        <Logo size={30} />
        iSoftwareCare
      </Link>
      {groups.map((group) => (
        <div key={group} className="flex flex-col gap-1">
          <p className="px-3 font-mono text-[0.65rem] uppercase tracking-widest text-text-dim">{group}</p>
          {items
            .filter((i) => i.group === group)
            .map(({ path, title, icon: Icon }) => (
              <Link
                key={path}
                href={path}
                onClick={onNavigate}
                aria-current={current === path ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  current === path ? "bg-acid-dim font-medium text-text" : "text-text-mid hover:bg-tint hover:text-text",
                )}
              >
                <Icon className={cn("size-4", current === path && "text-acid")} />
                {title}
              </Link>
            ))}
        </div>
      ))}
      <a href="/" target="_blank" rel="noopener" className="mt-auto flex items-center gap-2 px-3 py-2 text-xs text-text-dim hover:text-text">
        <ExternalLink className="size-3.5" />
        View website
      </a>
    </nav>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  // The token lives in localStorage, so nothing is known until mounted.
  const [hasToken, setHasToken] = useState(false);
  const [logout] = useLogoutMutation();
  const { data: user, error, refetch } = useGetMeQuery(undefined, { skip: !hasToken, refetchOnMountOrArgChange: true });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isLoggedIn()) setHasToken(true);
    else router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);

  const signOut = async () => {
    await logout();
    removeUser();
    dispatch(baseApi.util.resetApiState());
    router.replace("/login");
  };

  if (error && !user) {
    return (
      <div className="mx-auto mt-24 max-w-md">
        <ErrorState error={error} retry={refetch} />
        <div className="flex justify-center">
          <Button variant="ghost" onClick={signOut}>
            Log out
          </Button>
        </div>
      </div>
    );
  }
  if (!user) return <Loading text="Checking your session…" />;

  const item = activeItem(pathname);
  const allowed = !item.adminOnly || isAdminRole(user.role);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-surface lg:block">
        <Sidebar user={user} onNavigate={() => setOpen(false)} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64 max-w-[85vw] border-r border-line bg-surface">
            <Button variant="ghost" size="sm" aria-label="Close menu" className="absolute right-2 top-3" onClick={() => setOpen(false)} autoFocus>
              <X className="size-4" />
            </Button>
            <Sidebar user={user} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur lg:px-6">
          <Button variant="ghost" size="sm" aria-label="Open menu" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <span className="truncate font-display font-semibold">{item.title}</span>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-sm font-medium">{user.username}</div>
              <div className="text-xs text-text-dim">{label(user.role)}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} aria-label="Log out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[90rem] flex-1 p-4 lg:p-6">
          {allowed ? (
            children
          ) : (
            <EmptyState message="Your account does not have access to this page.">
              <LinkButton href="/dashboard" variant="secondary">
                Back to overview
              </LinkButton>
            </EmptyState>
          )}
        </main>
      </div>
    </div>
  );
}
