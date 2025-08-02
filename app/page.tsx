"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Coffee, MessageCircle } from "lucide-react"
import { useSoundManager } from "../hooks/use-sound-manager"
import { Volume2, VolumeX } from "lucide-react"
import { GiftModal } from "../components/gift-modal"
import { useEffects } from "../hooks/use-effects"

interface Player {
  id: string
  name: string
  x: number
  y: number
  color: string
  direction: "up" | "down" | "left" | "right"
}

interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  message: string
  timestamp: number
}

const TILE_SIZE = 32
const MAP_WIDTH = 25
const MAP_HEIGHT = 15

// 地图数据：0=地板，1=墙壁，2=桌子，3=椅子，4=柜台
const MAP_DATA = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 3, 0, 0, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 0, 0, 2, 3, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 3, 0, 0, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 0, 0, 2, 3, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 3, 0, 0, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 0, 0, 2, 3, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 3, 0, 0, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 0, 0, 2, 3, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

export default function PixelCafe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [player, setPlayer] = useState<Player>({
    id: "player1",
    name: "Player",
    x: 3,
    y: 3,
    color: "#ff6b6b",
    direction: "down",
  })
  const [otherPlayers, setOtherPlayers] = useState<Player[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [playerName, setPlayerName] = useState("Player")
  const [showNameInput, setShowNameInput] = useState(true)

  const [showGiftModal, setShowGiftModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [giftNotifications, setGiftNotifications] = useState<
    Array<{
      id: string
      message: string
      timestamp: number
    }>
  >([])

  const soundManager = useSoundManager()
  const effectsManager = useEffects()

  // 点击检测
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top

      // 转换为游戏坐标
      const gameX = Math.floor(clickX / TILE_SIZE)
      const gameY = Math.floor(clickY / TILE_SIZE)

      // 检查是否点击了自己
      if (gameX === player.x && gameY === player.y) {
        // 放烟花
        effectsManager.createFirework(clickX, clickY)
        soundManager.playFirework()
        return
      }

      // 检查是否点击了其他玩家
      const clickedPlayer = otherPlayers.find((p) => p.x === gameX && p.y === gameY)
      if (clickedPlayer) {
        setSelectedPlayer(clickedPlayer)
        setShowGiftModal(true)
        soundManager.playButtonClick()
      }
    },
    [player, otherPlayers, effectsManager, soundManager],
  )

  // 发送礼物
  const handleSendGift = useCallback(
    (giftType: string) => {
      const fromX = player.x * TILE_SIZE + TILE_SIZE / 2
      const fromY = player.y * TILE_SIZE + TILE_SIZE / 2
      const toX = selectedPlayer!.x * TILE_SIZE + TILE_SIZE / 2
      const toY = selectedPlayer!.y * TILE_SIZE + TILE_SIZE / 2

      effectsManager.createGiftEffect(fromX, fromY, toX, toY, giftType)
      soundManager.playGiftSend()

      // 添加礼物通知
      const giftNames = {
        coffee: "咖啡",
        flower: "鲜花",
        cake: "蛋糕",
        gift: "礼物",
      }

      const notification = {
        id: Date.now().toString(),
        message: `${player.name} 送给 ${selectedPlayer!.name} 一个${giftNames[giftType as keyof typeof giftNames]}！`,
        timestamp: Date.now(),
      }

      setGiftNotifications((prev) => [...prev.slice(-4), notification])

      // 3秒后播放收到礼物音效
      setTimeout(() => {
        soundManager.playGiftReceive()
      }, 500)
    },
    [player, selectedPlayer, effectsManager, soundManager],
  )

  // 检查位置是否可以移动
  const canMoveTo = useCallback((x: number, y: number) => {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false
    const tile = MAP_DATA[y][x]
    return tile === 0 // 只有地板可以移动
  }, [])

  // 处理移动并播放音效
  const handleMove = useCallback(
    (newX: number, newY: number, newDirection: string) => {
      if (canMoveTo(newX, newY)) {
        setPlayer((prev) => ({
          ...prev,
          x: newX,
          y: newY,
          direction: newDirection as any,
        }))
        soundManager.playFootstep()
      } else {
        setPlayer((prev) => ({
          ...prev,
          direction: newDirection as any,
        }))
        soundManager.playError()
      }
    },
    [canMoveTo, soundManager],
  )

  // 绘制像素小人
  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, p: Player) => {
    const pixelX = p.x * TILE_SIZE
    const pixelY = p.y * TILE_SIZE

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

    // 名字标签
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(pixelX + 2, pixelY - 8, 28, 10)
    ctx.fillStyle = "#fff"
    ctx.font = "8px monospace"
    ctx.textAlign = "center"
    ctx.fillText(p.name, pixelX + 16, pixelY - 1)
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

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制地图
    drawMap(ctx)

    // 绘制所有玩家
    otherPlayers.forEach((p) => drawPlayer(ctx, p))
    drawPlayer(ctx, player)

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

      handleMove(newX, newY, newDirection)
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [player, canMoveTo, showNameInput, handleMove])

  // 渲染循环
  useEffect(() => {
    render()
    effectsManager.updateEffects()
  }, [render, effectsManager])

  // 发送消息
  const sendMessage = () => {
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      playerId: player.id,
      playerName: player.name,
      message: newMessage.trim(),
      timestamp: Date.now(),
    }

    setChatMessages((prev) => [...prev.slice(-19), message])
    setNewMessage("")
    soundManager.playChatNotification() // 添加这行
  }

  // 设置玩家名字
  const setName = () => {
    if (!playerName.trim()) return

    setPlayer((prev) => ({ ...prev, name: playerName.trim() }))
    setShowNameInput(false)
    soundManager.playEnterCafe() // 添加这行
  }

  // 添加一些模拟的其他玩家
  useEffect(() => {
    const mockPlayers: Player[] = [
      { id: "bot1", name: "Barista", x: 12, y: 7, color: "#4ecdc4", direction: "down" },
      { id: "bot2", name: "Customer", x: 6, y: 5, color: "#45b7d1", direction: "right" },
    ]
    setOtherPlayers(mockPlayers)
  }, [])

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
            <Button
              onClick={() => {
                soundManager.playButtonClick()
                setName()
              }}
              className="w-full"
              disabled={!playerName.trim()}
            >
              进入咖啡馆
            </Button>
            <div className="text-sm text-muted-foreground text-center">使用 WASD 或方向键移动</div>
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
                像素咖啡馆
                <div className="ml-auto flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      soundManager.setSoundEnabled(!soundManager.soundEnabled)
                      soundManager.playButtonClick()
                    }}
                    className="flex items-center gap-1"
                  >
                    {soundManager.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    {soundManager.soundEnabled ? "音效开" : "音效关"}
                  </Button>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4" />
                    {otherPlayers.length + 1} 在线
                  </div>
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
              {giftNotifications.length > 0 && (
                <div className="mt-2 space-y-1">
                  {giftNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="text-xs text-center text-amber-700 bg-amber-100 px-2 py-1 rounded animate-pulse"
                    >
                      {notification.message}
                    </div>
                  ))}
                </div>
              )}
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
            <CardContent className="flex flex-col h-96">
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm">还没有消息，开始聊天吧！</div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <span
                        className="font-semibold"
                        style={{ color: msg.playerId === player.id ? player.color : "#666" }}
                      >
                        {msg.playerName}:
                      </span>
                      <span className="ml-1">{msg.message}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="输入消息..."
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  maxLength={100}
                />
                <Button
                  onClick={() => {
                    soundManager.playButtonClick()
                    sendMessage()
                  }}
                  size="sm"
                >
                  发送
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <GiftModal
        isOpen={showGiftModal}
        onClose={() => {
          setShowGiftModal(false)
          setSelectedPlayer(null)
        }}
        targetPlayer={selectedPlayer}
        onSendGift={handleSendGift}
      />
    </div>
  )
}
