import { Link } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import type { CoinWithStats } from "@/hooks/useCoins";
import { formatAmount, ipfsToHttp, shortAddress, timeAgo } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 border border-border bg-[var(--surface-2)] px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-primary">{value}</div>
    </div>
  );
}

export function CoinCard({ coin }: { coin: CoinWithStats }) {
  return (
    <div className="panel p-4 transition-colors hover:border-primary/60">
      <div className="flex items-start justify-between gap-2">
        <Link
          to="/coin/$coinId"
          params={{ coinId: coin.id.toString() }}
          className="truncate text-lg font-bold text-primary hover:underline"
        >
          {coin.name}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ${coin.symbol}
          </span>
        </Link>
        <span className="shrink-0 text-xs text-muted-foreground">
          {timeAgo(coin.createdAt)}
        </span>
      </div>

      <div className="mt-3 flex gap-3">
        <Link to="/coin/$coinId" params={{ coinId: coin.id.toString() }}>
          {coin.image ? (
            <img
              src={ipfsToHttp(coin.image)}
              alt={`${coin.name} token artwork`}
              loading="lazy"
              className="h-24 w-24 shrink-0 border border-border object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center border border-border bg-[var(--surface-2)] text-2xl font-bold text-primary">
              {coin.symbol.slice(0, 3).toUpperCase()}
            </div>
          )}
        </Link>
        <div className="flex flex-1 gap-2">
          <Stat label="Supply" value={formatAmount(coin.totalSupply)} />
          <Stat label="Holders" value={coin.holders.toString()} />
          <Stat label="Clones" value={coin.clones.toString()} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>by: {shortAddress(coin.creator)}</span>
        <button
          type="button"
          aria-label="Copy creator address"
          onClick={() => {
            void navigator.clipboard.writeText(coin.creator);
            toast.success("Address copied");
          }}
        >
          <Copy className="h-3.5 w-3.5 hover:text-primary" />
        </button>
        {coin.clonedFrom > 0n && (
          <span className="ml-auto border border-primary/50 px-2 py-0.5 text-primary">
            clone of #{coin.clonedFrom.toString()}
          </span>
        )}
      </div>
    </div>
  );
}
