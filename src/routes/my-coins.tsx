import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SendModal } from "@/components/SendModal";
import { factoryContract } from "@/lib/contract";
import { useCoins } from "@/hooks/useCoins";
import { formatAmount, ipfsToHttp } from "@/lib/format";

export const Route = createFileRoute("/my-coins")({
  head: () => ({
    meta: [
      { title: "My Coins | BOTDERP on BOT Chain" },
      {
        name: "description",
        content:
          "See the memecoins you hold and created on BOT Chain testnet, and send them to any wallet.",
      },
      { property: "og:title", content: "My Coins | BOTDERP on BOT Chain" },
      {
        property: "og:description",
        content: "Your BOT Chain memecoin holdings and creations in one place.",
      },
    ],
  }),
  component: MyCoinsPage,
});

function MyCoinsPage() {
  const { address, isConnected } = useAccount();
  const [sendCoin, setSendCoin] = useState<{ id: bigint; symbol: string } | null>(null);

  const { data: ids } = useReadContract({
    ...factoryContract,
    functionName: "getUserCoins",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const idList = (ids as readonly bigint[] | undefined) ?? [];
  const { coins, isLoading } = useCoins(idList);

  const { data: balances, refetch: refetchBalances } = useReadContracts({
    allowFailure: false,
    contracts: idList.map(
      (id) => ({ ...factoryContract, functionName: "getBalance", args: [id, address!] }) as const,
    ),
    query: { enabled: !!address && idList.length > 0 },
  });

  const rows = coins.map((coin, i) => ({
    coin,
    balance: ((balances as readonly bigint[] | undefined)?.[i] ?? 0n) as bigint,
  }));

  const holding = rows.filter((r) => r.balance > 0n);
  const created = rows.filter(
    (r) => address && r.coin.creator.toLowerCase() === address.toLowerCase(),
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold">
          My <span className="glow-text">coins</span>
        </h1>

        {!isConnected ? (
          <p className="mt-6 text-muted-foreground">
            Connect your wallet to see your holdings.
          </p>
        ) : (
          <Tabs defaultValue="holding" className="mt-6">
            <TabsList>
              <TabsTrigger value="holding">Holding ({holding.length})</TabsTrigger>
              <TabsTrigger value="created">Created ({created.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="holding">
              <CoinRows rows={holding} loading={isLoading} onSend={setSendCoin} />
            </TabsContent>
            <TabsContent value="created">
              <CoinRows rows={created} loading={isLoading} onSend={setSendCoin} />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {sendCoin && (
        <SendModal
          coinId={sendCoin.id}
          symbol={sendCoin.symbol}
          open={!!sendCoin}
          onOpenChange={(v) => !v && setSendCoin(null)}
          onSent={() => void refetchBalances()}
        />
      )}
    </div>
  );
}

function CoinRows({
  rows,
  loading,
  onSend,
}: {
  rows: { coin: ReturnType<typeof useCoins>["coins"][number]; balance: bigint }[];
  loading: boolean;
  onSend: (c: { id: bigint; symbol: string }) => void;
}) {
  if (loading) return <p className="py-6 text-muted-foreground">Loading from chain...</p>;
  if (rows.length === 0) return <p className="py-6 text-muted-foreground">Nothing here yet.</p>;

  return (
    <div className="mt-4 space-y-2">
      {rows.map(({ coin, balance }) => (
        <div key={coin.id.toString()} className="panel flex items-center gap-4 p-3">
          <Link to="/coin/$coinId" params={{ coinId: coin.id.toString() }}>
            {coin.image ? (
              <img
                src={ipfsToHttp(coin.image)}
                alt={`${coin.name} artwork`}
                className="h-14 w-14 border border-border object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center border border-border bg-[var(--surface-2)] text-primary">
                {coin.symbol.slice(0, 3)}
              </div>
            )}
          </Link>
          <Link
            to="/coin/$coinId"
            params={{ coinId: coin.id.toString() }}
            className="flex-1 truncate font-semibold text-primary hover:underline"
          >
            {coin.name} <span className="text-muted-foreground">${coin.symbol}</span>
          </Link>
          <span className="text-sm">{formatAmount(balance)}</span>
          <Button size="sm" onClick={() => onSend({ id: coin.id, symbol: coin.symbol })}>
            Send
          </Button>
        </div>
      ))}
    </div>
  );
}
