import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const metadata = {
  title: "SplitMVP",
  description: "Fast, clean group expenses.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ConvexProviderWithClerk client={convex}>
            <div className="min-h-screen bg-background text-foreground">{children}</div>
          </ConvexProviderWithClerk>
        </body>
      </html>
    </ClerkProvider>
  );
}
