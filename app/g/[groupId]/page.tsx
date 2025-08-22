"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, User, Scale, Receipt } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { Plus, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import { suggestSettlements, computeWeightedShares } from "@/lib/settlements";


function initials(name?: string) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b || a).toUpperCase();
}

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();

  const expenses = useQuery(api.functions.expenses.listExpenses, { groupId: groupId as any }) ?? [];
  const net = useQuery(api.functions.expenses.balances, { groupId: groupId as any }) ?? {};
  const members = useQuery(api.functions.groups.listMembers, { groupId: groupId as any }) ?? [];
  const me = useQuery(api.auth.getMe) as any; // user doc or null

  const addExpense = useMutation(api.functions.expenses.addExpense);
  const updateExpense = useMutation(api.functions.expenses.updateExpense);
  const deleteExpenseMut = useMutation(api.functions.expenses.deleteExpense);
  const createInvite = useMutation(api.functions.groups.createInvite);

  // Create/Edit dialog state
  const [open, setOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState<string | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [mode, setMode] = useState<"equal" | "weights">("equal");
  const [weights, setWeights] = useState<Record<string, number>>({});

  // Details sheet
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsExpense, setDetailsExpense] = useState<any | null>(null);

  // Delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  const settlement = useMemo(() => suggestSettlements(net), [net]);
  const memberOptions = members.map((m: any) => ({ id: m.user._id, name: m.user.name }));
  const userMap = useMemo(
    () => Object.fromEntries(members.map((m: any) => [m.user._id, m.user])),
    [members]
  );

  function resetForm() {
    setEditingExpense(null);
    setDesc("");
    setAmount("");
    setPayer(null);
    setParticipants([]);
    setWeights({});
    setMode("equal");
  }

  function openEdit(e: any) {
    setEditingExpense(e);
    setDesc(e.description);
    setAmount((e.amountCents / 100).toFixed(2));
    setPayer(e.payerId);
    setParticipants(e.participants ?? []);
    if (e.weights && Object.keys(e.weights).length > 0) {
      setMode("weights");
      setWeights(e.weights);
    } else {
      setMode("equal");
      setWeights({});
    }
    setOpen(true);
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
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
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> {editingExpense ? "Edit expense" : "Add expense"}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingExpense ? "Edit expense" : "Add expense"}</DialogTitle>
                </DialogHeader>

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

                  {/* Participants multi-select */}
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
                      const w =
                        mode === "weights"
                          ? Object.fromEntries(participants.map((id) => [id, weights[id] || 1]))
                          : {};

                      if (editingExpense) {
                        await updateExpense({
                          expenseId: editingExpense._id,
                          description: desc,
                          amountCents,
                          currency: "SGD",
                          payerId: payer as any,
                          participants: participants as any,
                          weights: w, // empty {} means equal
                        });
                      } else {
                        await addExpense({
                          groupId: groupId as any,
                          payerId: payer as any,
                          amountCents,
                          currency: "SGD",
                          description: desc,
                          participants: participants as any,
                          weights: mode === "weights" ? w : undefined,
                        });
                      }

                      setOpen(false);
                      resetForm();
                    }}
                  >
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {expenses.length === 0 ? (
            <div className="text-sm text-muted-foreground">No expenses yet.</div>
          ) : (
            <Table>
              <TableCaption>Recent expenses</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead className="whitespace-nowrap">Split</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Your share</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e: any) => {
                  const payerName = userMap[e.payerId]?.name ?? "Unknown";
                  const pList: string[] = e.participants ?? [];
                  const splitType = e.weights ? "Weighted" : "Equal";
                  const shares = computeWeightedShares(pList, e.weights as any, e.amountCents);
                  const yourShare = me && pList.includes(me._id) ? shares[me._id] ?? 0 : null;

                  return (
                    <TableRow key={e._id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(e.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{e.description}</TableCell>
                      <TableCell>{payerName}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {pList.map((uid) => {
                            const name = userMap[uid]?.name ?? "User";
                            const w = e.weights ? (e.weights as any)[uid] ?? 1 : 1;
                            return (
                              <Badge key={uid} variant="secondary">
                                {name}{e.weights ? ` · w${w}` : ""}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={e.weights ? "default" : "outline"}>{splitType}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(e.amountCents, e.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {yourShare == null ? "—" : formatCurrency(yourShare, e.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Open row actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setDetailsExpense(e);
                                setDetailsOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(e)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                setToDeleteId(e._id);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* DETAILS SHEET */}
          <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
            <SheetContent className="sm:max-w-xl p-0">
              {detailsExpense ? (
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-6 pr-16 md:pr-20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-white/90">
                        <Receipt className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-wide">Expense</span>
                      </div>
                      <span className="text-xs text-white/70 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(detailsExpense.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h2 className="mt-2 text-2xl font-semibold leading-tight">
                      {detailsExpense.description}
                    </h2>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <div className="text-4xl font-bold">
                        {formatCurrency(detailsExpense.amountCents, detailsExpense.currency)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-xs">
                          {detailsExpense.weights ? (
                            <span className="inline-flex items-center gap-1">
                              <Scale className="h-3.5 w-3.5" /> Weighted
                            </span>
                          ) : (
                            "Equal split"
                          )}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-xs">
                          <Users className="h-3.5 w-3.5 mr-1" />
                          {(detailsExpense.participants ?? []).length} participant
                          {(detailsExpense.participants ?? []).length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-6 py-5 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
                    {/* Payer */}
                    <section>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Payer
                      </div>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const payerUser = userMap[detailsExpense.payerId];
                          return (
                            <>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={payerUser?.avatarUrl} alt={payerUser?.name} />
                                <AvatarFallback>{initials(payerUser?.name)}</AvatarFallback>
                              </Avatar>
                              <div className="leading-tight">
                                <div className="font-medium">
                                  {payerUser?.name ?? "Unknown"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  credited {formatCurrency(detailsExpense.amountCents, detailsExpense.currency)}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </section>

                    <Separator />

                    {/* Participants & shares */}
                    <section>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Participants & shares
                      </div>

                      {(() => {
                        const pList: string[] = detailsExpense.participants ?? [];
                        const shares = computeWeightedShares(
                          pList,
                          detailsExpense.weights as any,
                          detailsExpense.amountCents
                        );
                        return (
                          <div className="space-y-3">
                            {pList.map((uid) => {
                              const u = userMap[uid];
                              const share = shares[uid] ?? 0;
                              const pct = detailsExpense.amountCents
                                ? Math.round((share / detailsExpense.amountCents) * 100)
                                : 0;
                              const w =
                                detailsExpense.weights ? (detailsExpense.weights as any)[uid] ?? 1 : 1;

                              return (
                                <div
                                  key={uid}
                                  className="rounded-xl border bg-card p-3 shadow-sm"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={u?.avatarUrl} alt={u?.name} />
                                        <AvatarFallback>{initials(u?.name)}</AvatarFallback>
                                      </Avatar>
                                      <div className="leading-tight">
                                        <div className="font-medium">{u?.name ?? "User"}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {detailsExpense.weights ? `weight ${w}` : "equal share"}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <div className="font-semibold">
                                        {formatCurrency(share, detailsExpense.currency)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">{pct}% of total</div>
                                    </div>
                                  </div>

                                  <div className="mt-2">
                                    <Progress value={pct} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </section>
                  </div>
                </div>
              ) : (
                // Fallback skeleton if detailsExpense is not set
                <div className="p-6 space-y-3">
                  <div className="h-6 w-40 bg-muted rounded" />
                  <div className="h-10 w-64 bg-muted rounded" />
                  <div className="h-24 bg-muted rounded" />
                </div>
              )}
            </SheetContent>
          </Sheet>


          {/* DELETE CONFIRM */}
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={async () => {
                    if (toDeleteId) await deleteExpenseMut({ expenseId: toDeleteId as any });
                    setDeleteOpen(false);
                    setToDeleteId(null);
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
              {settlement.length === 0 && (
                <div className="text-sm text-muted-foreground">Nothing to settle.</div>
              )}
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
                if (!invite) {
                  alert("Could not create invite. Please try again.");
                  return;
                }
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
