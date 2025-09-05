"use client";

import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { InstantSignInButton } from "@/components/auth/instant-signin-button";

export function Navbar({ initialUserId }: { initialUserId?: string | null }) {
  const { isSignedIn } = useAuth();
  const signedIn = typeof isSignedIn === "boolean" ? isSignedIn : Boolean(initialUserId);
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link href="/" className="text-xl font-bold">
          Evenly.
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
          {signedIn ? (
            <>
              <Link href="/dashboard">
                <Button size="sm" variant="ghost">Dashboard</Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <InstantSignInButton>
              <Button size="sm" type="button">Sign in</Button>
            </InstantSignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
