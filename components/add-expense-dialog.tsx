import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/utils";

type SplitMode = "equal" | "shares" | "percentage" | "manual";

export function AddExpenseDialog({
  groupId,
  children,
}: { groupId: Id<"groups">; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [memo, setMemo] = useState("");
  const [categoryId, setCategoryId] = useState<Id<"categories"> | undefined>(undefined);
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [participants, setParticipants] = useState<{
    userId: Id<"users">;
    weight?: number;
    percentage?: number;
    share?: number;
    checked: boolean;
  }[]>([]);

  const addExpense = useMutation(api.expenses.add);
  const groupMembers = useQuery(api.members.get, { groupId });
  const categories = useQuery(api.categories.list, { groupId });

  // Initialize participants when groupMembers data is available
  useState(() => {
    if (groupMembers) {
      setParticipants(
        groupMembers.map((member) => ({
          userId: member.userId,
          checked: true,
          weight: 1,
          percentage: 0,
          share: 0,
        }))
      );
    }
  }, [groupMembers]);

  const handleParticipantCheck = (userId: Id<"users">, checked: boolean) => {
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, checked } : p))
    );
  };

  const handleWeightChange = (userId: Id<"users">, weight: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, weight } : p))
    );
  };

  const handlePercentageChange = (userId: Id<"users">, percentage: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, percentage } : p))
    );
  };

  const handleShareChange = (userId: Id<"users">, share: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, share } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountInMinorUnits = Math.round(parseFloat(amount) * 100);
    const selectedParticipants = participants.filter(p => p.checked);

    if (selectedParticipants.length === 0) {
        toast.error("Error", {
            description: "Please select at least one participant.",
        });
        return;
    }

    try {
      await addExpense({
        groupId,
        paidAt: new Date(paidAt).getTime(),
        amount: amountInMinorUnits,
        currency,
        memo,
        categoryId,
        splitMode,
        participants: selectedParticipants.map(p => ({
            userId: p.userId,
            weight: p.weight,
            percentage: p.percentage,
            share: p.share,
        })),
      });
      toast.success("Expense added!", {
        description: `Expense of ${formatCurrency(amountInMinorUnits, currency)} added.`,
      });
      setOpen(false);
      // Reset form
      setPaidAt(new Date().toISOString().split("T")[0]);
      setAmount("");
      setMemo("");
      setCategoryId(undefined);
      setSplitMode("equal");
      setParticipants(prev => prev.map(p => ({ ...p, checked: true, weight: 1, percentage: 0, share: 0 })));
    } catch (error) {
      toast.error("Error adding expense", {
        description: (error as Error).message,
      });
    }
  };

  const totalPercentage = participants.filter(p => p.checked).reduce((sum, p) => sum + (p.percentage || 0), 0);
  const totalManualShare = participants.filter(p => p.checked).reduce((sum, p) => sum + (p.share || 0), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>Record a new expense for this group.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paidAt" className="text-right">Date</Label>
              <Input id="paidAt" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">Amount</Label>
              <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">Currency</Label>
              <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="memo" className="text-right">Memo</Label>
              <Input id="memo" value={memo} onChange={(e) => setMemo(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <Select onValueChange={(value: Id<"categories">) => setCategoryId(value)} value={categoryId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(category => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.emoji} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Split</Label>
              <Tabs value={splitMode} onValueChange={(value) => setSplitMode(value as SplitMode)} className="col-span-3">
                <TabsList>
                  <TabsTrigger value="equal">Equal</TabsTrigger>
                  <TabsTrigger value="shares">Shares</TabsTrigger>
                  <TabsTrigger value="percentage">Percentage</TabsTrigger>
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="col-span-4">
              <h4 className="mb-2 text-lg font-semibold">Participants</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {participants.map((p) => {
                  const member = groupMembers?.find(m => m.userId === p.userId);
                  return member ? (
                    <div key={p.userId} className="flex items-center space-x-2">
                      <Checkbox
                        id={`participant-${p.userId}`}
                        checked={p.checked}
                        onCheckedChange={(checked: boolean) => handleParticipantCheck(p.userId, checked)}
                      />
                      <Label htmlFor={`participant-${p.userId}`}>{member.user?.name || "Unknown"}</Label>
                      {p.checked && splitMode === "shares" && (
                        <Input
                          type="number"
                          value={p.weight}
                          onChange={(e) => handleWeightChange(p.userId, parseInt(e.target.value))}
                          className="w-20"
                          placeholder="Weight"
                        />
                      )}
                      {p.checked && splitMode === "percentage" && (
                        <Input
                          type="number"
                          step="0.01"
                          value={p.percentage}
                          onChange={(e) => handlePercentageChange(p.userId, parseFloat(e.target.value))}
                          className="w-20"
                          placeholder="%"
                        />
                      )}
                      {p.checked && splitMode === "manual" && (
                        <Input
                          type="number"
                          step="0.01"
                          value={p.share ? (p.share / 100).toFixed(2) : ""}
                          onChange={(e) => handleShareChange(p.userId, Math.round(parseFloat(e.target.value) * 100))}
                          className="w-24"
                          placeholder="Amount"
                        />
                      )}
                    </div>
                  ) : null;
                })}
              </div>
              {splitMode === "percentage" && p.checked && (
                <p className={`text-sm mt-2 ${totalPercentage !== 100 ? "text-red-500" : "text-green-500"}`}>
                  Total Percentage: {totalPercentage.toFixed(2)}%
                </p>
              )}
              {splitMode === "manual" && p.checked && (
                <p className={`text-sm mt-2 ${totalManualShare !== Math.round(parseFloat(amount) * 100) ? "text-red-500" : "text-green-500"}`}>
                  Total Manual Share: {formatCurrency(totalManualShare, currency)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add Expense</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
