import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Search, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { CoinCard } from "@/components/CoinCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllCoinIds, useCoins } from "@/hooks/useCoins";
import { botchain } from "@/lib/chain";
import { formatAmount, shortAddress } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BOTDERP — Memecoin Launchpad on BOT Chain Testnet" },
      {
        name: "description",
        content:
          "Create, clone and send memecoins on BOT Chain testnet. Every coin, holder and balance lives on-chain in one factory contract.",
      },
      { property: "og:title", content: "BOTDERP — Memecoin Launchpad on BOT Chain Testnet" },
      {
        property: "og:description",
        content: "Create, clone and send memecoins on BOT Chain testnet.",
      },
    ],
  }),
  component: Board,
});

function Board() {
  const { data: ids, isLoading: idsLoading } = useAllCoinIds();
  const idList = useMemo(
    () => [...(((ids as readonly bigint[] | undefined) ?? []) as readonly bigint[])].reverse(),
    [ids],
  );
  const { coins, isLoading } = useCoins(idList);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? coins.filter(
          (c) =>
            c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q),
        )
      : coins;
    const sorted = [...filtered];
    if (sort === "holders") sorted.sort((a, b) => Number(b.holders - a.holders));
    if (sort === "cloned") sorted.sort((a, b) => Number(b.clones - a.clones));
    return sorted;
  }, [coins, query, sort]);

  const totalSupply = coins.reduce((acc, c) => acc + c.totalSupply, 0n);
  const totalHolders = coins.reduce((acc, c) => acc + c.holders, 0n);
  const totalClones = coins.reduce((acc, c) => acc + c.clones, 0n);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {coins.length > 0 && (
        <div className="overflow-hidden border-b border-border bg-[var(--surface)]">
          <div className="ticker-track flex w-max gap-3 py-2">
            {[...coins, ...coins].map((c, i) => (
              <span
                key={`${c.id}-${i}`}
                className="whitespace-nowrap border border-border px-3 py-1 text-xs"
              >
                <span className="text-primary">{c.name}</span> ${c.symbol} ·{" "}
                {c.holders.toString()} holders · {shortAddress(c.creator)}
              </span>
            ))}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="Coins deployed" value={coins.length.toString()} />
            <StatBox label="Total supply" value={formatAmount(totalSupply)} />
            <StatBox label="Holder entries" value={totalHolders.toString()} />
            <StatBox label="Clones" value={totalClones.toString()} />
          </div>
          <Link to="/create" className="lg:w-72">
            <Button
              size="lg"
              className="h-full w-full text-xl font-bold uppercase shadow-[var(--shadow-glow)]"
            >
              Create Token
            </Button>
          </Link>
        </section>

        <section className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for token"
              className="h-12 pl-9"
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-12 sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="holders">Most holders</SelectItem>
              <SelectItem value="cloned">Most cloned</SelectItem>
            </SelectContent>
          </Select>
        </section>

        <section className="mt-6">
          <h1 className="mb-4 inline-block bg-primary px-4 py-2 text-xl font-bold text-primary-foreground">
            Now trending
          </h1>

          {(idsLoading || isLoading) && (
            <p className="text-muted-foreground">Loading coins from BOT Chain...</p>
          )}

          {!idsLoading && !isLoading && visible.length === 0 && (
            <div className="panel p-8 text-center">
              <p className="text-muted-foreground">
                No memecoins have been created in this contract yet.
              </p>
              <Link to="/create">
                <Button className="mt-4">Create the first one</Button>
              </Link>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((coin) => (
              <CoinCard key={coin.id.toString()} coin={coin} />
            ))}
          </div>
        </section>

        <section className="mt-20 border-y border-border py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Built for creators
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Launch something people can actually hold.
            </h2>
            <p className="mt-4 text-muted-foreground">
              BOTDERP keeps the important parts transparent: coins, balances, holders, and clone
              history are read from the MemecoinFactory contract on {botchain.name}.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <FeatureStep
              icon={<Sparkles className="h-5 w-5" />}
              title="Create"
              text="Choose a name, ticker, supply, artwork, and story, then confirm the transaction in your wallet."
            />
            <FeatureStep
              icon={<WalletCards className="h-5 w-5" />}
              title="Collect"
              text="Browse live coins and keep track of what your wallet holds as balances move on-chain."
            />
            <FeatureStep
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Stay verifiable"
              text="Artwork uses IPFS and contract activity can be checked directly on the BOT Chain explorer."
            />
          </div>

          <Link to="/create" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Start a new coin <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}

function FeatureStep({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="panel p-5">
      <div className="flex h-9 w-9 items-center justify-center bg-primary text-primary-foreground">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
