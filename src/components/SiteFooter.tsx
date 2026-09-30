import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { botchain } from "@/lib/chain";
import { explorerAddressUrl, MEMECOIN_FACTORY_ADDRESS } from "@/lib/contract";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-[var(--surface)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Link to="/" className="inline-flex items-center gap-2 text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <img src="/logo.png" alt="BOTDERP" className="h-full w-full rounded-full object-cover" />
            </span>
            BOT<span className="glow-text">DERP</span>
          </Link>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            A live memecoin launchpad for creating, cloning, and sending tokens on BOT Chain Mainnet.
            Coin data stays on-chain; artwork is stored on IPFS.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground">Explore</h2>
          <div className="mt-3 flex flex-col items-start gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Board</Link>
            <Link to="/create" className="hover:text-foreground">Create a coin</Link>
            <Link to="/my-coins" className="hover:text-foreground">My coins</Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground">Network</h2>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>{botchain.name}</p>
            <a
              href={explorerAddressUrl(MEMECOIN_FACTORY_ADDRESS)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Factory contract <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Built for BOT Chain Mainnet.</span>
          <span>Chain ID {botchain.id}</span>
        </div>
      </div>
    </footer>
  );
}
