import { useChain } from "@cosmos-kit/react";
import { useAccount as useWagmiAccount } from "wagmi";

import { EVM_WALLET_LOGOS, INJECTED_EVM_WALLET_LOGOS } from "@/constants/wagmi";
import { useChainByID } from "@/hooks/useChains";

export function useAccount(chainID: string) {
  const { data: chain } = useChainByID(chainID);

  const cosmosChain = useChain(
    chain && chain.chainType === "cosmos" ? chain.chainName : "cosmoshub",
  );

  const wagmiAccount = useWagmiAccount();

  if (chain?.chainType === "evm") {
    return {
      address: wagmiAccount.address,
      isWalletConnected: wagmiAccount.isConnected,
      wallet: wagmiAccount.connector
        ? {
            walletName: wagmiAccount.connector.id,
            walletPrettyName: wagmiAccount.connector.name,
            walletInfo: {
              logo:
                wagmiAccount.connector.id === "injected"
                  ? INJECTED_EVM_WALLET_LOGOS[wagmiAccount.connector.name]
                  : EVM_WALLET_LOGOS[wagmiAccount.connector.id],
            },
          }
        : undefined,
    };
  }

  return {
    address: cosmosChain.address,
    isWalletConnected: cosmosChain.isWalletConnected,
    wallet: cosmosChain.wallet
      ? {
          walletName: cosmosChain.wallet.name,
          walletPrettyName: cosmosChain.wallet.prettyName,
          walletInfo: {
            logo: cosmosChain.wallet.logo,
          },
        }
      : undefined,
  };
}
