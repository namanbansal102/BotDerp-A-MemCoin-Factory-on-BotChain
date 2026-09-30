import { Link } from "@tanstack/react-router";
import { WalletButton } from "@/components/WalletButton";
import { botchain } from "@/lib/chain";

const navClass = "text-sm font-medium text-muted-foreground hover:text-foreground";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
            <img src="/logo.png" alt="BOTDERP" className="h-full w-full rounded-full object-cover" />
          </span>
          <span className="text-xl font-bold tracking-tight">
            BOT<span className="glow-text">DERP</span>
          </span>
        </Link>

        <nav className="flex items-center gap-5">
          <Link
            to="/"
            className={navClass}
            activeProps={{ className: "text-sm font-medium text-foreground underline" }}
            activeOptions={{ exact: true }}
          >
            Board
          </Link>
          <Link
            to="/create"
            className={navClass}
            activeProps={{ className: "text-sm font-medium text-foreground underline" }}
          >
            Create
          </Link>
          <Link
            to="/my-coins"
            className={navClass}
            activeProps={{ className: "text-sm font-medium text-foreground underline" }}
          >
            My coins
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden border border-primary/60 px-3 py-1.5 text-sm font-semibold text-primary sm:inline">
            {botchain.name}
          </span>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
