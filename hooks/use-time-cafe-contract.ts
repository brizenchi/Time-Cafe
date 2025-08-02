"use client"

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import timeCafeAbi from '../contract/timecafe.json'
import cafeGiftNftAbi from '../contract/cafegiftnft.json'

// Contract addresses
export const TIME_CAFE_CONTRACT_ADDRESS = '0x8a3bcd9652BBd4230461e2605d85fa60a90576B4' as const
export const CAFE_GIFT_NFT_CONTRACT_ADDRESS = '0x...' as const // TODO: Add actual NFT contract address

// Contract interaction types
export interface SendMessageParams {
  messageContent: string
}

export interface SendGiftParams {
  recipient: string
  giftName: string
  message: string
}

export interface BuyCoffeeParams {
  recipient: string
  message: string
}

export interface ChangeSongParams {
  songId: string
  songTitle: string
}

export interface ContractCosts {
  buyCoffeeCost: bigint
  sendGiftCost: bigint
  changeSongCost: bigint
}

export function useTimeCafeContract() {
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash,
    })

  // Read contract costs
  const { data: buyCoffeeCost } = useReadContract({
    address: TIME_CAFE_CONTRACT_ADDRESS,
    abi: timeCafeAbi,
    functionName: 'buyCoffeeCost',
  })

  const { data: sendGiftCost } = useReadContract({
    address: TIME_CAFE_CONTRACT_ADDRESS,
    abi: timeCafeAbi,
    functionName: 'sendGiftCost',
  })

  const { data: changeSongCost } = useReadContract({
    address: TIME_CAFE_CONTRACT_ADDRESS,
    abi: timeCafeAbi,
    functionName: 'changeSongCost',
  })

  // Contract interaction functions
  const sendMessage = async ({ messageContent }: SendMessageParams) => {
    try {
      await writeContract({
        address: TIME_CAFE_CONTRACT_ADDRESS,
        abi: timeCafeAbi,
        functionName: 'postMessage',
        args: [messageContent],
      })
    } catch (err) {
      console.error('Failed to send message:', err)
      throw err
    }
  }

  const sendGift = async ({ recipient, giftName, message }: SendGiftParams) => {
    // Use fallback cost if contract reading fails (1000000000 wei as specified)
    const costToUse = sendGiftCost || BigInt('1000000000')
    if (!costToUse) {
      throw new Error('Gift cost not available')
    }

    try {
      await writeContract({
        address: TIME_CAFE_CONTRACT_ADDRESS,
        abi: timeCafeAbi,
        functionName: 'sendGift',
        args: [recipient, giftName, message],
        value: costToUse,
      })
    } catch (err) {
      console.error('Failed to send gift:', err)
      throw err
    }
  }

  const buyCoffee = async ({ recipient, message }: BuyCoffeeParams) => {
    // Use fallback cost if contract reading fails (1000000000 wei as specified)
    const costToUse = buyCoffeeCost || BigInt('1000000000')
    if (!costToUse) {
      throw new Error('Coffee cost not available')
    }

    try {
      await writeContract({
        address: TIME_CAFE_CONTRACT_ADDRESS,
        abi: timeCafeAbi,
        functionName: 'buyCoffee',
        args: [recipient, message],
        value: costToUse,
      })
    } catch (err) {
      console.error('Failed to buy coffee:', err)
      throw err
    }
  }

  const changeSong = async ({ songId, songTitle }: ChangeSongParams) => {
    // Use fallback cost if contract reading fails (1000000000 wei as specified)
    const costToUse = changeSongCost || BigInt('1000000000')
    if (!costToUse) {
      throw new Error('Song change cost not available')
    }

    try {
      await writeContract({
        address: TIME_CAFE_CONTRACT_ADDRESS,
        abi: timeCafeAbi,
        functionName: 'changeSong',
        args: [songId, songTitle],
        value: costToUse,
      })
    } catch (err) {
      console.error('Failed to change song:', err)
      throw err
    }
  }

  const sendGiftNFT = async ({ recipient, message }: { recipient: string, message: string }) => {
    // Use fixed cost of 1000000000 wei as specified
    const costToUse = BigInt('1000000000')

    try {
      await writeContract({
        address: CAFE_GIFT_NFT_CONTRACT_ADDRESS,
        abi: cafeGiftNftAbi,
        functionName: 'sendGiftNFT',
        args: [recipient, message],
        value: costToUse,
      })
    } catch (err) {
      console.error('Failed to send gift NFT:', err)
      throw err
    }
  }

  // Helper functions
  const getCosts = (): ContractCosts | null => {
    if (!buyCoffeeCost || !sendGiftCost || !changeSongCost) {
      return null
    }
    
    return {
      buyCoffeeCost,
      sendGiftCost,
      changeSongCost,
    }
  }

  const formatCost = (cost: bigint): string => {
    return formatEther(cost)
  }

  return {
    // Contract functions
    sendMessage,
    sendGift,
    buyCoffee,
    changeSong,
    sendGiftNFT,
    
    // Transaction state
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
    
    // Cost information
    costs: getCosts(),
    buyCoffeeCost,
    sendGiftCost,
    changeSongCost,
    formatCost,
  }
}

// UI interaction handlers for different elements
export interface UIInteractionHandlers {
  onCoffeeMachineClick: (targetPlayer?: string) => Promise<void>
  onPlayerClick: (targetPlayerId: string, playerName: string) => Promise<void>
  onRecordPlayerClick: (songId: string, songTitle: string) => Promise<void>
}

export function useTimeCafeUIHandlers(): UIInteractionHandlers {
  const contract = useTimeCafeContract()

  const onCoffeeMachineClick = async (targetPlayer?: string) => {
    if (!targetPlayer) {
      // If no target player, just send a general message
      await contract.sendMessage({
        messageContent: "☕ Someone is making coffee!"
      })
    } else {
      // Buy coffee for specific player
      await contract.buyCoffee({
        recipient: targetPlayer,
        message: "☕ Enjoy your coffee!"
      })
    }
  }

  const onPlayerClick = async (targetPlayerId: string, playerName: string) => {
    // Send a gift to the clicked player
    const gifts = ['🎁', '🌟', '💝', '🎈', '🌺', '🍰']
    const randomGift = gifts[Math.floor(Math.random() * gifts.length)]
    
    await contract.sendGift({
      recipient: targetPlayerId,
      giftName: randomGift,
      message: `Hey ${playerName}! Here's a gift for you! ${randomGift}`
    })
  }

  const onRecordPlayerClick = async (songId: string, songTitle: string) => {
    // Change the current song
    await contract.changeSong({
      songId,
      songTitle
    })
  }

  return {
    onCoffeeMachineClick,
    onPlayerClick,
    onRecordPlayerClick,
  }
}
