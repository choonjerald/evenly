"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { formatCurrency } from "@/lib/formatCurrency";
import { suggestSettlements } from "@/lib/settlements";

export function BalancesTab({ groupId }: { groupId: string }) {
  const net =
    useQuery(api.functions.expenses.balances, { groupId: groupId as any }) ?? {};
  const members =
    useQuery(api.functions.groups.listMembers, { groupId: groupId as any }) ?? [];
  const settlements =
    useQuery(api.functions.settlements.listSettlements, {
      groupId: groupId as any,
    }) ?? [];

  const addSettlement = useMutation(api.functions.settlements.addSettlement);

  const settlement = useMemo(() => suggestSettlements(net), [net]);

  const [settleOpen, setSettleOpen] = useState(false);
  const [settleFrom, setSettleFrom] = useState<string | null>(null);
  const [settleTo, setSettleTo] = useState<string | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>("");
  const [settleNote, setSettleNote] = useState<string>("");

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Balances</h3>
        <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Record settlement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record a settlement</DialogTitle>
            </DialogHeader>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">From (payer)</div>
                <Select
                  value={settleFrom ?? undefined}
                  onValueChange={setSettleFrom}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m: any) => (
                      <SelectItem key={m.user._id} value={m.user._id}>
                        {m.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">To (recipient)</div>
                <Select value={settleTo ?? undefined} onValueChange={setSettleTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m: any) => (
                      <SelectItem key={m.user._id} value={m.user._id}>
                        {m.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Amount</div>
              <Input
                placeholder="e.g. 12.50"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Note (optional)</div>
              <Input
                placeholder="e.g. Revolut transfer"
                value={settleNote}
                onChange={(e) => setSettleNote(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                onClick={async () => {
                  if (!settleFrom || !settleTo) return;
                  const cents = Math.round(parseFloat(settleAmount || "0") * 100);
                  if (cents <= 0) return;
                  await addSettlement({
                    groupId: groupId as any,
                    fromUserId: settleFrom as any,
                    toUserId: settleTo as any,
                    amountCents: cents,
                    note: settleNote || undefined,
                  });
                  setSettleOpen(false);
                  setSettleFrom(null);
                  setSettleTo(null);
                  setSettleAmount("");
                  setSettleNote("");
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Balance cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        {members.map((m: any) => {
          const cents = net[m.user._id] ?? 0;
          return (
            <Card key={m._id} className="p-3 flex items-center justify-between">
              <div className="font-medium">{m.user.name}</div>
              <div className={cents >= 0 ? "text-green-600" : "text-red-600"}>
                {cents >= 0 ? "+" : "-"}
                {formatCurrency(Math.abs(cents), "SGD")}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Suggested settlements */}
      <div className="mt-6">
        <h4 className="font-semibold mb-2">Suggested settlements</h4>
        <div className="space-y-2">
          {settlement.length === 0 && (
            <div className="text-sm text-muted-foreground">Nothing to settle.</div>
          )}
          {settlement.map((s, i) => {
            const from = members.find((m: any) => m.user._id === s.from)?.user;
            const to = members.find((m: any) => m.user._id === s.to)?.user;
            return (
              <Card key={i} className="p-3 flex items-center justify-between">
                <div>
                  {from?.name ?? "Someone"} → {to?.name ?? "Someone"}: {formatCurrency(s.amountCents, "SGD")}
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setSettleFrom(s.from);
                    setSettleTo(s.to);
                    setSettleAmount((s.amountCents / 100).toFixed(2));
                    setSettleNote("");
                    setSettleOpen(true);
                  }}
                >
                  Settle up
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent settlements */}
      <div className="mt-8">
        <h4 className="font-semibold mb-2">Recent settlements</h4>
        <div className="space-y-2">
          {settlements.length === 0 && (
            <div className="text-sm text-muted-foreground">No settlements recorded yet.</div>
          )}
          {settlements.map((s: any) => {
            const from = members.find((m: any) => m.user._id === s.fromUserId)?.user;
            const to = members.find((m: any) => m.user._id === s.toUserId)?.user;
            return (
              <Card key={s._id} className="p-3 flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">{from?.name ?? "Someone"}</span> →{" "}
                  <span className="font-medium">{to?.name ?? "Someone"}</span>:{" "}
                  {formatCurrency(s.amountCents, "SGD")}
                  {s.note ? <span className="text-muted-foreground"> · {s.note}</span> : null}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(s.createdAt).toLocaleString()}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}

