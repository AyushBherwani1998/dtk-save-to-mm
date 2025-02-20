import {
  createCaveatBuilder,
  createDelegation,
  createRootDelegation,
  DelegationFramework,
  DelegationStruct,
  ExecutionMode,
  ExecutionStruct,
  getDelegationHashOffchain,
  getDeleGatorEnvironment,
  HybridSignatoryConfig,
  Implementation,
  MetaMaskSmartAccount,
  signDelegation,
  SINGLE_DEFAULT_MODE,
  WalletSignatoryConfig,
} from "@metamask-private/delegator-core-viem";
import { Account, Address, Chain, Transport, WalletClient } from "viem";
import { getDelegation, storeDelegation } from "./storage";
import { encodeExecutionData } from "./nft";
import { publicClient } from "./utils";

export const rootDelegation = async (
  delegator: MetaMaskSmartAccount<Implementation>,
  delegate: Address
): Promise<DelegationStruct> => {
  const environment = delegator.environment;
  const caveatBuilder = createCaveatBuilder(environment);

  const caveats = caveatBuilder
    .addCaveat("allowedTargets", [import.meta.env.VITE_NFT_CONTRACT_ADDRESS])
    .addCaveat("allowedMethods", ["safeMint(address)"])
    .addCaveat("limitedCalls", 1)
    .build();

  const delegation = createRootDelegation(delegate, delegator.address, caveats);
  const signature = await delegator.signDelegation({ delegation });

  const signedDelegation = { ...delegation, signature };
  await storeDelegation(signedDelegation);
  return signedDelegation;
};

export const delegation = async (
  delegator: HybridSignatoryConfig,
  delegate: Address,
  chain: Chain
): Promise<DelegationStruct> => {
  const walletClient = (delegator as WalletSignatoryConfig).walletClient;
  const owner = walletClient.account.address;
  const rootDelegation = await getDelegation(owner);
  console.log("Root Delegation", rootDelegation);
  const authority = getDelegationHashOffchain(rootDelegation);

  const delegation = createDelegation(delegate, owner, authority, []);

  const signature = await signDelegation(
    walletClient as WalletClient<Transport, Chain, Account>,
    delegation,
    getDeleGatorEnvironment(chain.id).DelegationManager,
    chain.id
  );

  localStorage.removeItem("guest_account");
  const signedDelegation = { ...delegation, signature };
  await storeDelegation(signedDelegation);
  return signedDelegation;
};

export const redeemDelegation = async (
  redeemer: HybridSignatoryConfig,
  chain: Chain
) => {
  const walletClient = (redeemer as WalletSignatoryConfig).walletClient;
  const addresses = await walletClient.requestAddresses();
  const address = addresses[0];

  const delegation = await getDelegation(address.toLowerCase() as any);
  const rootDelegation = await getDelegation(delegation.delegator);
  console.log(delegation);

  const delegations: DelegationStruct[] = [delegation, rootDelegation];

  const mode: ExecutionMode = SINGLE_DEFAULT_MODE;

  const callData = encodeExecutionData(address);
  console.log("Call Data", callData);

  const executions: ExecutionStruct[] = [
    {
      target: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
      value: BigInt(0),
      callData: callData,
    },
  ];

  const redeemDelegationCalldata = DelegationFramework.encode.redeemDelegations(
    [delegations],
    [mode],
    [executions]
  );

  const transaction = await walletClient.sendTransaction({
    to: getDeleGatorEnvironment(chain.id).DelegationManager,
    data: redeemDelegationCalldata,
    chain,
  });

  const receipt = await publicClient(chain).waitForTransactionReceipt({
    hash: transaction,
  });

  return receipt;
};
