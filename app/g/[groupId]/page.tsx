"use client";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/formatCurrency";
import { suggestSettlements } from "@/lib/settlements";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const expenses = useQuery(api.functions.expenses.listExpenses, { groupId: groupId as any }) ?? [];
  const net = useQuery(api.functions.expenses.balances, { groupId: groupId as any }) ?? {};
  const members = useQuery(api.functions.groups.listMembers, { groupId: groupId as any }) ?? [];
  const addExpense = useMutation(api.functions.expenses.addExpense);
  const createInvite = useMutation(api.functions.groups.createInvite);

  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState<string | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [mode, setMode] = useState<"equal" | "weights">("equal");
  const [weights, setWeights] = useState<Record<string, number>>({});

  const settlement = useMemo(() => suggestSettlements(net), [net]);

  const memberOptions = members.map((m: any) => ({ id: m.user._id, name: m.user.name }));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Expenses */}
        <TabsContent value="expenses" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Expenses</h3>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add expense</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add expense</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
                  <Input placeholder="Amount (e.g. 12.50)" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <Select value={payer ?? undefined} onValueChange={(v) => setPayer(v)}>
                    <SelectTrigger><SelectValue placeholder="Payer" /></SelectTrigger>
                    <SelectContent>
                      {memberOptions.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* simple participants multi-select (checkbox-like) */}
                  <div>
                    <div className="mb-2 text-sm font-medium">Participants</div>
                    <div className="flex flex-wrap gap-2">
                      {memberOptions.map((m) => {
                        const active = participants.includes(m.id);
                        return (
                          <Button
                            key={m.id}
                            type="button"
                            variant={active ? "default" : "outline"}
                            onClick={() => {
                              setParticipants((prev) =>
                                active ? prev.filter((x) => x !== m.id) : [...prev, m.id]
                              );
                            }}
                          >
                            {m.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                    <SelectTrigger><SelectValue placeholder="Split mode" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">Equal split</SelectItem>
                      <SelectItem value="weights">Weighted</SelectItem>
                    </SelectContent>
                  </Select>

                  {mode === "weights" && (
                    <div className="space-y-2">
                      {participants.map((id) => (
                        <div key={id} className="flex items-center gap-2">
                          <div className="w-32 text-sm">{memberOptions.find((m) => m.id === id)?.name}</div>
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            value={weights[id] ?? 1}
                            onChange={(e) => setWeights({ ...weights, [id]: Number(e.target.value) })}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={async () => {
                      if (!payer || participants.length === 0) return;
                      const amountCents = Math.round(parseFloat(amount) * 100);
                      const w = mode === "weights"
                        ? Object.fromEntries(participants.map((id) => [id, weights[id] || 1]))
                        : undefined;
                      await addExpense({
                        groupId: groupId as any,
                        payerId: payer as any,
                        amountCents,
                        currency: "SGD",
                        description: desc,
                        participants: participants as any,
                        weights: w,
                      });
                      setOpen(false); setDesc(""); setAmount(""); setPayer(null); setParticipants([]); setWeights({});
                    }}
                  >
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {expenses.map((e: any) => (
              <Card key={e._id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{e.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="font-semibold">{formatCurrency(e.amountCents, e.currency)}</div>
              </Card>
            ))}
            {expenses.length === 0 && (
              <div className="text-sm text-muted-foreground">No expenses yet.</div>
            )}
          </div>
        </TabsContent>

        {/* Balances */}
        <TabsContent value="balances" className="mt-6">
          <div className="grid sm:grid-cols-2 gap-3">
            {members.map((m: any) => {
              const cents = net[m.user._id] ?? 0;
              return (
                <Card key={m._id} className="p-3 flex items-center justify-between">
                  <div className="font-medium">{m.user.name}</div>
                  <div className={cents >= 0 ? "text-green-600" : "text-red-600"}>
                    {cents >= 0 ? "+" : "-"}{formatCurrency(Math.abs(cents), "SGD")}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-6">
            <h4 className="font-semibold mb-2">Suggested settlements</h4>
            <div className="space-y-2">
              {settlement.length === 0 && <div className="text-sm text-muted-foreground">Nothing to settle.</div>}
              {settlement.map((s, i) => {
                const from = members.find((m: any) => m.user._id === s.from)?.user?.name ?? "Someone";
                const to = members.find((m: any) => m.user._id === s.to)?.user?.name ?? "Someone";
                return (
                  <Card key={i} className="p-3">
                    {from} → {to}: {formatCurrency(s.amountCents, "SGD")}
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="mt-6">
          <div className="space-y-2">
            {members.map((m: any) => (
              <Card key={m._id} className="p-3 flex items-center justify-between">
                <div className="font-medium">{m.user.name}</div>
                <div className="text-xs text-muted-foreground">{m.role}</div>
              </Card>
            ))}
          </div>

          <div className="mt-6">
            <Button
              onClick={async () => {
                const invite = await createInvite({ groupId: groupId as any });
                const url = `${window.location.origin}/join/${invite.code}`;
                await navigator.clipboard.writeText(url);
                alert("Invite link copied: " + url);
              }}
            >
              Copy invite link
            </Button>
          </div>
        </TabsContent>

        {/* Settings (skeleton) */}
        <TabsContent value="settings" className="mt-6">
          <div className="text-sm text-muted-foreground">Settings coming soon.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
