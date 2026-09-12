export function pendingDilutionPercent(
  maxSupplyAmount: number,
  circulating: number,
): number {
  return Number(
    (((maxSupplyAmount - circulating) / maxSupplyAmount) * 100).toFixed(2),
  );
}

export function canComputePendingDilution(
  maxSupplyAmount: number,
  circulating: number,
): boolean {
  return maxSupplyAmount > 0 && circulating <= maxSupplyAmount;
}
