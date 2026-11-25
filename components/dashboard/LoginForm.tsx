"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { useLoginMutation } from "@/redux/api/authApi";
import { baseApi } from "@/redux/api/baseApi";
import { useAppDispatch } from "@/redux/hooks";
import { storeUserInfo } from "@/services/auth.services";
import { Button, errorMessage, Field, Input } from "./ui";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const { accessToken } = await login({
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
      }).unwrap();
      dispatch(baseApi.util.resetApiState());
      storeUserInfo({ accessToken });
      router.replace(next);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo size={48} />
          <h1 className="text-xl">Team login</h1>
          <p className="text-sm text-text-dim">Interactive Software Care dashboard</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Email">
            <Input type="email" name="email" autoComplete="username" required />
          </Field>
          <Field label="Password">
            <Input type="password" name="password" autoComplete="current-password" required />
          </Field>
          <p role="alert" className="text-sm text-danger empty:hidden">
            {error}
          </p>
          <Button type="submit" busy={isLoading}>
            Log in
          </Button>
        </form>
        <Link href="/" className="mt-4 block text-center text-xs text-text-dim hover:text-text">
          Back to website
        </Link>
      </div>
    </main>
  );
}
