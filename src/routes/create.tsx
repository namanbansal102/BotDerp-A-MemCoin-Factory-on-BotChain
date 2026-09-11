import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAccount, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { factoryContract } from "@/lib/contract";
import { ipfsToHttp } from "@/lib/format";
import { uploadImageToIpfs } from "@/lib/pinata.functions";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create a Memecoin on BOT Chain | BOTDERP" },
      {
        name: "description",
        content:
          "Mint your own memecoin on BOT Chain testnet: pick a name, symbol, supply, artwork and socials.",
      },
      { property: "og:title", content: "Create a Memecoin on BOT Chain | BOTDERP" },
      {
        property: "og:description",
        content: "Mint your own memecoin on BOT Chain testnet in a few clicks.",
      },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("");
  const [image, setImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [description, setDescription] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [uploading, setUploading] = useState(false);

  const { writeContract, isPending } = useWriteContract();

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      buffer.forEach((b) => {
        binary += String.fromCharCode(b);
      });
      const res = await uploadImageToIpfs({
        data: {
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          dataBase64: btoa(binary),
        },
      });
      setImage(res.uri);
      setImagePreview(res.url ?? ipfsToHttp(res.uri));
      toast.success("Image uploaded to IPFS");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const valid = name.trim() && symbol.trim() && /^[0-9]+$/.test(supply) && BigInt(supply || "0") > 0n;

  const submit = () => {
    if (!isConnected) {
      toast.error("Connect your wallet first");
      return;
    }
    writeContract(
      {
        ...factoryContract,
        functionName: "createMemecoin",
        args: [
          name.trim(),
          symbol.trim(),
          BigInt(supply),
          image,
          description,
          twitter,
          github,
        ],
      },
      {
        onSuccess: () => {
          toast.success("Coin creation submitted");
          void navigate({ to: "/" });
        },
        onError: (e) => toast.error(e.message.split("\n")[0]),
      },
    );
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold">
          Create <span className="glow-text">Memecoin</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Deployed straight into the MemecoinFactory contract on BOT Chain testnet.
        </p>

        <div className="panel mt-6 space-y-5 p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol *</Label>
              <Input
                id="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supply">Total supply *</Label>
            <Input
              id="supply"
              inputMode="numeric"
              value={supply}
              onChange={(e) => setSupply(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            {uploading && <p className="text-xs text-muted-foreground">Uploading to IPFS...</p>}
            {image && (
              <div className="flex items-center gap-3">
                <img
                  src={imagePreview || ipfsToHttp(image)}
                  alt="Coin artwork preview"
                  className="h-20 w-20 border border-border object-cover"
                />
                <span className="break-all text-xs text-muted-foreground">{image}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter link</Label>
              <Input
                id="twitter"
                placeholder="https://x.com/..."
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub link</Label>
              <Input
                id="github"
                placeholder="https://github.com/..."
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={submit} disabled={!valid || isPending || uploading}>
              {isPending ? "Confirm in wallet..." : "Create coin"}
            </Button>
            <Button variant="ghost" onClick={() => void navigate({ to: "/" })}>
              Cancel
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
