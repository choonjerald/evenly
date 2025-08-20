type SplitParticipant = { userId: string; [key: string]: any };

/**
 * Distributes the remainder of a division deterministically among participants.
 * @param totalAmount - The total amount in minor units.
 * @param numParticipants - The number of participants to split amongst.
 * @returns An array of shares for each participant, with the remainder distributed.
 */
const distributeRemainder = (totalAmount: number, numParticipants: number): number[] => {
  const baseShare = Math.floor(totalAmount / numParticipants);
  let remainder = totalAmount % numParticipants;
  const shares = new Array(numParticipants).fill(baseShare);
  for (let i = 0; i < numParticipants && remainder > 0; i++) {
    shares[i]++;
    remainder--;
  }
  return shares;
};

/**
 * Calculates the shares for an "equal" split.
 * @param totalAmount - The total amount in minor units.
 * @param participants - An array of participants.
 * @returns An array of objects with userId and their calculated share.
 */
export const calculateEqualSplit = (
  totalAmount: number,
  participants: SplitParticipant[]
): { userId: string; share: number }[] => {
  const numParticipants = participants.length;
  if (numParticipants === 0) return [];

  const shares = distributeRemainder(totalAmount, numParticipants);

  return participants.map((p, i) => ({
    userId: p.userId,
    share: shares[i],
  }));
};

/**
 * Calculates the shares for a split by "shares" (weights).
 * @param totalAmount - The total amount in minor units.
 * @param participants - An array of participants, each with a `weight` property.
 * @returns An array of objects with userId and their calculated share.
 */
export const calculateSharesSplit = (
  totalAmount: number,
  participants: (SplitParticipant & { weight: number })[]
): { userId: string; share: number }[] => {
  const numParticipants = participants.length;
  if (numParticipants === 0) return [];

  const totalWeight = participants.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight <= 0) {
    throw new Error("Total weight must be positive.");
  }

  let calculatedShares: { userId: string; share: number }[] = [];
  let runningTotal = 0;

  for (let i = 0; i < numParticipants; i++) {
    const p = participants[i];
    const share = Math.floor((totalAmount * p.weight) / totalWeight);
    calculatedShares.push({ userId: p.userId, share });
    runningTotal += share;
  }

  // Distribute rounding remainder
  let remainder = totalAmount - runningTotal;
  for (let i = 0; i < numParticipants && remainder > 0; i++) {
    calculatedShares[i].share++;
    remainder--;
  }

  return calculatedShares;
};

/**
 * Calculates the shares for a split by "percentage".
 * @param totalAmount - The total amount in minor units.
 * @param participants - An array of participants, each with a `percentage` property.
 * @returns An array of objects with userId and their calculated share.
 */
export const calculatePercentageSplit = (
  totalAmount: number,
  participants: (SplitParticipant & { percentage: number })[]
): { userId: string; share: number }[] => {
  const numParticipants = participants.length;
  if (numParticipants === 0) return [];

  const totalPercentage = participants.reduce((sum, p) => sum + p.percentage, 0);
  if (Math.round(totalPercentage) !== 100) {
    throw new Error("Percentages must sum to 100.");
  }

  let calculatedShares: { userId: string; share: number }[] = [];
  let runningTotal = 0;

  for (let i = 0; i < numParticipants; i++) {
    const p = participants[i];
    const share = Math.floor((totalAmount * p.percentage) / 100);
    calculatedShares.push({ userId: p.userId, share });
    runningTotal += share;
  }

  // Distribute rounding remainder
  let remainder = totalAmount - runningTotal;
  for (let i = 0; i < numParticipants && remainder > 0; i++) {
    calculatedShares[i].share++;
    remainder--;
  }

  return calculatedShares;
};

/**
 * Validates that the shares for a "manual" split sum up to the total amount.
 * @param totalAmount - The total amount in minor units.
 * @param participants - An array of participants, each with a `share` property.
 * @returns The same participants array if valid.
 */
export const validateManualSplit = (
  totalAmount: number,
  participants: (SplitParticipant & { share: number })[]
): { userId: string; share: number }[] => {
  if (participants.length === 0) return [];

  const totalShares = participants.reduce((sum, p) => sum + p.share, 0);
  if (totalShares !== totalAmount) {
    throw new Error(`Manual split amounts must sum to the total of ${totalAmount}.`);
  }
  return participants;
};
