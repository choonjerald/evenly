"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatCurrency";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function DashboardSummary() {
    const totals = useQuery(api.functions.expenses.userTotalBalances);

    if (!totals || totals.length === 0) {
        return null;
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {totals.map((t) => {
                const isPositive = t.totalCents > 0;
                const isNegative = t.totalCents < 0;
                const isZero = t.totalCents === 0;

                return (
                    <Card key={t.currency} className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Balance ({t.currency})
                            </CardTitle>
                            {isPositive && <TrendingUp className="h-4 w-4 text-green-600" />}
                            {isNegative && <TrendingDown className="h-4 w-4 text-red-600" />}
                            {isZero && <Minus className="h-4 w-4 text-muted-foreground" />}
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${isPositive ? "text-green-600" : isNegative ? "text-red-600" : ""
                                }`}>
                                {isPositive ? "+" : ""}{formatCurrency(t.totalCents, t.currency)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Across all your groups
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
