import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "../../../lib/utils";

export function Balances({ groupId }: { groupId: Id<"groups"> }) {
  const balances = useQuery(api.settlements.getBalances, { groupId });
  const group = useQuery(api.groups.get, { groupId });

  if (balances === undefined || group === undefined) {
    return <div>Loading balances...</div>; // Or a skeleton loader
  }

  if (balances.length === 0) {
    return <p>No balances to display yet.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {balances.map((balance) => (
        <Card key={balance.userId}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {balance.user?.name || "Unknown User"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                balance.balance < 0 ? "text-red-500" : "text-green-500"
              }`}
            >
              {formatCurrency(balance.balance, group?.homeCurrency || "USD")}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
