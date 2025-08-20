import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export function ExpenseTable({ groupId }: { groupId: Id<"groups"> }) {
  const expenses = useQuery(api.expenses.list, { groupId });
  const group = useQuery(api.groups.get, { groupId });

  if (expenses === undefined || group === undefined) {
    return <div>Loading expenses...</div>; // Or a skeleton loader
  }

  if (expenses.length === 0) {
    return <p>No expenses to display yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Memo</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Paid By</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow key={expense._id}>
            <TableCell>{format(new Date(expense.paidAt), "PPP")}</TableCell>
            <TableCell>{expense.memo}</TableCell>
            <TableCell>{expense.category?.name || "-"}</TableCell>
            <TableCell>{expense.paidByUser?.name || "Unknown"}</TableCell>
            <TableCell className="text-right">
              {formatCurrency(expense.amount, expense.currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
