"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { InstantSignInButton } from "@/components/auth/instant-signin-button";

export function PrimaryCTA({ initialUserId }: { initialUserId?: string | null }) {
  const { isSignedIn } = useAuth();
  const signedIn = typeof isSignedIn === "boolean" ? isSignedIn : Boolean(initialUserId);
  const router = useRouter();
  // Duplicate Button primary styles for a native <button> to work inside modal trigger
  const cls =
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-foreground text-background hover:bg-foreground/90";

  return (
    <div className="inline-flex items-center gap-3">
      {signedIn ? (
        <button type="button" className={cls} onClick={() => router.push("/dashboard")}>
          Dashboard
        </button>
      ) : (
        <InstantSignInButton>
          <button type="button" className={cls} aria-label="Sign in to start splitting">
            Start splitting free
          </button>
        </InstantSignInButton>
      )}
    </div>
  );
}
