import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section, Stack, Columns, Card, Button, Grid } from "@/components/reactbits/primitives";
import { SplitVisual } from "@/components/reactbits/split-visual";
import { PrimaryCTA } from "@/components/landing/primary-cta";
import { ScrollRevealGate } from "@/components/landing/scroll-reveal-gate";
import { auth } from "@clerk/nextjs/server";

export const metadata: Metadata = {
  title: "Evenly — The art of splitting evenly",
  description: "Fast, fair group expenses.",
  openGraph: {
    title: "Evenly — Split everything evenly",
    description: "Fast, fair group expenses.",
    url: "https://example.com",
    siteName: "Evenly",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Evenly — Split evenly",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Evenly",
    description: "Fast, fair group expenses.",
    images: ["/og.png"],
  },
};

export default async function Home() {
  const { userId } = await auth();
  return (
    <main>
      {/* Scoped tokens used by this page */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .rb-hero h1 { letter-spacing: -0.02em; }
          .rb-grid { --rb-gap: clamp(16px, 3vw, 28px); gap: var(--rb-gap); }
          /* Section-by-section slide-up (content visible by default) */
          @keyframes rbSlideIn { from { transform: translateY(12px); } to { transform: none; } }
          .rb-reveal[data-on] > section:not(.rb-fade-onload) { animation: rbSlideIn .55s ease both; }
          .rb-reveal[data-on] > section:nth-of-type(1) { animation-delay: .02s; }
          .rb-reveal[data-on] > section:nth-of-type(2) { animation-delay: .12s; }
          .rb-reveal[data-on] > section:nth-of-type(3) { animation-delay: .22s; }
          .rb-reveal[data-on] > section:nth-of-type(4) { animation-delay: .32s; }
          /* Onload fade-in for key heading */
          @keyframes rbFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
          .rb-fade-onload { opacity: 0; animation: rbFadeIn .6s ease .15s forwards; }
          @media (prefers-reduced-motion: reduce) {
            .rb-reveal > section, .rb-reveal[data-on] > section { animation: none !important; transform: none !important; }
            .rb-fade-onload { animation: none !important; opacity: 1 !important; }
          }
        `,
        }}
      />

      {/* Hero: balanced 50/50 split with vertical divider */}
      <Section className="rb-hero">
          <Container>
            <Columns divide>
              <Stack space="md">
                <p className="text-sm tracking-wide text-muted-foreground">Evenly</p>
                <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">The art of splitting evenly</h1>
                <p className="max-w-prose text-balance text-muted-foreground">Fast, fair group expenses.</p>
                <div className="flex flex-wrap items-center gap-3">
                  <PrimaryCTA initialUserId={userId} />
                  <Button asChild intent="ghost">
                    <Link href="#features">Explore features</Link>
                  </Button>
                </div>
              </Stack>
              <Card aria-label="Even split example">
                <SplitVisual total={120} label="Dinner" members={["Alex", "Bea", "Cam", "Drew"]} />
              </Card>
            </Columns>
          </Container>
      </Section>

      <ScrollRevealGate>

      {/* Value Props: four even cards in a symmetric grid */}
      <Section id="features" className="rb-fade-onload">
        <Container>
            <Stack space="sm" align="center">
              <h2 className="text-2xl font-semibold sm:text-3xl">Made for fair, fast splits</h2>
              <p className="text-muted-foreground">Built-in tools that keep every group even.</p>
            </Stack>
          <Grid cols={{ base: 1, sm: 2, lg: 4 }} className="mt-8 rb-grid">
            {[
              { t: "Groups dashboard", d: "Create and manage groups." },
              { t: "Join via code", d: "Enter a code to join quickly." },
              { t: "Expenses", d: "Add who paid; split evenly or by shares." },
              { t: "Balances", d: "See who owes what at a glance." },
              { t: "Members", d: "Invite people, start splitting." },
              { t: "Settings", d: "Currency and group preferences." },
              { t: "Manage", d: "Expenses, Balances, Members, Settings." },
              { t: "Clean summaries", d: "Totals and breakdowns, clearly." },
            ].map((f) => (
              <Card key={f.t} className="h-full">
                <Stack space="xs">
                  <h3 className="font-medium">{f.t}</h3>
                  <p className="text-sm text-muted-foreground">{f.d}</p>
                </Stack>
              </Card>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Split Feature Grid */}
      <Section>
        <Container>
          <Columns stackOn="md" divide>
            <Stack space="sm">
              <h2 className="text-2xl font-semibold sm:text-3xl">Why even splits win</h2>
              <ul className="grid list-disc gap-3 pl-5 text-sm text-muted-foreground">
                <li>Everyone sees the same math</li>
                <li>Fewer edge cases, quicker decisions</li>
                <li>Balances stay predictable over time</li>
              </ul>
            </Stack>
            <Card>
              <SplitVisual total={96} label="Weekend" members={["You", "A", "B", "C", "D", "E"]} />
            </Card>
          </Columns>
        </Container>
      </Section>

      {/* Pricing removed by request */}

      {/* FAQ: native disclosure (no JS) */}
      <Section id="faq">
        <Container>
          <Stack space="sm" align="center">
            <h2 className="text-2xl font-semibold sm:text-3xl">FAQ</h2>
          </Stack>
          <div className="mx-auto mt-6 max-w-2xl divide-y">
            {[
              { q: "Is it free?", a: "Yes. Core features are free to use." },
              { q: "Do others need an account?", a: "No. Use solo or invite collaborators." },
              { q: "Multiple currencies?", a: "Create groups per currency and settings." },
              { q: "How is my data handled?", a: "We only store what’s needed — nothing more." },
            ].map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="cursor-pointer list-none font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {item.q}
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

        {/* Final CTA: symmetric split */}
        <Section id="cta">
          <Container>
            <Card>
              <div className="grid grid-cols-2 items-center">
                <div className="h-full border-r p-6 text-center">
                  <p className="text-sm text-muted-foreground">Keep it even</p>
                </div>
                <div className="p-6 text-center">
                  <PrimaryCTA />
                </div>
              </div>
            </Card>
          </Container>
        </Section>
      </ScrollRevealGate>
    </main>
  );
}
