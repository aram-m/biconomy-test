import React, { useState } from "react";
import {
  createSmartAccountClient,
  BiconomySmartAccountV2,
  PaymasterMode,
} from "@biconomy/account";
import { ethers } from "ethers";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  const [smartAccount, setSmartAccount] =
    useState<BiconomySmartAccountV2 | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(
    null
  );

  const [txnHash, setTxnHash] = useState<string | null>(null);
  const [chainSelected, setChainSelected] = useState<number>(0);

  const chains = [
    {
      chainId: 11155111,
      name: "Ethereum Sepolia",
      providerUrl: "https://eth-sepolia.public.blastapi.io",
      incrementCountContractAdd: "0xd9ea570eF1378D7B52887cE0342721E164062f5f",
      biconomyPaymasterApiKey: "svm8Q3EYT.e33d2271-16ea-4c96-8c94-ec23fc55d461",
      explorerUrl: "https://sepolia.etherscan.io/tx/",
    },
    {
      chainId: 80002,
      name: "Polygon Amoy",
      providerUrl: "https://rpc-amoy.polygon.technology/",
      incrementCountContractAdd: "0xfeec89eC2afD503FF359487967D02285f7DaA9aD",
      biconomyPaymasterApiKey: "TVDdBH-yz.5040805f-d795-4078-9fd1-b668b8817642",
      explorerUrl: "https://www.oklink.com/amoy/tx/",
    },
  ];

  const connect = async () => {
    try {
      const chainConfig =
        chainSelected == 0
          ? {
              chainNamespace: CHAIN_NAMESPACES.EIP155,
              chainId: "0xaa36a7",
              rpcTarget: chains[chainSelected].providerUrl,
              displayName: "Ethereum Sepolia",
              blockExplorer: "https://sepolia.etherscan.io/",
              ticker: "ETH",
              tickerName: "Ethereum",
            }
          : {
              chainNamespace: CHAIN_NAMESPACES.EIP155,
              chainId: "0x13882",
              rpcTarget: chains[chainSelected].providerUrl,
              displayName: "Polygon Amoy",
              blockExplorer: "https://www.oklink.com/amoy/",
              ticker: "MATIC",
              tickerName: "Polygon Matic",
            };

      //Creating web3auth instance
      const web3auth = new Web3Auth({
        clientId:
          "BOxiJjV615qDs3amXlN2Hp_2aXxGdzE7Jy4nCQ0cNVrAM84XxIMtMxOoBqJefZkoztNREKtIZUcy_eZiys1ZUbE", // Get your Client ID from the Web3Auth Dashboard https://dashboard.web3auth.io/
        web3AuthNetwork: "sapphire_devnet", // Web3Auth Network
        chainConfig,
        uiConfig: {
          appName: "Biconomy X Web3Auth",
          mode: "dark", // light, dark or auto
          loginMethodsOrder: ["apple", "google", "twitter"],
          logoLight: "https://web3auth.io/images/web3auth-logo.svg",
          logoDark: "https://web3auth.io/images/web3auth-logo---Dark.svg",
          defaultLanguage: "en", // en, de, ja, ko, zh, es, fr, pt, nl
          loginGridCol: 3,
          primaryButton: "socialLogin", // "externalLogin" | "socialLogin" | "emailLogin"
        },
      });

      await web3auth.initModal();
      const web3authProvider = await web3auth.connect();
      const ethersProvider = new ethers.providers.Web3Provider(
        web3authProvider as any
      );
      const web3AuthSigner = ethersProvider.getSigner();

      const config = {
        biconomyPaymasterApiKey: chains[chainSelected].biconomyPaymasterApiKey,
        bundlerUrl: `https://bundler.biconomy.io/api/v2/${chains[chainSelected].chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`, // <-- Read about this at https://docs.biconomy.io/dashboard#bundler-url
      };

      const smartWallet = await createSmartAccountClient({
        signer: web3AuthSigner,
        biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
        bundlerUrl: config.bundlerUrl,
        rpcUrl: chains[chainSelected].providerUrl,
        chainId: chains[chainSelected].chainId,
      });

      console.log("Biconomy Smart Account", smartWallet);
      setSmartAccount(smartWallet);
      const saAddress = await smartWallet.getAccountAddress();
      console.log("Smart Account Address", saAddress);
      setSmartAccountAddress(saAddress);
    } catch (error) {
      console.error(error);
    }
  };

  const sendSponsoredTxn = async () => {
    const toAddress = "0x884B2d521067b69B5cAD884b91F9432b242EECCf"; // Replace with the recipient's address
    const transactionData = "0x123"; // Replace with the actual transaction data

    // Build the transaction
    const tx = {
      to: toAddress,
      data: transactionData,
    };
    // Send the transaction and get the transaction hash
    //@ts-ignore
    const userOpResponse = await smartAccount?.sendTransaction(tx, {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });
    const toastId = toast("Txn send");
    //@ts-ignore
    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Transaction Hash", transactionHash);

    if (transactionHash) {
      toast.update(toastId, {
        render: "Transaction Successful",
        type: "success",
        autoClose: 5000,
      });
      setTxnHash(transactionHash);
    }
    const userOpReceipt = await userOpResponse?.wait();
    if (userOpReceipt?.success == "true") {
      toast.update(toastId, {
        render: "Transaction Successful",
        type: "success",
        autoClose: 5000,
      });
      console.log("UserOp receipt", userOpReceipt);
      console.log("Transaction receipt", userOpReceipt.receipt);
    }
  };

  const sendBatchTxs = async () => {
    const toAddress = "0x884B2d521067b69B5cAD884b91F9432b242EECCf";

    // Generate a random number between 2 and 5
    const randomLength = Math.floor(Math.random() * 9) + 2;

    const txs = Array.from({ length: randomLength }, (_, index) => ({
      to: toAddress,
      data: `0x${index.toString()}`,
    }));
    // Send the transaction and get the transaction hash
    //@ts-ignore
    const userOpResponse = await smartAccount?.sendTransaction(txs, {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });

    const toastId = toast(`${randomLength} Txs send`);
    //@ts-ignore
    const { transactionHash } = await userOpResponse.waitForTxHash();
    if (transactionHash) {
      toast.update(toastId, {
        render: "Transaction Successful",
        type: "success",
        autoClose: 5000,
      });
      setTxnHash(transactionHash);
    }
    console.log("Transaction Hash", transactionHash);
    const userOpReceipt = await userOpResponse?.wait();
    if (userOpReceipt?.success == "true") {
      console.log("UserOp receipt", userOpReceipt);
      console.log("Transaction receipt", userOpReceipt.receipt);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start gap-8 p-24">
      <div className="text-[4rem] font-bold text-orange-400">
        Biconomy-Web3Auth
      </div>
      {!smartAccount && (
        <>
          <div className="flex flex-row justify-center items-center gap-4">
            <div
              className={`w-[8rem] h-[3rem] cursor-pointer rounded-lg flex flex-row justify-center items-center text-white ${
                chainSelected == 0 ? "bg-orange-600" : "bg-black"
              } border-2 border-solid border-orange-400`}
              onClick={() => {
                setChainSelected(0);
              }}
            >
              Eth Sepolia
            </div>
            <div
              className={`w-[8rem] h-[3rem] cursor-pointer rounded-lg flex flex-row justify-center items-center text-white ${
                chainSelected == 1 ? "bg-orange-600" : "bg-black"
              } bg-black border-2 border-solid border-orange-400`}
              onClick={() => {
                setChainSelected(1);
              }}
            >
              Poly Amoy
            </div>
          </div>
          <button
            className="w-[10rem] h-[3rem] bg-orange-300 text-black font-bold rounded-lg"
            onClick={connect}
          >
            Web3Auth Sign in
          </button>
        </>
      )}

      {smartAccount && (
        <>
          {" "}
          <span>Smart Account Address</span>
          <span>{smartAccountAddress}</span>
          <span>Network: {chains[chainSelected].name}</span>
          <div className="flex flex-row justify-between items-start gap-8">
            <div className="flex flex-col justify-center items-center gap-4">
              <button
                className="w-[16rem] h-[3rem] bg-orange-300 text-black font-bold rounded-lg"
                onClick={sendSponsoredTxn}
              >
                Send Sponsored Txn
              </button>
              <button
                className="w-[16rem] h-[3rem] bg-orange-300 text-black font-bold rounded-lg"
                onClick={sendBatchTxs}
              >
                Send Batch Txs
              </button>
              {txnHash && (
                <a
                  target="_blank"
                  href={`${chains[chainSelected].explorerUrl + txnHash}`}
                >
                  <span className="text-white font-bold underline">
                    Txn Hash
                  </span>
                </a>
              )}
            </div>
          </div>
          <span className="text-white">Open console to view console logs.</span>
        </>
      )}
    </main>
  );
}
