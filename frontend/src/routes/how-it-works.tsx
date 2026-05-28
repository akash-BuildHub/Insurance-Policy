// Explains the recommendation pipeline and risk scoring
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  ShieldCheck,
  Calculator,
  ListChecks,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/how-it-works")({ component: HowItWorks });

function HowItWorks() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10 text-center">
        <Badge variant="outline" className="mb-3">
          <Sparkles className="mr-1 h-3 w-3" /> Hybrid AI pipeline
        </Badge>
        <h1 className="text-4xl font-bold text-foreground">How AI Insurance Policy works</h1>
        <p className="mt-3 text-muted-foreground">
          A transparent four-stage pipeline — no black-box recommendations.
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-primary" />
              <CardTitle>1. You answer a short health questionnaire</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Personal details (age, gender, family size, occupation), finance (income, budget, coverage
            need), and health & lifestyle (pre-existing conditions, smoking, alcohol, family history,
            exercise habits). Everything stays in your profile — you can edit it anytime.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>2. Rule-based eligibility filter</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            We drop any policy you don't qualify for: outside the age band, family-size cap, your
            coverage need is too high, premium is way above your budget, or your pre-existing
            condition is listed as a hard exclusion.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle>3. Risk classification</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>You're classified into <strong>Low</strong>, <strong>Medium</strong>, or <strong>High</strong> risk based on:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Age (older → higher risk)</li>
              <li>Pre-existing conditions (each adds ~1.5 to the score)</li>
              <li>Smoking, alcohol, sedentary lifestyle</li>
              <li>Family medical history</li>
              <li>Occupation (hazardous jobs add risk)</li>
              <li>Coverage need vs. annual income</li>
            </ul>
            <p>The risk level influences which <em>kind</em> of policy ranks highest for you.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-primary" />
              <CardTitle>4. Weighted ranking</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-3">Each eligible policy gets a score from 0 to 100% using these weights:</p>
            <table className="w-full max-w-md text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Factor</th>
                  <th className="py-2 pr-4 text-right">Weight</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Budget match", "30%"],
                  ["Coverage match", "25%"],
                  ["Claim settlement & company reliability", "20%"],
                  ["Benefits match", "15%"],
                  ["Risk suitability", "10%"],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b">
                    <td className="py-2 pr-4 text-foreground">{k}</td>
                    <td className="py-2 pr-4 text-right font-medium text-foreground">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3">
              We rank by the weighted sum, present the <strong>top 3</strong> with a clear,
              plain-English reason for each suggestion.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">Ready to try it?</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Takes about 2 minutes. You get a downloadable PDF report with your top 3 policies and
            the reasons behind each one.
          </p>
          <Button asChild size="lg"><Link to="/signup">Get my recommendation</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
