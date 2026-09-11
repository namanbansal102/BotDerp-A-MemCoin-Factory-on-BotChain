import { useState } from "react";
import { isAddress } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { factoryContract } from "@/lib/contract";
import { formatAmount } from "@/lib/format";

export function SendModal({
  coinId,
  symbol,
  open,
  onOpenChange,
  onSent,
}: {
  coinId: bigint;
  symbol: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSent?: () => void;
}) {
  const { address } = useAccount();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  const { data: balance, refetch: refetchBalance } = useReadContract({
    ...factoryContract,
    functionName: "getBalance",
    args: address ? [coinId, address] : undefined,
    query: { enabled: !!address && open },
  });

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: confirming } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  const submit = () => {
    if (!isAddress(to)) {
      toast.error("Enter a valid recipient address");
      return;
    }
    let value: bigint;
    try {
      value = BigInt(amount);
    } catch {
      toast.error("Enter a whole number amount");
      return;
    }
    if (value <= 0n) {
      toast.error("Amount must be greater than zero");
      return;
    }
    writeContract(
      {
        ...factoryContract,
        functionName: "transfer",
        args: [coinId, to as `0x${string}`, value],
      },
      {
        onSuccess: () => {
          toast.success(`Sent ${amount} ${symbol}`);
          setTo("");
          setAmount("");
          reset();
          void refetchBalance();
          onSent?.();
          onOpenChange(false);
        },
        onError: (e) => toast.error(e.message.split("\n")[0]),
      },
    );
  };

  const busy = isPending || confirming;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send ${symbol}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount</Label>
              <span className="text-xs text-muted-foreground">
                Balance: {formatAmount(balance as bigint | undefined)}
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                id="amount"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAmount(((balance as bigint | undefined) ?? 0n).toString())}
              >
                Max
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Sending..." : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
