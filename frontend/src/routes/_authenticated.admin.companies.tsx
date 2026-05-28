// Admin: CRUD for insurance companies
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type CompanyOut } from "@/lib/api";
import { companySchema } from "@/lib/schemas";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/companies")({ component: AdminCompanies });

type EditForm = {
  id?: string;
  name: string;
  claim_settlement_ratio: number;
  customer_rating: number;
  network_hospitals: number;
  support_availability: string;
  description: string;
  logo_url: string;
};

const EMPTY: EditForm = {
  name: "",
  claim_settlement_ratio: 95,
  customer_rating: 4,
  network_hospitals: 5000,
  support_availability: "24x7 helpline",
  description: "",
  logo_url: "",
};

function AdminCompanies() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: () => api<CompanyOut[]>("/api/companies"),
  });

  const onSave = async () => {
    if (!editing) return;
    const parsed = companySchema.safeParse({
      ...editing,
      logo_url: editing.logo_url || undefined,
    });
    if (!parsed.success) {
      toast.error("Please check the form fields");
      return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        await api<CompanyOut>(`/api/companies/${editing.id}`, {
          method: "PUT",
          body: parsed.data,
        });
      } else {
        await api<CompanyOut>("/api/companies", { method: "POST", body: parsed.data });
      }
      toast.success("Saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-companies"] });
      qc.invalidateQueries({ queryKey: ["policies"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this company and all its policies?")) return;
    try {
      await api(`/api/companies/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-companies"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data?.length ?? 0} insurance {data?.length === 1 ? "company" : "companies"}
        </p>
        <Button onClick={() => setEditing({ ...EMPTY })}>
          <Plus className="mr-1 h-4 w-4" /> Add company
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All companies</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Claim %</th>
                  <th className="py-2 pr-4">Rating</th>
                  <th className="py-2 pr-4">Hospitals</th>
                  <th className="py-2 pr-4">Support</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="py-2 pr-4 font-medium text-foreground">{c.name}</td>
                    <td className="py-2 pr-4">{c.claim_settlement_ratio}%</td>
                    <td className="py-2 pr-4">{c.customer_rating} ★</td>
                    <td className="py-2 pr-4">{c.network_hospitals.toLocaleString("en-IN")}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{c.support_availability}</td>
                    <td className="py-2 pr-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setEditing({
                            id: c.id,
                            name: c.name,
                            claim_settlement_ratio: c.claim_settlement_ratio,
                            customer_rating: c.customer_rating,
                            network_hospitals: c.network_hospitals,
                            support_availability: c.support_availability,
                            description: c.description,
                            logo_url: c.logo_url ?? "",
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onDelete(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit company" : "Add company"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Claim settlement ratio (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={editing.claim_settlement_ratio}
                  onChange={(e) =>
                    setEditing({ ...editing, claim_settlement_ratio: +e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Customer rating (0-5)</Label>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={editing.customer_rating}
                  onChange={(e) => setEditing({ ...editing, customer_rating: +e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Network hospitals</Label>
                <Input
                  type="number"
                  min={0}
                  value={editing.network_hospitals}
                  onChange={(e) => setEditing({ ...editing, network_hospitals: +e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Support availability</Label>
                <Input
                  value={editing.support_availability}
                  onChange={(e) =>
                    setEditing({ ...editing, support_availability: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Logo URL (optional)</Label>
                <Input
                  value={editing.logo_url}
                  onChange={(e) => setEditing({ ...editing, logo_url: e.target.value })}
                  placeholder="https://…"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
