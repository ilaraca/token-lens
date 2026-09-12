export type OnChainId = {
  chainId: number;
  contractAddress: string;
};

export function hasCompleteIds(
  onChainId: OnChainId | null | undefined,
  marketAlias: string | null | undefined,
): onChainId is OnChainId {
  if (!onChainId) {
    return false;
  }
  if (!onChainId.contractAddress.trim()) {
    return false;
  }
  if (typeof onChainId.chainId !== "number" || Number.isNaN(onChainId.chainId)) {
    return false;
  }
  if (!marketAlias?.trim()) {
    return false;
  }
  return true;
}
