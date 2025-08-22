type Net = Record<string, number>; // userId -> cents

export function suggestSettlements(net: Net) {
  const debtors = Object.entries(net)
    .filter(([, n]) => n < 0)
    .map(([u, n]) => ({ u, amt: -n }))
    .sort((a, b) => a.amt - b.amt);
  const creditors = Object.entries(net)
    .filter(([, n]) => n > 0)
    .map(([u, n]) => ({ u, amt: n }))
    .sort((a, b) => a.amt - b.amt);

  const res: Array<{ from: string; to: string; amountCents: number }> = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    res.push({ from: debtors[i].u, to: creditors[j].u, amountCents: pay });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt === 0) i++;
    if (creditors[j].amt === 0) j++;
  }
  return res;
}
