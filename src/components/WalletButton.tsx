import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { shortAddress } from "@/lib/format";
import { botchain } from "@/lib/chain";
import { toast } from "sonner";

export function WalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  if (!isConnected) {
    return (
      <Button
        size="lg"
        className="font-bold uppercase tracking-wide"
        disabled={isPending}
        onClick={() => {
          const connector = connectors[0];
          if (!connector) {
            toast.error("No wallet detected. Install MetaMask to continue.");
            return;
          }
          connect(
            { connector, chainId: botchain.id },
            { onError: (e) => toast.error(e.message) },
          );
        }}
      >
        {isPending ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  if (chainId !== botchain.id) {
    return (
      <Button
        size="lg"
        variant="destructive"
        onClick={() =>
          switchChain(
            { chainId: botchain.id },
            { onError: (e) => toast.error(e.message) },
          )
        }
      >
        Switch to BOT Chain
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      variant="outline"
      className="border-primary text-primary hover:bg-primary/10"
      onClick={() => disconnect()}
    >
      {shortAddress(address)}
    </Button>
  );
}
