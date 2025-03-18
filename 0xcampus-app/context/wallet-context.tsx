"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface WalletContextType {
  account: string | null
  connectWallet: () => Promise<void>
  isConnecting: boolean
  isConnected: boolean
  chainId: string | null
  switchNetwork: () => Promise<void>
}

const WalletContext = createContext<WalletContextType>({
  account: null,
  connectWallet: async () => {},
  isConnecting: false,
  isConnected: false,
  chainId: null,
  switchNetwork: async () => {},
})

export const useWallet = () => useContext(WalletContext)

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [chainId, setChainId] = useState<string | null>(null)

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to use this application")
      return
    }

    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })

      setAccount(accounts[0])
      setChainId(chainIdHex)
    } catch (error) {
      console.error("Error connecting wallet:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const switchNetwork = async () => {
    if (!window.ethereum) return

    try {
      // Switch to the desired network (e.g., Ethereum Mainnet)
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1" }], // Ethereum Mainnet
      })
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x1",
                chainName: "Ethereum Mainnet",
                nativeCurrency: {
                  name: "Ether",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://mainnet.infura.io/v3/"],
                blockExplorerUrls: ["https://etherscan.io"],
              },
            ],
          })
        } catch (addError) {
          console.error("Error adding network:", addError)
        }
      }
      console.error("Error switching network:", error)
    }
  }

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts.length > 0) {
            setAccount(accounts[0])
            const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
            setChainId(chainIdHex)
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error)
        }
      }
    }

    checkConnection()

    // Setup event listeners
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAccount(accounts.length > 0 ? accounts[0] : null)
      })

      window.ethereum.on("chainChanged", (chainIdHex: string) => {
        setChainId(chainIdHex)
        window.location.reload()
      })
    }

    // Cleanup
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged")
        window.ethereum.removeAllListeners("chainChanged")
      }
    }
  }, [])

  return (
    <WalletContext.Provider
      value={{
        account,
        connectWallet,
        isConnecting,
        isConnected: !!account,
        chainId,
        switchNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

