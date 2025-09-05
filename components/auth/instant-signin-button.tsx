"use client";

import { SignInButton } from "@clerk/nextjs";
import { useMemo } from "react";
import type { ComponentProps, ReactNode } from "react";

type Props = ComponentProps<typeof SignInButton> & { children: ReactNode };

export function InstantSignInButton({ children, fallbackRedirectUrl, signUpFallbackRedirectUrl, ...props }: Props) {
  // Provide safe fallbacks to avoid navigating to non-existent routes before hydration
  const fallback = useMemo(() => fallbackRedirectUrl ?? (typeof window !== "undefined" ? window.location.pathname : "/"), [fallbackRedirectUrl]);
  const signupFallback = useMemo(() => signUpFallbackRedirectUrl ?? fallback, [signUpFallbackRedirectUrl, fallback]);
  return (
    <SignInButton mode="modal" fallbackRedirectUrl={fallback} signUpFallbackRedirectUrl={signupFallback} {...props}>
      {children}
    </SignInButton>
  );
}
