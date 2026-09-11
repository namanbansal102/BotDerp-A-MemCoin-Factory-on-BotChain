import { defineChain } from "viem";

export const botchain = defineChain({
  id: 968,
  name: "BOT Chain testnet",
  nativeCurrency: { name: "tBOT", symbol: "tBOT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.bohr.life"] } },
  blockExplorers: { default: { name: "Botscan", url: "https://scan.botchain.ai" } },
});
