import { Address, encodeFunctionData } from "viem";
import { nftAbi, publicClient } from "./utils";
import { lineaSepolia } from "viem/chains";

export const encodeExecutionData = (to: Address) =>
  encodeFunctionData({
    abi: nftAbi,
    functionName: "safeMint",
    args: [to],
  });

export const getNFTBalance = async (address: Address): Promise<bigint> => {
  const balance = await publicClient(lineaSepolia).readContract({
    address: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
    abi: nftAbi,
    functionName: "balanceOf",
    args: [address],
  });

  return balance as bigint;
};
