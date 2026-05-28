// Static "About" page describing the academic project
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({ component: About });

function About() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold text-foreground">About AI Insurance Policy</h1>
      <p className="mt-3 text-muted-foreground">
        An AI-powered personalized health insurance recommendation system, built as a final-year
        academic project.
      </p>

      <Card className="mt-8">
        <CardHeader><CardTitle>The problem</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Most people struggle to choose a health insurance policy because plans differ on premium,
          coverage, exclusions, waiting periods, claim settlement ratios, hospital networks, and
          benefits — and the information is scattered across insurer websites and aggregator sites.
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>The approach</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          AI Insurance Policy uses a four-stage hybrid pipeline — rule-based eligibility filtering, risk
          classification, content-based policy matching, and weighted ranking — to surface the top
          3 most-suitable policies for a given user with a plain-English explanation for each.
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>Tech stack</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Frontend:</strong> React 19, TanStack Start &amp; Router, Tailwind CSS, shadcn/ui.</p>
          <p><strong>Backend:</strong> TanStack Start server functions (TypeScript) backed by Supabase (PostgreSQL + auth + RLS).</p>
          <p><strong>Recommendation engine:</strong> rule filter + weighted content-based scoring + risk classifier (pure TypeScript, unit-testable).</p>
          <p><strong>Reporting:</strong> jsPDF for downloadable recommendation reports.</p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>Scope &amp; future work</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The current scope is <strong>health insurance</strong> only, using synthetic but
          realistic policy data sourced from public IRDAI reports. Future scope includes life,
          motor and travel insurance, live insurer-API integration, claim-prediction, and a
          conversational chatbot for policy doubts.
        </CardContent>
      </Card>

      <div className="mt-8 flex gap-2">
        <Button asChild><Link to="/signup">Try it now</Link></Button>
        <Button asChild variant="outline"><Link to="/how-it-works">How it works</Link></Button>
      </div>
    </div>
  );
}
