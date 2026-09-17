import { Zap, Timer, Users, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const stats = [
  { value: "Early", label: "Access for first sign-ups", icon: Timer },
  { value: "Free", label: "To join, no credit card needed", icon: ShieldCheck },
  { value: "1 email", label: "When we launch — nothing more", icon: Users }
];

const reasons = [
  {
    title: "Built around your goals",
    body: "Monoversal Hub is designed to help you connect, grow, and achieve — without the noise."
  },
  {
    title: "Ready when you are",
    body: "Sign up today and get exclusive early access the moment we open the doors."
  },
  {
    title: "Transparent by default",
    body: "No spam. No dark patterns. Just one email when it's time — and you're in control."
  }
];

export default function Home() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <div className="container grid gap-12 py-24 md:grid-cols-[1.2fr_1fr] md:items-center md:py-32">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-accent" />
              Early access — limited spots
            </div>
            <h1 className="font-display text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
              Your hub for everything that matters.
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Monoversal Hub is launching soon. Get on the list and be the first
              to experience a smarter way to connect and create.
            </p>
            {/* Tally form embed placeholder — replace src with your Tally form URL */}
            <div className="mt-8 max-w-md">
              <iframe
                data-tally-src="https://tally.so/embed/YOUR_FORM_ID?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
                loading="lazy"
                width="100%"
                height="200"
                title="Monoversal Hub waitlist"
                className="border-0"
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              No spam. One email when doors open.
            </p>
          </div>
          <div className="relative aspect-square w-full max-w-md justify-self-center rounded-2xl bg-gradient-to-br from-primary to-accent md:justify-self-end" />
        </div>
      </section>

      <section className="border-b border-border bg-secondary/40">
        <div className="container grid gap-8 py-14 sm:grid-cols-3">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex items-start gap-4">
              <Icon className="mt-1 h-6 w-6 shrink-0 text-primary" />
              <div>
                <div className="font-display text-3xl font-medium">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-24">
        <h2 className="font-display max-w-lg text-3xl font-medium tracking-tight md:text-4xl">
          Why people are excited about Monoversal Hub
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reasons.map((reason) => (
            <Card key={reason.title}>
              <CardHeader>
                <CardTitle>{reason.title}</CardTitle>
                <CardDescription>{reason.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="container flex flex-col items-start gap-6 py-20 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-3xl font-medium tracking-tight">
              Spots are limited. Don&apos;t miss out.
            </h2>
            <p className="mt-2 text-muted-foreground">
              Join now and we&apos;ll email you the moment it&apos;s time.
            </p>
          </div>
          <Button size="lg" asChild>
            <a href="#top">Get early access</a>
          </Button>
        </div>
      </section>
    </main>
  );
}
