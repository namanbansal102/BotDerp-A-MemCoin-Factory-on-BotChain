import { botchain } from "./chain";

export const MEMECOIN_FACTORY_ADDRESS =
  "0xCFfAe2411155380deED474ebeB772760d9104718" as const;

export const memecoinFactoryAbi = [
  {
    type: "function",
    name: "createMemecoin",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_name", type: "string" },
      { name: "_symbol", type: "string" },
      { name: "_totalSupply", type: "uint256" },
      { name: "_image", type: "string" },
      { name: "_description", type: "string" },
      { name: "_twitter", type: "string" },
      { name: "_github", type: "string" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "cloneMemecoin",
    stateMutability: "payable",
    inputs: [
      { name: "_originalCoinId", type: "uint256" },
      { name: "_newName", type: "string" },
      { name: "_newSymbol", type: "string" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_coinId", type: "uint256" },
      { name: "_to", type: "address" },
      { name: "_amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "getCoin",
    stateMutability: "view",
    inputs: [{ name: "_coinId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "totalSupply", type: "uint256" },
          { name: "image", type: "string" },
          { name: "description", type: "string" },
          { name: "twitter", type: "string" },
          { name: "github", type: "string" },
          { name: "creator", type: "address" },
          { name: "clonedFrom", type: "uint256" },
          { name: "createdAt", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getAllCoinIds",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256[]" }],
  },
  {
    type: "function",
    name: "getUserCoins",
    stateMutability: "view",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [{ type: "uint256[]" }],
  },
  {
    type: "function",
    name: "getBalance",
    stateMutability: "view",
    inputs: [
      { name: "_coinId", type: "uint256" },
      { name: "_user", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "holderCount",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "cloneCount",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "cloneFee",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
] as const;

export const factoryContract = {
  address: MEMECOIN_FACTORY_ADDRESS,
  abi: memecoinFactoryAbi,
  chainId: botchain.id,
} as const;

export type Memecoin = {
  name: string;
  symbol: string;
  totalSupply: bigint;
  image: string;
  description: string;
  twitter: string;
  github: string;
  creator: `0x${string}`;
  clonedFrom: bigint;
  createdAt: bigint;
};

export const explorerTxUrl = (hash: string) =>
  `${botchain.blockExplorers.default.url}/tx/${hash}`;

export const explorerAddressUrl = (address: string) =>
  `${botchain.blockExplorers.default.url}/address/${address}`;
