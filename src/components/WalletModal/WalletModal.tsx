import { useManager } from "@cosmos-kit/react";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid";
import { ArrowLeftIcon, FaceFrownIcon } from "@heroicons/react/20/solid";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import Image from "next/image";
import toast from "react-hot-toast";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import { chainIdToName } from "@/chains/types";
import { DialogContent } from "@/components/Dialog";
import { trackWallet } from "@/context/track-wallet";
import { useChainByID } from "@/hooks/useChains";
import { cn } from "@/utils/ui";
import { gracefullyConnect } from "@/utils/wallet";

import { AdaptiveLink } from "../AdaptiveLink";
import { useWalletModal } from "./context";
import { useTotalWallets, WalletListItem } from "./WalletListItem";

export interface MinimalWallet {
  walletName: string;
  walletPrettyName: string;
  walletInfo: {
    logo?: string | { major: string; minor: string };
  };
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isWalletConnected: boolean;
}

interface Props {
  chainType: string;
  wallets: MinimalWallet[];
  onClose: () => void;
}

export function WalletModal({ chainType, onClose, wallets }: Props) {
  const { context } = useWalletModal();

  async function onWalletConnect(wallet: MinimalWallet) {
    await wallet.connect();
    onClose();
  }

  const totalWallets = useTotalWallets();

  return (
    <div className="flex h-full flex-col px-6 pb-2 pt-6">
      <div className="relative">
        <button
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-neutral-100",
            "absolute inset-y-0 left-0",
          )}
          onClick={onClose}
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <p className="text-center text-xl font-bold">
          Connect {context && <span className="capitalize">{context}</span>} Wallet
        </p>
      </div>
      {totalWallets < 1 && (
        <div className="flex flex-col items-center space-y-4 py-16 text-center">
          <FaceFrownIcon className="h-16 w-16 text-gray-500" />
          <h4 className="text-center font-medium">No Wallets Available</h4>
          <p className="text-sm text-neutral-600 lg:px-8">
            Please install or enable your preferred wallet extension.
            <br />
            <AdaptiveLink
              href={
                chainType === "cosmos"
                  ? "https://cosmos.network/wallets"
                  : "https://ethereum.org/en/wallets/find-wallet"
              }
              className="inline-flex items-center gap-1 text-red-500 hover:underline"
            >
              <span>Explore available wallets</span>
              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
            </AdaptiveLink>
          </p>
        </div>
      )}
      <ScrollArea.Root
        className={cn(
          "relative isolate flex-grow overflow-hidden",
          "before:absolute before:inset-x-0 before:bottom-0 before:z-10 before:h-2",
          "before:bg-gradient-to-t before:from-white before:to-transparent",
        )}
      >
        <ScrollArea.Viewport className="h-full w-full py-4">
          {wallets.map((wallet) => (
            <WalletListItem
              key={wallet.walletName}
              chainType={chainType}
              walletName={wallet.walletName}
              className={cn(
                "group relative mb-2 data-[unsupported=true]:opacity-30",
                "data-[unsupported=true]:before:absolute data-[unsupported=true]:before:inset-0 data-[unsupported=true]:before:cursor-not-allowed",
              )}
            >
              <button
                className="flex w-full items-center gap-2 rounded-lg p-2 transition-colors focus:-outline-offset-2 group-hover:bg-[#FF486E]/20"
                onClick={() => onWalletConnect(wallet)}
              >
                {wallet.walletInfo.logo && (
                  <Image
                    height={36}
                    width={36}
                    alt={wallet.walletPrettyName}
                    className="h-9 w-9 object-contain"
                    src={
                      typeof wallet.walletInfo.logo === "string" ? wallet.walletInfo.logo : wallet.walletInfo.logo.major
                    }
                    aria-hidden="true"
                  />
                )}
                <p className="flex-1 text-left font-semibold">
                  {wallet.walletPrettyName === "Leap Cosmos MetaMask"
                    ? "Metamask (Leap Snap)"
                    : wallet.walletPrettyName}
                </p>
              </button>
              {wallet.isWalletConnected && (
                <button
                  aria-label={`Disconnect ${wallet.walletPrettyName}`}
                  className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg bg-[#FF486E]/20 px-2.5 py-1 text-xs font-semibold text-[#FF486E] transition-colors focus:outline-none group-hover:bg-[#FF486E]/30"
                  onClick={async (event) => {
                    event.stopPropagation();
                    await wallet.disconnect();
                    context && trackWallet.untrack(context);
                    onClose();
                  }}
                >
                  Disconnect
                </button>
              )}
            </WalletListItem>
          ))}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="z-20 flex touch-none select-none py-4 transition-colors ease-out data-[orientation=horizontal]:h-2 data-[orientation=vertical]:w-2 data-[orientation=horizontal]:flex-col"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="relative flex-1 rounded-[10px] bg-neutral-500/50 transition-colors before:absolute before:left-1/2 before:top-1/2 before:h-2 before:w-2 before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] hover:bg-neutral-500" />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner />
      </ScrollArea.Root>
    </div>
  );
}

function WalletModalWithContext() {
  const { connector: currentConnector } = useAccount();
  const { chainID, context } = useWalletModal();
  const { disconnectAsync } = useDisconnect();
  const { connectors, connectAsync } = useConnect({
    mutation: {
      onError: (err) => {
        toast.error(
          <p>
            <strong>Failed to connect!</strong>
            <br />
            {err.name}: {err.message}
          </p>,
        );
      },
    },
  });
  const { getWalletRepo } = useManager();

  const { setIsOpen } = useWalletModal();

  const { data: chain } = useChainByID(chainID);

  if (!chain) {
    return null;
  }

  const { chainType } = chain;

  let wallets: MinimalWallet[] = [];

  if (chainType === "cosmos") {
    const chainName = chainIdToName[chainID];
    const walletRepo = getWalletRepo(chainName);
    wallets = walletRepo.wallets.map((wallet) => ({
      walletName: wallet.walletName,
      walletPrettyName: wallet.walletPrettyName,
      walletInfo: {
        logo: wallet.walletInfo.logo,
      },
      connect: async () => {
        try {
          await gracefullyConnect(wallet);
          context && trackWallet.track(context, chainID, wallet.walletName, chainType);
        } catch (error) {
          console.error(error);
          context && trackWallet.untrack(context);
        }
      },
      disconnect: async () => {
        await wallet.disconnect();
        context && trackWallet.untrack(context);
      },
      isWalletConnected: wallet.isWalletConnected,
    }));
  }

  if (chainType === "evm") {
    for (const connector of connectors) {
      if (wallets.findIndex((wallet) => wallet.walletName === connector.id) !== -1) {
        continue;
      }

      const minimalWallet: MinimalWallet = {
        walletName: connector.id,
        walletPrettyName: connector.name,
        walletInfo: {
          logo: connector.icon,
        },
        connect: async () => {
          if (connector.id === currentConnector?.id) return;
          try {
            await connectAsync({ connector, chainId: Number(chainID) });
            context && trackWallet.track(context, chainID, connector.id, chainType);
          } catch (error) {
            console.error(error);
          }
        },
        disconnect: async () => {
          await disconnectAsync();
          context && trackWallet.untrack(context);
        },
        isWalletConnected: connector.id === currentConnector?.id,
      };

      wallets.push(minimalWallet);
    }
  }

  return (
    <DialogContent>
      <WalletModal
        chainType={chainType}
        wallets={wallets}
        onClose={() => setIsOpen(false)}
      />
    </DialogContent>
  );
}

export default WalletModalWithContext;
