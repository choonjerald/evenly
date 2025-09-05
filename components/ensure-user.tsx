"use client";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";

export function EnsureUser() {
  const ensure = useMutation(api.auth.ensureUser);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return; // avoid unauthorized errors in logs when signed out
    // Fire-and-forget; ignores errors if already provisioned
    ensure({}).catch(() => {});
  }, [isSignedIn, ensure]);

  return null;
}
