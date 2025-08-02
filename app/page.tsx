"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Coffee, MessageCircle, Sparkles } from "lucide-react"
import { useLocalMultiplayer, type Player } from "../hooks/use-local-multiplayer"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { useEffects } from "../hooks/use-effects"
import { DebugPanel } from "../components/debug-panel"
import { useTimeCafeContract, useTimeCafeUIHandlers } from "../hooks/use-time-cafe-contract"

type DisplayMessage = {
  id: string
  timestamp: number
} & (
  | {
      type: "chat"
      playerId: string
      playerName: string
      message: string
    }
  | {
      type: "notification"
      message: string
    }
)

const TILE_SIZE = 32
const MAP_WIDTH = 25
const MAP_HEIGHT = 15

// 地图数据：0=地板，1=墙壁，2=桌子，3=椅子，4=柜台, 5=咖啡机, 6=收音机
const MAP_DATA = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 3, 0, 6, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 0, 0, 2, 3, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 3, 0, 0, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 0, 0, 2, 3, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 5, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 3, 0, 0, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 0, 0, 2, 3, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 3, 0, 0, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 0, 0, 2, 3, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

// 生成随机颜色
const generatePlayerColor = () => {
  const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff", "#5f27cd"]
  return colors[Math.floor(Math.random() * colors.length)]
}

// 生成随机起始位置
const generateStartPosition = () => {
  const validPositions = []
  for (let y = 1; y < MAP_HEIGHT - 1; y++) {
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
      if (MAP_DATA[y][x] === 0) {
        validPositions.push({ x, y })
      }
    }
  }
  return validPositions[Math.floor(Math.random() * validPositions.length)] || { x: 3, y: 3 }
}

function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div>
        <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
        <Button onClick={() => disconnect()}>Disconnect</Button>
      </div>
    )
  }
  return <Button onClick={() => connect({ connector: injected() })}>Connect Wallet</Button>
}

