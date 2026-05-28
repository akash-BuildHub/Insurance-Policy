// Full project disclaimer page (linked from the footer)
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/disclaimer")({ component: Disclaimer });

function Disclaimer() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 flex items-center gap-2">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        <h1 className="text-3xl font-bold text-foreground">Disclaimer</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Academic prototype — not financial advice</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            AI Insurance Policy is an <strong>academic final-year project prototype</strong> built for
            educational demonstration of an AI-powered insurance recommendation pipeline. It does
            not provide licensed financial, legal, or insurance advice.
          </p>
          <p>
            All insurance company names, policy names, premiums, coverage amounts, claim settlement
            ratios, network hospital counts, and benefits in the system are <strong>synthetic and
            illustrative</strong>. They are derived from public sources for academic demonstration
            and may not reflect any specific real-world insurer or policy.
          </p>
          <p>
            Users <strong>must verify</strong> all policy terms, eligibility rules, exclusions,
            waiting periods, claim settlement ratios, and premium amounts with the official
            insurance provider before making any purchase decision.
          </p>
          <p>
            The risk classification and recommendation scores are based on a simplified hybrid
            model and should not be used as a substitute for advice from a licensed insurance
            agent, financial planner, or medical professional.
          </p>
          <p>
            The authors and contributors disclaim any liability arising from decisions taken on
            the basis of this prototype.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
