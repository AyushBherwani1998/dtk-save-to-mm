import { useEffect, useState } from "react";
import "./App.css";
import { lineaSepolia } from "viem/chains";
import {
  HybridSignatoryConfig,
  Implementation,
  MetaMaskSmartAccount,
} from "@metamask-private/delegator-core-viem";
import { createGuestSignatoryFactory } from "./signers/guestSigner";
import { createInjectedProviderSignatoryFactory } from "./signers/injectedSigner";
import {
  delegation,
  redeemDelegation,
  rootDelegation,
} from "./smart-account/delegation";
import { createLocalSignatoryFactory } from "./signers/localSigner";
import { createSmartAccount } from "./smart-account/smart-account";

const App = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [guestAccount, setGuestAccount] =
    useState<HybridSignatoryConfig | null>(null);
  const [injectedAccount, setInjectedAccount] =
    useState<HybridSignatoryConfig | null>(null);
  const [dAppOwnerSmartAccount, setDappOwnerSmartAccount] =
    useState<MetaMaskSmartAccount<Implementation> | null>(null);

  const [dappOwnerAddress, setDappOwnerAddress] = useState<string | null>(null);
  const [guestAddress, setGuestAddress] = useState<string | null>(null);
  const [metamaskAddress, setMetamaskAddress] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const shortenAddress = (address: string | null) => {
    return address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : "Not connected";
  };

  useEffect(() => {
    const createDappOwner = async () => {
      const dAppOwner = createLocalSignatoryFactory({
        chain: lineaSepolia,
      });
      const smartAccount = await createSmartAccount(dAppOwner, lineaSepolia);
      setDappOwnerSmartAccount(smartAccount);
      setDappOwnerAddress(smartAccount.address);
    };
    createDappOwner();
  }, []);

  const handleGuestLogin = async () => {
    setIsLoading(true);
    const guest = createGuestSignatoryFactory({
      chain: lineaSepolia,
    });
    const { owner, signatory } = await guest.login();
    console.log("Guest Account:", { owner, signatory });
    setGuestAccount(signatory);
    setGuestAddress(owner);
    setStep(2);
    setIsLoading(false);
  };

  const handleSaveToMetamask = async () => {
    setIsLoading(true);
    const injected = createInjectedProviderSignatoryFactory({
      chain: lineaSepolia,
    });
    const { owner, signatory } = await injected.login();
    console.log("Injected Account:", { owner, signatory });
    await delegation(guestAccount!, owner, lineaSepolia);
    setInjectedAccount(signatory);
    setMetamaskAddress(owner);
    setStep(4);
    setIsLoading(false);
  };

  const handleRootDelegation = async () => {
    setIsLoading(true);
    await rootDelegation(
      dAppOwnerSmartAccount!,
      guestAddress! as `0x${string}`
    );
    setStep(3);
    setIsLoading(false);
  };

  const handleMintNFT = async () => {
    setIsLoading(true);
    const hash = await redeemDelegation(injectedAccount!, lineaSepolia);
    setTransactionHash(hash);
    setStep(5);
    setIsLoading(false);
  };
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Gator Guest Account</h1>
      </header>
      <main className="app-main">
        <div className="card">
          <div className="address-container">
            <div className="address-item">
              <span className="address-label">DApp Owner:</span>
              <span className="address">
                {shortenAddress(dappOwnerAddress)}
              </span>
            </div>
            <div className="address-item">
              <span className="address-label">Guest:</span>
              <span className="address">{shortenAddress(guestAddress)}</span>
            </div>
            <div className="address-item">
              <span className="address-label">MetaMask:</span>
              <span className="address">{shortenAddress(metamaskAddress)}</span>
            </div>
          </div>
          <div className="action-container">
            {step === 1 && (
              <button
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="action-button"
              >
                {isLoading ? "Logging in..." : "Guest Login"}
              </button>
            )}
            {step === 2 && (
              <button
                onClick={handleRootDelegation}
                disabled={isLoading}
                className="action-button"
              >
                {isLoading ? "Delegating..." : "Delegate to Guest"}
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleSaveToMetamask}
                disabled={isLoading}
                className="action-button"
              >
                {isLoading ? "Saving..." : "Save to MetaMask"}
              </button>
            )}
            {step === 4 && (
              <button
                onClick={handleMintNFT}
                disabled={isLoading}
                className="action-button"
              >
                {isLoading ? "Minting..." : "Mint NFT"}
              </button>
            )}
            {step === 5 && (
              <div className="success-container">
                <p className="success-message">NFT Minted Successfully!</p>
                {transactionHash && (
                  <a
                    href={`https://sepolia.lineascan.build/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transaction-link"
                  >
                    View Transaction
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
