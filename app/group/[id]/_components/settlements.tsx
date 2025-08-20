import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export function Settlements({ groupId }: { groupId: Id<"groups"> }) {
  const suggestions = useQuery(api.settlements.suggest, { groupId });
  const group = useQuery(api.groups.get, { groupId });
  const recordPayment = useMutation(api.settlements.recordPayment);

  if (suggestions === undefined || group === undefined) {
    return <div>Loading settlement suggestions...</div>; // Or a skeleton loader
  }

  if (suggestions.length === 0) {
    return <p>No settlements needed at the moment.</p>;
  }

  const handleRecordPayment = async (fromUserId: Id<"users">, toUserId: Id<"users">, amount: number) => {
    try {
      await recordPayment({
        groupId,
        fromUserId,
        toUserId,
        amount,
      });
      toast.success("Payment Recorded!", {
        description: "The payment has been successfully recorded.",
      });
    } catch (error) {
      toast.error("Error recording payment", {
        description: (error as Error).message,
      });
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
      {suggestions.map((s, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>Settle Up</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <span className="font-semibold">{s.fromUser?.name || "Unknown"}</span> owes{' '}
              <span className="font-semibold">{s.toUser?.name || "Unknown"}</span>{' '}
              <span className="font-bold text-lg">
                {formatCurrency(s.amount, group?.homeCurrency || "USD")}
              </span>
            </div>
            <Button
              onClick={() => handleRecordPayment(s.from, s.to, s.amount)}
            >
              Mark as Paid
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
