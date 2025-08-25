"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, DollarSign, BarChart } from "lucide-react";

export default function Home() {
  return (
    <main>
      <section className="mx-auto flex max-w-5xl flex-col items-center gap-4 py-24 px-6 text-center">
        <h1 className="text-5xl font-bold">Split expenses with ease</h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          Evenly helps you track and settle group costs without the spreadsheets.
        </p>
        <div className="mt-6 flex gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="lg">Start tracking</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button size="lg">Go to dashboard</Button>
            </Link>
          </SignedIn>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 text-center">
          <Users className="mx-auto mb-4 h-8 w-8 text-primary" />
          <h3 className="mb-2 font-semibold">Create groups</h3>
          <p className="text-sm text-muted-foreground">
            Set up shared spaces for trips, households or projects.
          </p>
        </Card>
        <Card className="p-6 text-center">
          <DollarSign className="mx-auto mb-4 h-8 w-8 text-primary" />
          <h3 className="mb-2 font-semibold">Add expenses</h3>
          <p className="text-sm text-muted-foreground">
            Log payments in seconds and split them however you like.
          </p>
        </Card>
        <Card className="p-6 text-center">
          <BarChart className="mx-auto mb-4 h-8 w-8 text-primary" />
          <h3 className="mb-2 font-semibold">Settle up</h3>
          <p className="text-sm text-muted-foreground">
            Know who owes what at a glance and keep balances fair.
          </p>
        </Card>
      </section>
    </main>
  );
}
