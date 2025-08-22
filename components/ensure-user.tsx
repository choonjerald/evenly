"use client";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function EnsureUser() {
  const ensure = useMutation(api.auth.ensureUser);

  useEffect(() => {
    // Fire-and-forget; ignores errors if already provisioned
    ensure({}).catch(() => {});
  }, [ensure]);

  return null;
}
