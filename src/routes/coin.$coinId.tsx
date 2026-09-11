import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Github, Send, Copy as CopyIcon, ExternalLink, Twitter } from "lucide-react";
import { toast } from "sonner";
import { useAccount, useReadContract } from "wagmi";
import { SiteHeader } from "@/components/SiteHeader";
import { SendModal } from "@/components/SendModal";
import { CloneModal } from "@/components/CloneModal";
import { Button } from "@/components/ui/button";
import { useCoin } from "@/hooks/useCoins";
import { explorerAddressUrl, factoryContract, MEMECOIN_FACTORY_ADDRESS } from "@/lib/contract";
import { formatAmount, ipfsToHttp, shortAddress, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/coin/$coinId")({
  head: () => ({
    meta: [
      { title: "Memecoin details | BOTDERP on BOT Chain" },
      {
        name: "description",
        content:
          "Supply, holders, clones and creator details for a memecoin deployed on BOT Chain Mainnet.",
      },
      { property: "og:title", content: "Memecoin details | BOTDERP on BOT Chain" },
      {
        property: "og:description",
        content: "Live on-chain stats for this BOT Chain Mainnet memecoin.",
      },
    ],
  }),
  component: CoinDetailPage,
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-xl font-bold text-primary">{value}</div>
    </div>
  );
}

function CoinDetailPage() {
  const { coinId } = Route.useParams();
  const id = BigInt(coinId);
  const { address } = useAccount();
  const { coin, holders, clones, isLoading, refetch } = useCoin(id);
  const [sendOpen, setSendOpen] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);

  const { data: balance } = useReadContract({
    ...factoryContract,
    functionName: "getBalance",
    args: address ? [id, address] : undefined,
    query: { enabled: !!address },
  });

  const { coin: original } = useCoin(
    coin && coin.clonedFrom > 0n ? coin.clonedFrom : undefined,
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {isLoading && <p className="text-muted-foreground">Loading from chain...</p>}
        {!isLoading && (!coin || coin.creator === "0x0000000000000000000000000000000000000000") && (
          <p className="text-muted-foreground">This coin does not exist.</p>
        )}

        {coin && coin.creator !== "0x0000000000000000000000000000000000000000" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-6 sm:flex-row">
              {coin.image ? (
                <img
                  src={ipfsToHttp(coin.image)}
                  alt={`${coin.name} token artwork`}
                  className="h-56 w-56 border border-border object-cover"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center border border-border bg-[var(--surface-2)] text-4xl font-bold text-primary">
                  {coin.symbol.slice(0, 4)}
                </div>
              )}

              <div className="flex-1 space-y-3">
                <h1 className="text-3xl font-bold">
                  {coin.name}{" "}
                  <span className="text-lg text-muted-foreground">${coin.symbol}</span>
                </h1>
                <p className="text-sm text-muted-foreground">{timeAgo(coin.createdAt)}</p>
                {coin.description && <p className="text-sm">{coin.description}</p>}

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    Creator: {shortAddress(coin.creator)}
                  </span>
                  <button
                    type="button"
                    aria-label="Copy creator address"
                    onClick={() => {
                      void navigator.clipboard.writeText(coin.creator);
                      toast.success("Address copied");
                    }}
                  >
                    <Copy className="h-4 w-4 hover:text-primary" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {coin.twitter && (
                    <a
                      href={coin.twitter}
                      target="_blank"
                      rel="noreferrer"
                      className="panel px-3 py-1.5 text-sm hover:border-primary"
                    >
                      <Twitter className="mr-1 inline h-4 w-4" /> Twitter
                    </a>
                  )}
                  {coin.github && (
                    <a
                      href={coin.github}
                      target="_blank"
                      rel="noreferrer"
                      className="panel px-3 py-1.5 text-sm hover:border-primary"
                    >
                      <Github className="mr-1 inline h-4 w-4" /> GitHub
                    </a>
                  )}
                  {coin.clonedFrom > 0n && (
                    <Link
                      to="/coin/$coinId"
                      params={{ coinId: coin.clonedFrom.toString() }}
                      className="border border-primary/60 px-3 py-1.5 text-sm text-primary"
                    >
                      Cloned from {original ? original.name : `#${coin.clonedFrom}`}
                    </Link>
                  )}
                  {clones !== undefined && clones > 0n && (
                    <span className="border border-primary/60 px-3 py-1.5 text-sm text-primary">
                      {clones.toString()} clones
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Total supply" value={formatAmount(coin.totalSupply)} />
              <Stat label="Holders" value={holders?.toString() ?? "-"} />
              <Stat
                label="Your balance"
                value={formatAmount((balance as bigint | undefined) ?? 0n)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setSendOpen(true)}>
                <Send className="mr-2 h-4 w-4" /> Send
              </Button>
              <Button variant="secondary" onClick={() => setCloneOpen(true)}>
                <CopyIcon className="mr-2 h-4 w-4" /> Clone
              </Button>
              <a
                href={explorerAddressUrl(MEMECOIN_FACTORY_ADDRESS)}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" /> View on explorer
                </Button>
              </a>
            </div>

            <SendModal
              coinId={id}
              symbol={coin.symbol}
              open={sendOpen}
              onOpenChange={setSendOpen}
              onSent={refetch}
            />
            <CloneModal
              coinId={id}
              open={cloneOpen}
              onOpenChange={setCloneOpen}
              onCloned={refetch}
            />
          </div>
        )}
      </main>
    </div>
  );
}
