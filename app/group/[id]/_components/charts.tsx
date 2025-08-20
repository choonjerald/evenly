import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { formatCurrency } from "@/lib/utils";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function Charts({ groupId }: { groupId: Id<"groups"> }) {
  const expenses = useQuery(api.expenses.list, { groupId });
  const group = useQuery(api.groups.get, { groupId });

  if (expenses === undefined || group === undefined) {
    return <div>Loading charts...</div>; // Or a skeleton loader
  }

  if (expenses.length === 0) {
    return <p>No expenses to display charts for yet.</p>;
  }

  // Prepare data for Category Spend Chart
  const categorySpendData = expenses.reduce((acc, expense) => {
    const categoryName = expense.category?.name || "Uncategorized";
    acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categorySpendData).map(([name, value]) => ({
    name,
    value,
  }));

  // Prepare data for Spend by Person Chart
  const personSpendData = expenses.reduce((acc, expense) => {
    const paidByName = expense.paidByUser?.name || "Unknown";
    acc[paidByName] = (acc[paidByName] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const personChartData = Object.entries(personSpendData).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Spend by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value, group?.homeCurrency || "USD")}/>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spend by Person</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={personChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis formatter={(value: number) => formatCurrency(value, group?.homeCurrency || "USD")}/>
              <Tooltip formatter={(value: number) => formatCurrency(value, group?.homeCurrency || "USD")}/>
              <Legend />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
