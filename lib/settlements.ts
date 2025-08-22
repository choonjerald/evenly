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


type UserId = string;
export function computeWeightedShares(
  participants: UserId[],
  weights: Record<UserId, number> | undefined,
  amountCents: number
): Record<UserId, number> {
  if (participants.length === 0) return {};
  const ws = Object.fromEntries(
    participants.map((u) => [u, Math.max(0, weights?.[u] ?? 1)])
  );
  const totalWeight = participants.reduce((s, u) => s + ws[u], 0);
  if (totalWeight <= 0) {
    const equal = Math.floor(amountCents / participants.length);
    const result: Record<UserId, number> = Object.fromEntries(participants.map(u => [u, equal]));
    let leftover = amountCents - equal * participants.length;
    for (let i = 0; i < leftover; i++) result[participants[i]] += 1;
    return result;
  }
  const rows = participants.map((u) => {
    const quota = (amountCents * ws[u]) / totalWeight;
    const floor = Math.floor(quota);
    const remainder = quota - floor;
    return { u, floor, remainder };
  });
  const sumFloors = rows.reduce((s, r) => s + r.floor, 0);
  let leftover = amountCents - sumFloors;
  rows.sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    return a.u < b.u ? -1 : a.u > b.u ? 1 : 0;
  });
  for (let i = 0; i < leftover; i++) rows[i].floor += 1;
  const shares: Record<UserId, number> = {};
  for (const r of rows) shares[r.u] = r.floor;
  return shares;
}
