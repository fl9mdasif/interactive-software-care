import type { Metadata } from "next";
import { LoginForm } from "@/components/dashboard/LoginForm";

export const metadata: Metadata = {
  title: "Team login",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Only ever return to a dashboard path, never to a caller-supplied address.
  const target = next && /^\/dashboard(\/[\w-]+)*$/.test(next) ? next : "/dashboard";
  return <LoginForm next={target} />;
}
