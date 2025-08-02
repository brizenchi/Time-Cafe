"use client"

import { useEffect, useState, useCallback, useRef } from "react"

export interface Player {
  id: string
  name: string
  x: number
  y: number
  color: string
  direction: "up" | "down" | "left" | "right"
  lastUpdate: number
}

export interface GameEvent {
  id: string
  type: "move" | "firework" | "gift" | "chat" | "buy_coffee" | "change_song"
  playerId: string
  data: any
  timestamp: number
}

const STORAGE_KEY = "pixel-cafe-players"
const EVENTS_KEY = "pixel-cafe-events"
const CLEANUP_INTERVAL = 600000 // 60秒清理一次离线玩家
const UPDATE_INTERVAL = 500 // 50ms更新频率，更流畅

export function useLocalMultiplayer(currentPlayer: Player) {
  const [otherPlayers, setOtherPlayers] = useState<Player[]>([])
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([])
  const lastEventTimestamp = useRef<number>(0)
  const isInitialized = useRef(false)

  // 强制触发localStorage事件的辅助函数
  const triggerStorageEvent = useCallback((key: string, newValue: string) => {
    // 先设置值
    localStorage.setItem(key, newValue)

    // 手动触发storage事件（用于同一标签页内的其他组件）
    window.dispatchEvent(
      new StorageEvent("storage", {
        key,
        newValue,
        oldValue: localStorage.getItem(key),
        storageArea: localStorage,
      }),
    )
  }, [])

  // 移除当前玩家
  const removeCurrentPlayer = useCallback(() => {
    try {
      const existingPlayers = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Player[]
      const newPlayers = existingPlayers.filter((p) => p.id !== currentPlayer.id)
      triggerStorageEvent(STORAGE_KEY, JSON.stringify(newPlayers))
      console.log(`[${currentPlayer.name}] 离开游戏`)
    } catch (error) {
      console.error("Failed to remove player:", error)
    }
  }, [currentPlayer.id, currentPlayer.name, triggerStorageEvent])

  // 更新当前玩家到本地存储
  const updateCurrentPlayer = useCallback(
    (player: Player) => {
      const updatedPlayer = { ...player, lastUpdate: Date.now() }

      try {
        const existingPlayers = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Player[]
        const filteredPlayers = existingPlayers.filter((p) => p.id !== player.id)
        const newPlayers = [...filteredPlayers, updatedPlayer]

        triggerStorageEvent(STORAGE_KEY, JSON.stringify(newPlayers))
      } catch (error) {
        console.error("Failed to update player:", error)
      }
    },
    [triggerStorageEvent],
  )

  // 发送游戏事件
  const sendGameEvent = useCallback(
    (type: GameEvent["type"], data: any) => {
      const event: GameEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        playerId: currentPlayer.id,
        data,
        timestamp: Date.now(),
      }

      try {
        const existingEvents = JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]") as GameEvent[]
        const newEvents = [...existingEvents.slice(-50), event] // 保留最近50个事件
        triggerStorageEvent(EVENTS_KEY, JSON.stringify(newEvents))
      } catch (error) {
        console.error("Failed to send event:", error)
      }
    },
    [currentPlayer.id, triggerStorageEvent],
  )

  // 读取玩家数据
  const loadPlayers = useCallback(() => {
    try {
      const allPlayers = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Player[]
      const now = Date.now()

      // 过滤掉超时的玩家和当前玩家
      const activePlayers = allPlayers.filter((p) => p.id !== currentPlayer.id && now - p.lastUpdate < CLEANUP_INTERVAL)

      setOtherPlayers(activePlayers)

      // 调试信息
      console.log(`[${currentPlayer.name}] 加载玩家:`, {
        total: allPlayers.length,
        active: activePlayers.length,
        current: currentPlayer.id,
        players: activePlayers.map((p) => ({ name: p.name, id: p.id.slice(-4) })),
      })
    } catch (error) {
      console.error("Failed to load players:", error)
    }
  }, [currentPlayer.id, currentPlayer.name])

  // 读取事件数据
  const loadEvents = useCallback(() => {
    try {
      const allEvents = JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]") as GameEvent[]
      const now = Date.now()

      // 只获取最近的事件，且不是当前玩家发送的，且是新的事件
      const recentEvents = allEvents.filter(
        (e) => e.playerId !== currentPlayer.id && now - e.timestamp < 5000 && e.timestamp > lastEventTimestamp.current,
      )

      if (recentEvents.length > 0) {
        setGameEvents(recentEvents)
        lastEventTimestamp.current = Math.max(...recentEvents.map((e) => e.timestamp))

        // 调试信息
        console.log(
          `[${currentPlayer.name}] 收到事件:`,
          recentEvents.map((e) => ({ type: e.type, from: e.playerId.slice(-4) })),
        )
      }
    } catch (error) {
      console.error("Failed to load events:", error)
    }
  }, [currentPlayer.id, currentPlayer.name])

  // 初始化
  useEffect(() => {
    if (!isInitialized.current) {
      // 清理可能存在的旧数据
      const allPlayers = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Player[]
      const cleanPlayers = allPlayers.filter((p) => p.id !== currentPlayer.id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanPlayers))

      isInitialized.current = true
      console.log(`[${currentPlayer.name}] 初始化完成, ID: ${currentPlayer.id.slice(-4)}`)
    }
  }, [currentPlayer.id, currentPlayer.name])

  // 定期更新
  useEffect(() => {
    const interval = setInterval(() => {
      loadPlayers()
      loadEvents()
    }, UPDATE_INTERVAL)

    // 立即执行一次
    loadPlayers()
    loadEvents()

    return () => clearInterval(interval)
  }, [loadPlayers, loadEvents])

  // 定期更新玩家状态以保持在线
  // 定期更新玩家状态以保持在线
  useEffect(() => {
    const keepAliveInterval = setInterval(() => {
      try {
        const allPlayers = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Player[]
        const me = allPlayers.find(p => p.id === currentPlayer.id)

        if (me) {
          updateCurrentPlayer({ ...me, lastUpdate: Date.now() })
        }
      } catch (error) {
        console.error("Failed to keep player alive:", error)
      }
    }, 10000) // 每 10 秒更新一次

    return () => clearInterval(keepAliveInterval)
  }, [currentPlayer.id, updateCurrentPlayer])

  // 监听localStorage变化（跨标签页）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadPlayers()
      } else if (e.key === EVENTS_KEY) {
        loadEvents()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [loadPlayers, loadEvents])

  // 清理离线玩家
  useEffect(() => {
    const cleanup = () => {
      try {
        const allPlayers = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Player[]
        const now = Date.now()
        const activePlayers = allPlayers.filter((p) => now - p.lastUpdate < CLEANUP_INTERVAL)

        if (activePlayers.length !== allPlayers.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(activePlayers))
          console.log(`[${currentPlayer.name}] 清理了 ${allPlayers.length - activePlayers.length} 个离线玩家`)
        }
      } catch (error) {
        console.error("Failed to cleanup players:", error)
      }
    }

    const cleanupInterval = setInterval(cleanup, CLEANUP_INTERVAL)
    return () => clearInterval(cleanupInterval)
  }, [currentPlayer.name])

  // 处理页面卸载
  useEffect(() => {
    const handleBeforeUnload = () => {
      removeCurrentPlayer()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      // 在组件卸载时也移除玩家
      removeCurrentPlayer()
    }
  }, [removeCurrentPlayer])

  useEffect(() => {
    return () => {
      try {
        const allPlayers = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Player[]
        const filteredPlayers = allPlayers.filter((p) => p.id !== currentPlayer.id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPlayers))
        console.log(`[${currentPlayer.name}] 离开咖啡馆`)
      } catch (error) {
        console.error("Failed to cleanup on unmount:", error)
      }
    }
  }, [currentPlayer.id, currentPlayer.name])

  return {
    otherPlayers,
    gameEvents,
    updateCurrentPlayer,
    sendGameEvent,
  }
}
