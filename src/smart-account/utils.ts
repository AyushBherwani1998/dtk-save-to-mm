import { randomBytes } from "@noble/hashes/utils";
import { Address, Chain, createPublicClient, http, toHex } from "viem";
import {
  createBundlerClient,
  createPaymasterClient,
} from "viem/account-abstraction";
import { lineaSepolia } from "viem/chains";

export const createSalt = () => toHex(randomBytes(8));

export const publicClient = (chain: Chain) => {
  return createPublicClient({
    chain,
    transport: http(),
  });
};

export const bundlerClient = (chain: Chain) => {
  return createBundlerClient({
    chain,
    transport: http(import.meta.env.VITE_BUNDLER_URL),
  });
};

export const getEthBalance = async (address: Address) => {
  const balance = await publicClient(lineaSepolia).getBalance({
    address,
  });

  return Number(balance) / 10 ** 18;
};

export const paymasterClient = () => {
  return createPaymasterClient({
    transport: http(import.meta.env.VITE_BUNDLER_URL),
  });
};

export const nftAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
    ],
    name: "safeMint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
