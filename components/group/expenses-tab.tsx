"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, User, Scale, Receipt, Plus } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

import { formatCurrency } from "@/lib/formatCurrency";
import { computeWeightedShares, computeSharesFromItems } from "@/lib/settlements";
import { ExpenseActions } from "@/components/group/expense-actions";
import { toast } from "sonner";

function initials(name?: string) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b || a).toUpperCase();
}

export function ExpensesTab({ groupId }: { groupId: string }) {
  const expenses =
    useQuery(api.functions.expenses.listExpenses, { groupId: groupId as any }) ?? [];
  const members =
    useQuery(api.functions.groups.listMembers, { groupId: groupId as any }) ?? [];
  const me = useQuery(api.auth.getMe) as any;

  const addExpense = useMutation(api.functions.expenses.addExpense);
  const updateExpense = useMutation(api.functions.expenses.updateExpense);
  const deleteExpenseMut = useMutation(api.functions.expenses.deleteExpense);
  const generateUploadUrl = useMutation(api.functions.expenses.generateUploadUrl);
  const scanReceipt = useAction(api.functions.receipt.scanReceipt);

  // Create/Edit dialog state
  const [open, setOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [desc, setDesc] = useState("");
  const [payer, setPayer] = useState<string | null>(null);
  const [items, setItems] = useState<
    { description: string; amount: string; assignedTo: string[] }[]
  >([{ description: "", amount: "", assignedTo: [] }]);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptStorageId, setReceiptStorageId] = useState<Id<"_storage"> | null>(
    null
  );

  // Details sheet
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsExpense, setDetailsExpense] = useState<any | null>(null);

  // Delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  const memberOptions = members.map((m: any) => ({ id: m.user._id, name: m.user.name }));
  const userMap = useMemo(
    () => Object.fromEntries(members.map((m: any) => [m.user._id, m.user])),
    [members]
  );

  const totalAmountCents = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Math.round(parseFloat(item.amount || "0") * 100),
        0
      ),
    [items]
  );
  const perMemberTotals = useMemo(() => {
    const valid = items
      .map((item) => ({
        priceCents: Math.round(parseFloat(item.amount || "0") * 100),
        assignedTo: item.assignedTo,
      }))
      .filter((it) => it.priceCents > 0 && it.assignedTo.length > 0);
    return computeSharesFromItems(valid).weights;
  }, [items]);

  function resetForm() {
    setEditingExpense(null);
    setDesc("");
    setPayer(null);
    setItems([{ description: "", amount: "", assignedTo: [] }]);
    setReceipt(null);
    setReceiptStorageId(null);
  }

  function openEdit(e: any) {
    setEditingExpense(e);
    setDesc(e.description);
    setPayer(e.payerId);
    setItems(
      (e.items ?? []).map((it: any) => ({
        description: it.description,
        amount: (it.priceCents / 100).toFixed(2),
        assignedTo: it.assignedTo ?? [],
      }))
    );
    setReceipt(null);
    setReceiptStorageId(e.receiptStorageId ?? null);
    setOpen(true);
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Expenses</h3>
        <Dialog
          open={open}
          onOpenChange={(v: boolean) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="hidden md:inline-flex">
              <Plus className="mr-2 h-4 w-4" />
              {editingExpense ? "Edit expense" : "Add expense"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Edit expense" : "Add expense"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <Input
                placeholder="Description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
              <Select
                value={payer ?? undefined}
                onValueChange={(v: string) => setPayer(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payer" />
                </SelectTrigger>
                <SelectContent>
                  {memberOptions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div>
                <div className="mb-2 text-sm font-medium">Receipt (optional)</div>
                <Input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] ?? null;
                    setReceipt(file);
                    if (!file) {
                      setReceiptStorageId(null);
                      return;
                    }
                    const postUrl = await generateUploadUrl();
                    const result = await fetch(postUrl, {
                      method: "POST",
                      headers: { "Content-Type": file.type },
                      body: file,
                    });
                    const { storageId } = await result.json();
                    setReceiptStorageId(storageId as Id<"_storage">);
                    try {
                      const res = await scanReceipt({
                        receiptStorageId: storageId as Id<"_storage">,
                      });
                      setItems(
                        res.items.map((it: any) => ({
                          description: it.description,
                          amount: (it.priceCents / 100).toFixed(2),
                          assignedTo: [],
                        }))
                      );
                    } catch (err: any) {
                      const message =
                        err instanceof Error && err.message === "OCR_API_KEY not configured"
                          ? "OCR is not configured; please enter items manually"
                          : "OCR failed; please enter items manually";
                      toast.error(message);
                      setItems([{ description: "", amount: "", assignedTo: [] }]);
                    }
                  }}
                />
                {receipt && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(receipt)}
                      alt="Receipt preview"
                      className="w-full h-auto rounded-md"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="border p-2 rounded-md space-y-2">
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx] = { ...newItems[idx], description: e.target.value };
                        setItems(newItems);
                      }}
                    />
                    <Input
                      placeholder="Amount"
                      inputMode="decimal"
                      value={item.amount}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx] = { ...newItems[idx], amount: e.target.value };
                        setItems(newItems);
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      {memberOptions.map((m) => {
                        const active = item.assignedTo.includes(m.id);
                        return (
                          <Button
                            key={m.id}
                            type="button"
                            variant={active ? "default" : "outline"}
                            onClick={() => {
                              const newItems = [...items];
                              const assigned = new Set(newItems[idx].assignedTo);
                              if (assigned.has(m.id)) assigned.delete(m.id);
                              else assigned.add(m.id);
                              newItems[idx] = {
                                ...newItems[idx],
                                assignedTo: Array.from(assigned),
                              };
                              setItems(newItems);
                            }}
                          >
                            {m.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setItems([...items, { description: "", amount: "", assignedTo: [] }])
                  }
                >
                  Add item
                </Button>
              </div>

              <div className="mt-4 space-y-1">
                <div className="font-medium">Per-member totals</div>
                {Object.entries(perMemberTotals).map(([uid, cents]) => (
                  <div key={uid} className="flex justify-between text-sm">
                    <span>{memberOptions.find((m) => m.id === uid)?.name ?? uid}</span>
                    <span>{formatCurrency(cents, "SGD")}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmountCents, "SGD")}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={async () => {
                  if (!payer || items.length === 0) return;

                  let storageId = receiptStorageId;
                  if (receipt && !storageId) {
                    const postUrl = await generateUploadUrl();
                    const result = await fetch(postUrl, {
                      method: "POST",
                      headers: { "Content-Type": receipt.type },
                      body: receipt,
                    });
                    const { storageId: sid } = await result.json();
                    storageId = sid as Id<"_storage">;
                  }

                  const payloadItems = items.map((it) => ({
                    description: it.description,
                    priceCents: Math.round(parseFloat(it.amount || "0") * 100),
                    assignedTo: it.assignedTo as any,
                  }));

                  if (editingExpense) {
                    await updateExpense({
                      expenseId: editingExpense._id,
                      description: desc,
                      payerId: payer as any,
                      currency: "SGD",
                      items: payloadItems,
                      receiptStorageId: storageId ?? undefined,
                    });
                  } else {
                    await addExpense({
                      groupId: groupId as any,
                      payerId: payer as any,
                      currency: "SGD",
                      description: desc,
                      items: payloadItems,
                      receiptStorageId: storageId ?? undefined,
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
        <>
          {/* Mobile: card list */}
          <div className="md:hidden space-y-2">
            {expenses.map((e: any) => {
              const payerName = userMap[e.payerId]?.name ?? "Unknown";
              const pList: string[] = e.participants ?? [];
              const splitType = e.weights ? "Weighted" : "Equal";
              const shares = computeWeightedShares(
                pList,
                e.weights as any,
                e.amountCents
              );
              const yourShare =
                me && pList.includes(me._id) ? shares[me._id] ?? 0 : null;

              return (
                <Card key={e._id} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{e.description}</div>
                      <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                        <span>{new Date(e.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>by {payerName}</span>
                        <span>•</span>
                        <span className="inline-flex items-center rounded-full border px-1.5 py-0.5">
                          {splitType}
                        </span>
                      </div>

                      {/* Participants avatars */}
                      <div className="mt-2 flex items-center gap-1 -space-x-2">
                        {pList.slice(0, 4).map((uid) => (
                          <Avatar
                            key={uid}
                            className="h-6 w-6 ring-2 ring-background"
                          >
                            <AvatarImage
                              src={userMap[uid]?.avatarUrl}
                              alt={userMap[uid]?.name}
                            />
                            <AvatarFallback>
                              {(userMap[uid]?.name?.[0] ?? "U").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {pList.length > 4 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            +{pList.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-semibold">
                        {formatCurrency(e.amountCents, e.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {yourShare == null
                          ? ""
                          : `You: ${formatCurrency(yourShare, e.currency)}`}
                      </div>

                      {/* Row actions */}
                      <div className="mt-2">
                        <ExpenseActions
                          onView={() => {
                            setDetailsExpense(e);
                            setDetailsOpen(true);
                          }}
                          onEdit={() => openEdit(e)}
                          onDelete={() => {
                            setToDeleteId(e._id);
                            setDeleteOpen(true);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block">
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
                  <TableHead className="text-right whitespace-nowrap">
                    Your share
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e: any) => {
                  const payerName = userMap[e.payerId]?.name ?? "Unknown";
                  const pList: string[] = e.participants ?? [];
                  const splitType = e.weights ? "Weighted" : "Equal";
                  const shares = computeWeightedShares(
                    pList,
                    e.weights as any,
                    e.amountCents
                  );
                  const yourShare =
                    me && pList.includes(me._id) ? shares[me._id] ?? 0 : null;

                  return (
                    <TableRow key={e._id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(e.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {e.description}
                      </TableCell>
                      <TableCell>{payerName}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {pList.map((uid) => {
                            const name = userMap[uid]?.name ?? "User";
                            const w = e.weights ? (e.weights as any)[uid] ?? 1 : 1;
                            return (
                              <Badge key={uid} variant="secondary">
                                {name}
                                {e.weights ? ` · w${w}` : ""}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={e.weights ? "default" : "outline"}>
                          {splitType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(e.amountCents, e.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {yourShare == null
                          ? "—"
                          : formatCurrency(yourShare, e.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <ExpenseActions
                          onView={() => {
                            setDetailsExpense(e);
                            setDetailsOpen(true);
                          }}
                          onEdit={() => openEdit(e)}
                          onDelete={() => {
                            setToDeleteId(e._id);
                            setDeleteOpen(true);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
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
                    <span className="text-xs uppercase tracking-wide">
                      Expense
                    </span>
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
                    {formatCurrency(
                      detailsExpense.amountCents,
                      detailsExpense.currency
                    )}
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
                      {(detailsExpense.participants ?? []).length === 1
                        ? ""
                        : "s"}
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
                            <AvatarImage
                              src={payerUser?.avatarUrl}
                              alt={payerUser?.name}
                            />
                            <AvatarFallback>
                              {initials(payerUser?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">
                            {payerUser?.name ?? "Unknown"}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </section>

                <Separator />

                {/* Participants */}
                <section>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Participants
                  </div>
                  <div className="space-y-2">
                    {(detailsExpense.participants ?? []).map((uid: string) => {
                      const u = userMap[uid];
                      const w = detailsExpense.weights
                        ? (detailsExpense.weights as any)[uid] ?? 1
                        : 1;
                      const totalWeight = detailsExpense.weights
                        ? (
                            Object.values(
                              detailsExpense.weights as Record<string, number>
                            ) as number[]
                          ).reduce((a, b) => a + b, 0)
                        : detailsExpense.participants?.length || 1;
                      const pct = detailsExpense.weights
                        ? (w / totalWeight) * 100
                        : 100 / (detailsExpense.participants?.length || 1);
                      return (
                        <div key={uid} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u?.avatarUrl} alt={u?.name} />
                            <AvatarFallback>{initials(u?.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">{u?.name ?? "User"}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              {detailsExpense.weights ? (
                                <>
                                  <span>Weight {w}</span>
                                  <span>•</span>
                                  <span>{pct.toFixed(1)}%</span>
                                </>
                              ) : (
                                <span>{pct.toFixed(1)}%</span>
                              )}
                            </div>
                            <Progress value={pct} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <Separator />

                {/* Receipt */}
                {detailsExpense.receiptStorageId && (
                  <section>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Receipt
                    </div>
                    <img
                      src={detailsExpense.receiptUrl}
                      alt="Receipt"
                      className="w-full h-auto rounded-md"
                    />
                  </section>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              expense.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!toDeleteId) return;
                await deleteExpenseMut({ expenseId: toDeleteId as any });
                setDeleteOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

