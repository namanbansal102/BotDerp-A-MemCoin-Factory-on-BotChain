import { useState } from "react";
import { formatEther } from "viem";
import { useReadContract, useWriteContract } from "wagmi";
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

export function CloneModal({
  coinId,
  open,
  onOpenChange,
  onCloned,
}: {
  coinId: bigint;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCloned?: () => void;
}) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");

  const { data: fee } = useReadContract({
    ...factoryContract,
    functionName: "cloneFee",
    query: { enabled: open },
  });

  const { writeContract, isPending } = useWriteContract();

  const submit = () => {
    if (!name.trim() || !symbol.trim()) {
      toast.error("New name and symbol are required");
      return;
    }
    writeContract(
      {
        ...factoryContract,
        functionName: "cloneMemecoin",
        args: [coinId, name.trim(), symbol.trim()],
        value: (fee as bigint | undefined) ?? 0n,
      },
      {
        onSuccess: () => {
          toast.success("Clone transaction submitted");
          setName("");
          setSymbol("");
          onCloned?.();
          onOpenChange(false);
        },
        onError: (e) => toast.error(e.message.split("\n")[0]),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone this coin</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clone-name">New name</Label>
            <Input id="clone-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clone-symbol">New symbol</Label>
            <Input
              id="clone-symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
          </div>
          <div className="panel px-3 py-2 text-sm">
            Clone fee:{" "}
            <span className="font-semibold text-primary">
              {fee !== undefined ? `${formatEther(fee as bigint)} tBOT` : "..."}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Confirming..." : "Confirm & pay fee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
