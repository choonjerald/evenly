import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { Id } from '../../../convex/_generated/dataModel';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId') as Id<"groups">;

  if (!groupId) {
    return new NextResponse('Group ID is required', { status: 400 });
  }

  try {
    const expenses = await fetchQuery(api.expenses.list, { groupId });

    if (!expenses) {
      return new NextResponse('No expenses found for this group', { status: 404 });
    }

    // CSV Headers
    const headers = ["Date", "Memo", "Category", "Paid By", "Amount", "Currency", "Participants"].join(',');

    // CSV Rows
    const rows = expenses.map(expense => {
      const date = new Date(expense.paidAt).toLocaleDateString();
      const memo = expense.memo || '';
      const category = expense.category?.name || '';
      const paidBy = expense.paidByUser?.name || '';
      const amount = (expense.amount / 100).toFixed(2); // Convert minor units to major
      const currency = expense.currency;
      const participants = expense.participants.map(p => `${p.user?.name || "Unknown"}:${(p.share / 100).toFixed(2)}`).join(';');

      return `"${date}","${memo}","${category}","${paidBy}","${amount}","${currency}","${participants}"`;
    }).join('\n');

    const csv = `${headers}\n${rows}`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="expenses-${groupId}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    return new NextResponse('Error generating CSV', { status: 500 });
  }
}