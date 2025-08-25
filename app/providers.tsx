"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { EnsureUser } from "@/components/ensure-user";
import { ThemeProvider } from "@/components/theme-provider";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <EnsureUser />
          {/* Global toggle (you can move this into a navbar later) */}
          <div className="fixed right-4 top-4 z-50">
          </div>
          {children}
        </ConvexProviderWithClerk>
      </ThemeProvider>
    </ClerkProvider>
  );
}
