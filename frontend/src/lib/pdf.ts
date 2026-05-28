// =====================================================================
// AI Insurance Policy — PDF report generation
//
// Builds a printable recommendation report from a stored recommendation
// and its ranked items. Uses jsPDF + jspdf-autotable.
// =====================================================================
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface RecRow {
  id: string;
  created_at: string;
  risk_level: string;
  risk_score: number | string;
  profile_snapshot: Record<string, unknown>;
}

interface ItemRow {
  rank: number;
  score: number | string;
  reason: string;
  policy: {
    name: string;
    policy_type?: string;
    premium_monthly: number;
    coverage_amount: number;
    waiting_period_months: number;
    benefits: string[];
    claim_settlement_ratio?: number | null;
    network_hospitals?: number | null;
    room_rent_limit?: string;
    co_payment_percentage?: number;
    maternity_cover?: boolean;
    pre_existing_coverage?: boolean;
    pre_existing_waiting_months?: number;
    company?: { name: string; claim_settlement_ratio: number; network_hospitals: number };
  };
}

const FOOTER =
  "Academic prototype. Synthetic data. Not licensed financial or insurance advice. Verify policy terms with the insurer before purchase.";

export function generatePdf(rec: RecRow, items: ItemRow[]) {
  const doc = new jsPDF();
  const margin = 14;
  let y = 20;

  // Header
  doc.setFontSize(20);
  doc.text("AI Insurance Policy — Recommendation Report", margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date(rec.created_at).toLocaleString()}`, margin, y);
  y += 10;

  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text(
    `Risk profile: ${rec.risk_level} (score ${Number(rec.risk_score).toFixed(1)})`,
    margin,
    y,
  );
  y += 8;

  // ---------- Profile summary ----------
  const snap = rec.profile_snapshot as Record<string, unknown>;
  const fmt = (v: unknown) => (v == null || v === "" ? "—" : String(v));
  autoTable(doc, {
    startY: y,
    head: [["Your profile", "Value"]],
    body: [
      ["Name", fmt(snap.full_name)],
      ["Age", fmt(snap.age)],
      ["Gender", fmt(snap.gender)],
      ["Marital status", fmt(snap.marital_status)],
      ["Occupation", fmt(snap.occupation)],
      ["Family size", fmt(snap.family_size)],
      ["Dependents", fmt(snap.dependents)],
      ["Monthly income", `Rs. ${Number(snap.monthly_income ?? 0).toLocaleString("en-IN")}`],
      [
        "Budget",
        `Rs. ${Number(snap.monthly_budget ?? 0).toLocaleString("en-IN")} (${fmt(
          snap.budget_period,
        )})`,
      ],
      [
        "Coverage need",
        `Rs. ${Number(snap.coverage_need ?? 0).toLocaleString("en-IN")}`,
      ],
      ["Preferred type", fmt(snap.preferred_policy_type)],
      ["Pre-existing", ((snap.pre_existing as string[]) ?? []).join(", ") || "None"],
      ["Family history", ((snap.family_history as string[]) ?? []).join(", ") || "None"],
      ["Smoker", snap.smoker ? "Yes" : "No"],
      ["Drinks alcohol", snap.alcohol ? "Yes" : "No"],
      ["Lifestyle", fmt(snap.lifestyle)],
      ["Current insurance", fmt(snap.current_insurance)],
    ],
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 9 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // ---------- Recommended policies summary ----------
  doc.setFontSize(14);
  doc.text("Top recommendations", margin, y);
  y += 2;

  autoTable(doc, {
    startY: y + 2,
    head: [["Rank", "Policy", "Insurer", "Premium/mo", "Coverage", "Claim %", "Score"]],
    body: items.map((it) => [
      `#${it.rank}`,
      it.policy.name,
      it.policy.company?.name ?? "—",
      `Rs. ${it.policy.premium_monthly.toLocaleString("en-IN")}`,
      `Rs. ${(it.policy.coverage_amount / 100000).toFixed(1)}L`,
      `${(it.policy.claim_settlement_ratio ?? it.policy.company?.claim_settlement_ratio) ?? "—"}%`,
      `${Math.round(Number(it.score) * 100)}%`,
    ]),
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 9 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // ---------- Detail per policy ----------
  doc.setFontSize(14);
  doc.text("Why these were recommended", margin, y);
  y += 8;

  items.forEach((it) => {
    if (y > 245) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`#${it.rank} ${it.policy.name}`, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(
      `${it.policy.company?.name ?? ""} · ${it.policy.policy_type ?? "—"} · match ${Math.round(
        Number(it.score) * 100,
      )}%`,
      margin,
      y,
    );
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Feature", "Value"]],
      body: [
        ["Premium / month", `Rs. ${it.policy.premium_monthly.toLocaleString("en-IN")}`],
        ["Coverage", `Rs. ${(it.policy.coverage_amount / 100000).toFixed(1)} L`],
        ["Waiting period", `${it.policy.waiting_period_months} months`],
        [
          "Claim ratio",
          `${(it.policy.claim_settlement_ratio ?? it.policy.company?.claim_settlement_ratio) ?? "—"}%`,
        ],
        [
          "Network hospitals",
          (
            (it.policy.network_hospitals ?? it.policy.company?.network_hospitals) ?? 0
          ).toLocaleString("en-IN"),
        ],
        ["Room rent", it.policy.room_rent_limit ?? "—"],
        ["Co-payment", `${it.policy.co_payment_percentage ?? 0}%`],
        ["Maternity cover", it.policy.maternity_cover ? "Yes" : "No"],
        [
          "Pre-existing covered",
          it.policy.pre_existing_coverage
            ? `Yes (after ${it.policy.pre_existing_waiting_months ?? 36} months)`
            : "No",
        ],
        ["Key benefits", it.policy.benefits.map((b) => b.replace(/_/g, " ")).join(", ")],
      ],
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 8 },
      margin: { left: margin, right: margin },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

    doc.setFontSize(9);
    doc.setTextColor(50);
    const lines = doc.splitTextToSize(`Reason: ${it.reason}`, 180);
    if (y + lines.length * 5 > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin, y);
    y += lines.length * 5 + 6;
  });

  // ---------- Disclaimer footer on every page ----------
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(140);
    const footerLines = doc.splitTextToSize(FOOTER, 180);
    doc.text(footerLines, margin, 287);
  }

  doc.save(`ai-insurance-policy-recommendation-${rec.id.slice(0, 8)}.pdf`);
}
