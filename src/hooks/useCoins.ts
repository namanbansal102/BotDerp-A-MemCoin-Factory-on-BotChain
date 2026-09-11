import { useReadContract, useReadContracts } from "wagmi";
import { factoryContract, type Memecoin } from "@/lib/contract";

export type CoinWithStats = Memecoin & {
  id: bigint;
  holders: bigint;
  clones: bigint;
};

export function useAllCoinIds() {
  return useReadContract({
    ...factoryContract,
    functionName: "getAllCoinIds",
  });
}

export function useCoins(ids?: readonly bigint[]) {
  const list = ids ?? [];

  const { data, isLoading, refetch } = useReadContracts({
    allowFailure: false,
    contracts: list.flatMap((id) => [
      { ...factoryContract, functionName: "getCoin", args: [id] } as const,
      { ...factoryContract, functionName: "holderCount", args: [id] } as const,
      { ...factoryContract, functionName: "cloneCount", args: [id] } as const,
    ]),
    query: { enabled: list.length > 0 },
  });

  const coins: CoinWithStats[] = [];
  if (data) {
    list.forEach((id, i) => {
      const coin = data[i * 3] as unknown as Memecoin;
      coins.push({
        ...coin,
        id,
        holders: data[i * 3 + 1] as unknown as bigint,
        clones: data[i * 3 + 2] as unknown as bigint,
      });
    });
  }

  return { coins, isLoading, refetch };
}

export function useCoin(id?: bigint) {
  const coin = useReadContract({
    ...factoryContract,
    functionName: "getCoin",
    args: id !== undefined ? [id] : undefined,
    query: { enabled: id !== undefined },
  });
  const holders = useReadContract({
    ...factoryContract,
    functionName: "holderCount",
    args: id !== undefined ? [id] : undefined,
    query: { enabled: id !== undefined },
  });
  const clones = useReadContract({
    ...factoryContract,
    functionName: "cloneCount",
    args: id !== undefined ? [id] : undefined,
    query: { enabled: id !== undefined },
  });

  return {
    coin: coin.data as Memecoin | undefined,
    holders: holders.data as bigint | undefined,
    clones: clones.data as bigint | undefined,
    isLoading: coin.isLoading,
    refetch: () => {
      void coin.refetch();
      void holders.refetch();
      void clones.refetch();
    },
  };
}
