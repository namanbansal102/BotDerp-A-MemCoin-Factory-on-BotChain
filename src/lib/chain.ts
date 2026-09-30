import { defineChain } from "viem";

const botchainRpcUrl = import.meta.env.VITE_BOTCHAIN_RPC_URL ?? "https://rpc.botchain.ai";

export const botchain = defineChain({
  id: 677,
  name: "BOT Chain Mainnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: { default: { http: [botchainRpcUrl] } },
  blockExplorers: { default: { name: "Botscan", url: "https://scan.botchain.ai" } },
});
