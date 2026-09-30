import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { botchain } from "./chain";

export const wagmiConfig = createConfig({
  chains: [botchain],
  connectors: [injected()],
  transports: {
    [botchain.id]: http(botchain.rpcUrls.default.http[0]),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
