import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Sparkles, Users, TrendingUp, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="container mx-auto max-w-5xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" /> AI-powered insurance advisor
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Find the right health insurance, <span className="text-primary">tailored to you</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Answer a few questions about your age, family, income and health. Our recommendation
            engine compares dozens of policies and explains exactly why each fits.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg"><Link to="/signup">Get my recommendation</Link></Button>
            <Button asChild variant="outline" size="lg"><Link to="/how-it-works">How it works</Link></Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { Icon: Shield, title: "Transparent scoring", body: "Every recommendation comes with a plain-English reason and weighted score breakdown — no black boxes." },
              { Icon: Users, title: "Built for families", body: "Tell us how many people, ages, and conditions. We filter only eligible policies and rank by best fit." },
              { Icon: TrendingUp, title: "Risk-aware", body: "Your age, lifestyle, and pre-existing conditions are factored into a Low / Medium / High risk score." },
            ].map((f) => (
              <Card key={f.title}>
                <CardContent className="pt-6">
                  <f.Icon className="mb-3 h-6 w-6 text-primary" />
                  <h3 className="mb-2 font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 py-16">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-center text-2xl font-bold text-foreground">Three steps to your recommendation</h2>
          <ol className="space-y-4">
            {[
              "Create a free account",
              "Fill in your profile (age, family, budget, coverage need, health)",
              "Get your top 3 policies side-by-side with reasons and a downloadable report",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 rounded-lg border border-border bg-background p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-foreground">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <Button asChild size="lg"><Link to="/signup">Start now — it's free</Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