export default function PixelCafe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const startPosition = generateStartPosition()

  const [player, setPlayer] = useState<Player>({
    id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: "Player",
    ...startPosition,
    color: generatePlayerColor(),
    direction: "down",
    lastUpdate: Date.now(),
  })

  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [playerName, setPlayerName] = useState("Player")
  const [showNameInput, setShowNameInput] = useState(true)

  const [processedEventIds, setProcessedEventIds] = useState(new Set<string>())

  const { otherPlayers, gameEvents, updateCurrentPlayer, sendGameEvent } = useLocalMultiplayer(player)
  const effectsManager = useEffects()
  const { address, isConnected } = useAccount()
  
  // Contract integration
  const contract = useTimeCafeContract()
  const { onCoffeeMachineClick, onPlayerClick, onRecordPlayerClick } = useTimeCafeUIHandlers()

  // 处理游戏事件
  useEffect(() => {
    const newEvents = gameEvents.filter((event) => !processedEventIds.has(event.id));
    if (newEvents.length === 0) return;

    newEvents.forEach((event) => {
      switch (event.type) {
        case "firework":
          effectsManager.createFirework(event.data.x, event.data.y)
          break
        case "gift":
          effectsManager.createGiftEffect(
            event.data.fromX,
            event.data.fromY,
            event.data.toX,
            event.data.toY,
            event.data.giftType,
          )
          // 触发智能合约调用 - 送礼物
          if (isConnected && address && event.playerId === player.id) {
            // 发送普通礼物到主合约
            // contract.sendGift({
            //   recipient: event.data.toPlayerId || address, // 使用目标玩家地址
            //   giftName: event.data.giftType,
            //   message: `${event.data.fromName} 送给你一个礼物！`
            // }).catch(console.error)
            
            // 同时铸造礼物NFT
            contract.sendGiftNFT({
              recipient: event.data.toPlayerId || address,
              message: `${event.data.fromName} 送给你一个${event.data.giftType}礼物NFT！`
            }).catch(console.error)
          }
          // 添加礼物通知
          const giftNames = { coffee: "咖啡", flower: "鲜花", cake: "蛋糕", gift: "礼物" }
          const notification: DisplayMessage = {
            id: event.id,
            type: "notification",
            message: `${event.data.fromName} 送给 ${event.data.toName} 一个${giftNames[event.data.giftType as keyof typeof giftNames]}！`,
            timestamp: event.timestamp,
          }
          setDisplayMessages((prev) => [...prev.slice(-49), notification])
          break
        case "chat":
          // 触发智能合约调用 - 发送消息
          if (isConnected && address && event.playerId === player.id) {
            contract.sendMessage({ messageContent: event.data.message }).catch(console.error)
          }
          const chatMessage: DisplayMessage = {
            id: event.id,
            type: "chat",
            playerId: event.playerId,
            playerName: event.data.playerName,
            message: event.data.message,
            timestamp: event.timestamp,
          }
          setDisplayMessages((prev) => [...prev.slice(-49), chatMessage])
          break
        case "buy_coffee":
          // 触发智能合约调用 - 买咖啡
          if (isConnected && address && event.playerId === player.id) {
            contract.buyCoffee({
              recipient: address, // 给自己买咖啡
              message: `${event.data.playerName} 买了杯咖啡！☕`
            }).catch(console.error)
          }
          const coffeeNotification: DisplayMessage = {
            id: event.id,
            type: "notification",
            message: `${event.data.playerName} 买了杯咖啡！☕`,
            timestamp: event.timestamp,
          }
          setDisplayMessages((prev) => [...prev.slice(-49), coffeeNotification])
          break
        case "change_song":
          // 触发智能合约调用 - 切歌
          if (isConnected && address && event.playerId === player.id) {
            const songId = `song_${Date.now()}`
            const songTitle = `${event.data.playerName}的歌曲`
            contract.changeSong({
              songId,
              songTitle
            }).catch(console.error)
          }
          const songNotification: DisplayMessage = {
            id: event.id,
            type: "notification",
            message: `${event.data.playerName} 切歌了！🎵`,
            timestamp: event.timestamp,
          }
          setDisplayMessages((prev) => [...prev.slice(-49), songNotification])
          break
      }
    })

    setProcessedEventIds((prevIds) => {
      const newIds = new Set(prevIds);
      newEvents.forEach((event) => newIds.add(event.id));
      // Keep the set size manageable
      const toDelete = newIds.size - 50;
      if (toDelete > 0) {
        const anArray = Array.from(newIds).slice(0, toDelete);
        for (const item of anArray) {
          newIds.delete(item);
        }
      }
      return newIds;
    });
  }, [gameEvents, effectsManager, processedEventIds])

  useEffect(() => {
    if (isConnected && address) {
      const newName = `${address.slice(0, 6)}...${address.slice(-4)}`
      setPlayerName(newName)
      setPlayer(prev => ({ ...prev, name: newName }))
      setShowNameInput(false)
    }
  }, [isConnected, address])

  // 点击检测
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top

      const gameX = Math.floor(clickX / TILE_SIZE)
      const gameY = Math.floor(clickY / TILE_SIZE)

      const clickedTile = MAP_DATA[gameY][gameX]

      // 检查对象交互
      if (clickedTile === 5) {
        // 咖啡机 - 触发区块链交易
        if (isConnected && address) {
          onCoffeeMachineClick().catch(console.error)
        }
        sendGameEvent("buy_coffee", { playerName: player.name })
        effectsManager.createFirework(clickX, clickY, "#6f4e37") // 咖啡色烟花
        return
      }
      if (clickedTile === 6) {
        // 收音机 - 触发区块链交易
        if (isConnected && address) {
          const songId = `song_${Date.now()}`
          const songTitle = `新歌曲 ${new Date().toLocaleTimeString()}`
          onRecordPlayerClick(songId, songTitle).catch(console.error)
        }
        sendGameEvent("change_song", { playerName: player.name })
        effectsManager.createFirework(clickX, clickY, "#888888") // 银色音符烟花
        return
      }


      // 检查是否点击了其他玩家
      const clickedPlayer = otherPlayers.find((p) => p.x === gameX && p.y === gameY)
      if (clickedPlayer) {
        const fromX = player.x * TILE_SIZE + TILE_SIZE / 2
        const fromY = player.y * TILE_SIZE + TILE_SIZE / 2
        const toX = clickedPlayer.x * TILE_SIZE + TILE_SIZE / 2
        const toY = clickedPlayer.y * TILE_SIZE + TILE_SIZE / 2

        const giftTypes = ["coffee", "flower", "cake", "gift"]
        const randomGift = giftTypes[Math.floor(Math.random() * giftTypes.length)]

        // 触发区块链交易 - 送礼物
        if (isConnected && address) {
          onPlayerClick(clickedPlayer.id, clickedPlayer.name).catch(console.error)
        }

        effectsManager.createGiftEffect(fromX, fromY, toX, toY, randomGift)
        sendGameEvent("gift", {
          fromX,
          fromY,
          toX,
          toY,
          giftType: randomGift,
          fromName: player.name,
          toName: clickedPlayer.name,
        })
      }
    },
    [player, otherPlayers, effectsManager, sendGameEvent],
  )

  // 检查位置是否可以移动
  const canMoveTo = useCallback((x: number, y: number) => {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false
    const tile = MAP_DATA[y][x]
    return tile === 0
  }, [])

  // 绘制像素小人
  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, p: Player, isCurrentPlayer = false) => {
    const pixelX = p.x * TILE_SIZE
    const pixelY = p.y * TILE_SIZE

    // 如果是当前玩家，添加光晕效果
    if (isCurrentPlayer) {
      ctx.save()
      ctx.shadowColor = p.color
      ctx.shadowBlur = 10
    }

    // 身体
    ctx.fillStyle = p.color
    ctx.fillRect(pixelX + 8, pixelY + 12, 16, 16)

    // 头部
    ctx.fillStyle = "#fdbcb4"
    ctx.fillRect(pixelX + 10, pixelY + 4, 12, 12)

    // 眼睛
    ctx.fillStyle = "#000"
    ctx.fillRect(pixelX + 12, pixelY + 7, 2, 2)
    ctx.fillRect(pixelX + 18, pixelY + 7, 2, 2)

    // 腿部
    ctx.fillStyle = "#4a4a4a"
    ctx.fillRect(pixelX + 10, pixelY + 24, 4, 6)
    ctx.fillRect(pixelX + 18, pixelY + 24, 4, 6)

    if (isCurrentPlayer) {
      ctx.restore()
    }

    // 名字标签
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(pixelX + 2, pixelY - 8, 28, 10)
    ctx.fillStyle = "#fff"
    ctx.font = "8px monospace"
    ctx.textAlign = "center"
    ctx.fillText(p.name, pixelX + 16, pixelY - 1)

    // 在线指示器
    if (!isCurrentPlayer) {
      ctx.fillStyle = "#00ff00"
      ctx.beginPath()
      ctx.arc(pixelX + 26, pixelY - 4, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [])

  // 绘制地图
  const drawMap = useCallback((ctx: CanvasRenderingContext2D) => {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = MAP_DATA[y][x]
        const pixelX = x * TILE_SIZE
        const pixelY = y * TILE_SIZE

        switch (tile) {
          case 0: // 地板
            ctx.fillStyle = "#8B4513"
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE)
            ctx.fillStyle = "#A0522D"
            ctx.fillRect(pixelX + 2, pixelY + 2, TILE_SIZE - 4, TILE_SIZE - 4)
            break
          case 1: // 墙壁
            ctx.fillStyle = "#654321"
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE)
            ctx.fillStyle = "#8B4513"
            ctx.fillRect(pixelX + 4, pixelY + 4, TILE_SIZE - 8, TILE_SIZE - 8)
            break
          case 2: // 桌子
            ctx.fillStyle = "#8B4513"
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE)
            ctx.fillStyle = "#A0522D"
            ctx.fillRect(pixelX + 2, pixelY + 2, TILE_SIZE - 4, TILE_SIZE - 4)
            ctx.fillStyle = "#D2691E"
            ctx.fillRect(pixelX + 4, pixelY + 4, TILE_SIZE - 8, TILE_SIZE - 8)
            break
          case 3: // 椅子
            ctx.fillStyle = "#8B4513"
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE)
            ctx.fillStyle = "#A0522D"
            ctx.fillRect(pixelX + 2, pixelY + 2, TILE_SIZE - 4, TILE_SIZE - 4)
            ctx.fillStyle = "#CD853F"
            ctx.fillRect(pixelX + 6, pixelY + 6, TILE_SIZE - 12, TILE_SIZE - 12)
            break
          case 4: // 柜台
            ctx.fillStyle = "#8B4513"
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE)
            ctx.fillStyle = "#A0522D"
            ctx.fillRect(pixelX + 2, pixelY + 2, TILE_SIZE - 4, TILE_SIZE - 4)
            ctx.fillStyle = "#DEB887"
            ctx.fillRect(pixelX + 4, pixelY + 4, TILE_SIZE - 8, TILE_SIZE - 8)
            // 咖啡机图标
            ctx.fillStyle = "#000"
            ctx.fillRect(pixelX + 12, pixelY + 8, 8, 12)
            ctx.fillStyle = "#666"
            ctx.fillRect(pixelX + 14, pixelY + 10, 4, 8)
            break
          case 5: // 咖啡机
            ctx.fillStyle = "#333"
            ctx.fillRect(pixelX + 4, pixelY + 6, 24, 24)
            ctx.fillStyle = "#555"
            ctx.fillRect(pixelX + 6, pixelY + 8, 20, 20)
            ctx.fillStyle = "#00bfff"
            ctx.fillRect(pixelX + 14, pixelY + 12, 4, 4) // 蓝光
            break
          case 6: // 收音机
            ctx.fillStyle = "#8B4513"
            ctx.fillRect(pixelX + 6, pixelY + 10, 20, 16)
            ctx.fillStyle = "#333"
            ctx.fillRect(pixelX + 10, pixelY + 14, 12, 8) // 喇叭
            ctx.fillStyle = "#ccc"
            ctx.fillRect(pixelX + 22, pixelY + 4, 2, 8) // 天线
            break
        }
      }
    }
  }, [])

  // 渲染游戏
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    drawMap(ctx)

    // 绘制其他玩家
    otherPlayers.forEach((p) => drawPlayer(ctx, p, false))

    // 绘制当前玩家（最后绘制，确保在最上层）
    drawPlayer(ctx, player, true)

    // 绘制特效
    effectsManager.drawEffects(ctx)
  }, [player, otherPlayers, drawMap, drawPlayer, effectsManager])

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showNameInput) return

      let newX = player.x
      let newY = player.y
      let newDirection = player.direction

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          newY -= 1
          newDirection = "up"
          break
        case "ArrowDown":
        case "s":
        case "S":
          newY += 1
          newDirection = "down"
          break
        case "ArrowLeft":
        case "a":
        case "A":
          newX -= 1
          newDirection = "left"
          break
        case "ArrowRight":
        case "d":
        case "D":
          newX += 1
          newDirection = "right"
          break
        default:
          return
      }

      e.preventDefault()

      const updatedPlayer = {
        ...player,
        direction: newDirection,
        ...(canMoveTo(newX, newY) ? { x: newX, y: newY } : {}),
      }

      setPlayer(updatedPlayer)
      sendGameEvent("move", { x: updatedPlayer.x, y: updatedPlayer.y, direction: newDirection })
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [player, canMoveTo, showNameInput, sendGameEvent])

  // 更新当前玩家到本地存储
  useEffect(() => {
    updateCurrentPlayer(player)
  }, [player, updateCurrentPlayer])

  // 渲染循环
  useEffect(() => {
    let animationFrameId: number

    const gameLoop = () => {
      render()
      effectsManager.updateEffects()
      animationFrameId = requestAnimationFrame(gameLoop)
    }

    animationFrameId = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [render, effectsManager])

  // 发送消息
  const sendMessage = () => {
    if (!newMessage.trim()) return

    const message = {
      playerName: player.name,
      message: newMessage.trim(),
    }

    // 触发区块链交易 - 发送消息
    if (isConnected && address) {
      contract.sendMessage({ messageContent: newMessage.trim() }).catch(console.error)
    }

    sendGameEvent("chat", message)

    // 也添加到本地聊天
    const chatMessage: DisplayMessage = {
      id: Date.now().toString(),
      type: "chat",
      playerId: player.id,
      playerName: player.name,
      message: newMessage.trim(),
      timestamp: Date.now(),
    }
    setDisplayMessages((prev) => [...prev.slice(-49), chatMessage])
    setNewMessage("")
  }

  // 设置玩家名字
  const setName = () => {
    if (!playerName.trim()) return

    const updatedPlayer = { ...player, name: playerName.trim() }
    setPlayer(updatedPlayer)
    setShowNameInput(false)
  }

  if (showNameInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center gap-2 justify-center">
              <Coffee className="w-6 h-6" />
              欢迎来到像素咖啡馆
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">请输入你的名字：</label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="输入你的名字"
                onKeyPress={(e) => e.key === "Enter" && setName()}
                maxLength={10}
              />
            </div>
            <Button onClick={setName} className="w-full" disabled={!playerName.trim()}>
              进入咖啡馆
            </Button>
            <div className="text-sm text-muted-foreground text-center">
              使用 WASD 或方向键移动 • 实时多人互动
              <br />
              <strong>测试提示：打开多个标签页，输入不同名字</strong>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 to-orange-200 p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 游戏区域 */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="w-5 h-5" />
                Time Ca
                <div className="ml-auto flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4" />
                    {otherPlayers.length + 1} 在线
                  </div>
                  <ConnectWallet />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={MAP_WIDTH * TILE_SIZE}
                  height={MAP_HEIGHT * TILE_SIZE}
                  className="border-2 border-amber-300 rounded-lg bg-amber-50 cursor-pointer"
                  style={{ imageRendering: "pixelated" }}
                  onClick={handleCanvasClick}
                />
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                使用 WASD 或方向键移动 • 点击自己放烟花 • 点击其他玩家送礼物
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 聊天区域 */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="w-5 h-5" />
                聊天室
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(80vh-70px)] p-3">
              <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                {displayMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm pt-4">还没有消息，开始聊天吧！</div>
                ) : (
                  displayMessages.map((msg) =>
                    msg.type === "chat" ? (
                      <div key={msg.id} className="text-sm">
                        <span
                          className="font-semibold"
                          style={{ color: msg.playerId === player.id ? player.color : "#666" }}
                        >
                          {msg.playerName}:
                        </span>
                        <span className="ml-1 break-words">{msg.message}</span>
                      </div>
                    ) : (
                      <div
                        key={msg.id}
                        className="text-xs text-center text-amber-700 bg-amber-100 px-2 py-1 rounded flex items-center justify-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        {msg.message}
                      </div>
                    ),
                  )
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="输入消息..."
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  maxLength={100}
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="sm">
                  发送
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 调试面板 */}
      <DebugPanel currentPlayer={player} otherPlayers={otherPlayers} gameEvents={gameEvents} />
    </div>
  )
}
