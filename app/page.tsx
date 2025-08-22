"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl py-20 px-6 text-center">
      <h1 className="text-4xl font-bold mb-4">Evenly.</h1>
      <p className="text-muted-foreground mb-8">Fast, clean group expenses.</p>

      <SignedOut>
        <SignInButton mode="modal">
          <Button>Start tracking</Button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <Link href="/dashboard">
          <Button>Go to dashboard</Button>
        </Link>
        <div className="mt-6 flex justify-center">
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>
    </main>
  );
}
