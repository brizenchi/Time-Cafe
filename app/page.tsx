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
import { InteractionPopover } from "../components/interaction-popover"
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

// Map data: 0=floor, 1=wall, 2=table, 3=chair, 4=counter
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

const songs = [
  {
    name: '陈奕迅 - 红玫瑰',
    url: 'https://music.163.com/song?id=27867140',
  },
  {
    name: '周杰伦 - 七里香',
    url: 'https://music.163.com/song?id=186016',
  },
  {
    name: '五月天 - 温柔',
    url: 'https://music.163.com/song?id=167827',
  },
  {
    name: 'Taylor Swift - Lover',
    url: 'https://music.163.com/song?id=1407551413',
  },
  {
    name: 'NewJeans - Super Shy',
    url: 'https://music.163.com/song?id=2058261887',
  },
];

export default function PixelCafe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [songIdx, setSongIdx] = useState(0);
  // audio 播放器引用
  const audioRef = useRef<HTMLAudioElement>(null);
  // 播放状态
  const [isPlaying, setIsPlaying] = useState(false);

  // 切歌后自动播放
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [songIdx]);

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

  // Interaction popover state
  const [interactionPopover, setInteractionPopover] = useState<{
    player: Player | null,
    x: number,
    y: number,
    open: boolean
  }>({ player: null, x: 0, y: 0, open: false })

  // 保留弹窗送礼相关状态（如需使用 GiftModal）
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

  // 点击检测（送礼&烟花）
  const coffeeRef = useRef<HTMLAudioElement>(null);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // 咖啡机区域检测（与 render 里的 coffeeX/coffeeY 保持一致）
      const coffeeX = Math.floor(MAP_WIDTH / 3 - 1) * TILE_SIZE;
      const coffeeY = Math.floor(MAP_HEIGHT / 3 - 1) * TILE_SIZE;
      if (
        clickX >= coffeeX &&
        clickX <= coffeeX + TILE_SIZE * 2 &&
        clickY >= coffeeY &&
        clickY <= coffeeY + TILE_SIZE * 2
      ) {
        // 播放咖啡音效
        if (coffeeRef.current) {
          coffeeRef.current.currentTime = 0;
          coffeeRef.current.play();
        }
        return;
      }

      // 转换为游戏坐标
      const gameX = Math.floor(clickX / TILE_SIZE);
      const gameY = Math.floor(clickY / TILE_SIZE);

      // 检查是否点击了自己
      if (gameX === player.x && gameY === player.y) {
        // 放烟花
        effectsManager.createFirework(clickX, clickY);
        soundManager.playFirework();
        return;
      }
      // 检查是否点击了其他玩家
      const clickedPlayer = otherPlayers.find((p) => p.x === gameX && p.y === gameY);
      if (clickedPlayer) {
        // 记录弹窗目标和像素坐标（弹窗显示在头像上方居中）
        setInteractionPopover({
          player: clickedPlayer,
          x: clickedPlayer.x * TILE_SIZE + TILE_SIZE / 2 - 60, // popover宽度居中
          y: clickedPlayer.y * TILE_SIZE - 60, // 头像正上方
          open: true
        });
        soundManager.playButtonClick();
        return;
      }
      // 点击空白，关闭弹窗
      setInteractionPopover({ player: null, x: 0, y: 0, open: false });
    },
    [player, otherPlayers, effectsManager, soundManager],
  );

  // 发送礼物
  const handleSendGift = useCallback(
    (giftType: string) => {
      if (!selectedPlayer) return;
      const fromX = player.x * TILE_SIZE + TILE_SIZE / 2;
      const fromY = player.y * TILE_SIZE + TILE_SIZE / 2;
      const toX = selectedPlayer.x * TILE_SIZE + TILE_SIZE / 2;
      const toY = selectedPlayer.y * TILE_SIZE + TILE_SIZE / 2;

      effectsManager.createGiftEffect(fromX, fromY, toX, toY, giftType);
      soundManager.playGiftSend();

      // Gift names for notifications
      const giftNames = {
        coffee: "Coffee",
        flower: "Flower",
        cake: "Cake",
        gift: "Gift",
      };

      const notification = {
        id: Date.now().toString(),
        message: `${player.name} sent ${selectedPlayer.name} a ${giftNames[giftType as keyof typeof giftNames]}!`,
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
    ctx.save();
    ctx.translate(p.x * TILE_SIZE, p.y * TILE_SIZE);
    // 判断是否为本地玩家
    if (p.id === player.id) {
      // 画头像图片
      const img = new window.Image();
      img.src = '/p1.png';
      // 立即画可能会失败，需监听加载
      img.onload = () => {
        ctx.drawImage(img, 0, 0, TILE_SIZE, TILE_SIZE);
        // 绘制名字
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(-2, -14, 36, 12);
        ctx.fillStyle = "#fff";
        ctx.fillText(p.name, 16, -4);
      };
      // 兜底：如已加载直接画
      if (img.complete) {
        ctx.drawImage(img, 0, 0, TILE_SIZE, TILE_SIZE);
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(-2, -14, 36, 12);
        ctx.fillStyle = "#fff";
        ctx.fillText(p.name, 16, -4);
      }
    } else {
      // 其他玩家仍用像素风格
      ctx.fillStyle = p.color;
      ctx.fillRect(8, 8, 16, 16);
      ctx.fillStyle = "#fff";
      ctx.fillRect(14, 14, 4, 4);
      ctx.fillStyle = "#333";
      if (p.direction === "up") ctx.fillRect(15, 6, 2, 6);
      if (p.direction === "down") ctx.fillRect(15, 20, 2, 6);
      if (p.direction === "left") ctx.fillRect(6, 15, 6, 2);
      if (p.direction === "right") ctx.fillRect(20, 15, 6, 2);
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(-2, -14, 36, 12);
      ctx.fillStyle = "#fff";
      ctx.fillText(p.name, 16, -4);
    }
    ctx.restore();
  }, [player.id])

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

    // 绘制咖啡机（居中，占4格）
    const coffeeImg = new window.Image()
    coffeeImg.src = '/coffeemachine.png'
    // 居中坐标（地图中央4格）
    const coffeeX = Math.floor(MAP_WIDTH / 3 - 1) * TILE_SIZE
    const coffeeY = Math.floor(MAP_HEIGHT / 3 - 1) * TILE_SIZE
    ctx.drawImage(coffeeImg, coffeeX, coffeeY, TILE_SIZE * 2, TILE_SIZE * 2)


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
          newY -= 1
          newDirection = "up"
          break
        case "ArrowDown":
          newY += 1
          newDirection = "down"
          break
        case "ArrowLeft":
          newX -= 1
          newDirection = "left"
          break
        case "ArrowRight":
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
              <CardTitle className="text-center flex items-center gap-2 justify-center font-['-apple-system','BlinkMacSystemFont','Segoe\ UI','Roboto','Helvetica\ Neue',Arial,sans-serif]">
                <Coffee className="w-6 h-6" />
                Welcome to Time Cafe
              </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 font-['-apple-system','BlinkMacSystemFont','Segoe\ UI','Roboto','Helvetica\ Neue',Arial,sans-serif]">Enter your name:</label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
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
              Enter Cafe
            </Button>
            <div className="text-sm text-muted-foreground text-center font-['-apple-system','BlinkMacSystemFont','Segoe\ UI','Roboto','Helvetica\ Neue',Arial,sans-serif]">Use arrow keys to move</div>
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
Time Cafe
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
                    {soundManager.soundEnabled ? "Sound On" : "Sound Off"}
                  </Button>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4" />
                    {otherPlayers.length + 1} Online
                  </div>
                  <button
                    style={{
                      position: 'relative',
                      top: 2,
                      padding: '4px 8px',
                      borderRadius: 8,
                      background: 'linear-gradient(90deg, #ffe082 0%, #ffb300 100%)',
                      color: '#222',
                      fontWeight: 700,
                      border: 'none',
                      boxShadow: '0 2px 8px #0003',
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                    onClick={() => {
  const url = window.location.origin + window.location.pathname;
  navigator.clipboard.writeText(url);
  alert('Link copyed!');
}}
                  >
                    Share the link to invite your friends!
                  </button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div style={{ position: 'relative', width: MAP_WIDTH * TILE_SIZE, height: MAP_HEIGHT * TILE_SIZE }}>
                  <audio ref={coffeeRef} src="/cafe.wav" preload="auto" style={{ display: 'none' }} />
                  <canvas
                    ref={canvasRef}
                    width={MAP_WIDTH * TILE_SIZE}
                    height={MAP_HEIGHT * TILE_SIZE}
                    className="border-2 border-amber-300 rounded-lg bg-amber-50 cursor-pointer"
                    style={{ imageRendering: "pixelated", position: 'absolute', left: 0, top: 0 }}
                    onClick={handleCanvasClick}
                  />
                  {interactionPopover.open && interactionPopover.player && (
                    <InteractionPopover
                      player={interactionPopover.player}
                      x={interactionPopover.x}
                      y={interactionPopover.y}
                      onSendGift={() => {
                        setSelectedPlayer(interactionPopover.player!)
                        setShowGiftModal(true)
                        setInteractionPopover({ player: null, x: 0, y: 0, open: false })
                      }}
                      onBuyCoffee={() => {
                        // 这里可以扩展“请喝咖啡”逻辑
                        alert(`You bought coffee for ${interactionPopover.player!.name}!`)
                        setInteractionPopover({ player: null, x: 0, y: 0, open: false })
                      }}
                      onClose={() => setInteractionPopover({ player: null, x: 0, y: 0, open: false })}
                    />
                  )}
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
Use arrow keys to move • Click yourself for fireworks • Click other players to send gifts
              </div>
              {/* 底部送礼物列表 */}
              <div style={{
                position: 'fixed',
                left: 0,
                bottom: 0,
                width: '100vw',
                background: 'rgba(255,255,255,0.92)',
                borderTop: '1px solid #f5deb3',
                boxShadow: '0 -2px 12px rgba(0,0,0,0.07)',
                zIndex: 300,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '8px 0',
                gap: 18
              }}>
                <span style={{ fontWeight: 500, color: '#b07d33', fontSize: 17, marginRight: 10, letterSpacing: 0.5 }}>Gift list</span>
                <button style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', margin: '0 10px' }} title="Send Croissant" aria-label="Send Croissant"
                  onClick={() => setChatMessages(msgs => [...msgs, { id: Date.now().toString() + Math.random(), playerId: player.id, playerName: player.name, message: '🥐 +1', timestamp: Date.now() }])}
                >🥐</button>
                <button style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', margin: '0 10px' }} title="Send Flower" aria-label="Send Flower"
                  onClick={() => setChatMessages(msgs => [...msgs, { id: Date.now().toString() + Math.random(), playerId: player.id, playerName: player.name, message: '💐 +1', timestamp: Date.now() }])}
                >💐</button>
                <button style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', margin: '0 10px' }} title="Send Money" aria-label="Send Money"
                  onClick={() => setChatMessages(msgs => [...msgs, { id: Date.now().toString() + Math.random(), playerId: player.id, playerName: player.name, message: '💸 +1', timestamp: Date.now() }])}
                >💸</button>
                <button style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', margin: '0 10px' }} title="Send Coffee" aria-label="Send Coffee"
                  onClick={() => setChatMessages(msgs => [...msgs, { id: Date.now().toString() + Math.random(), playerId: player.id, playerName: player.name, message: '☕️ +1', timestamp: Date.now() }])}
                >☕️</button>
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
              {/* 歌曲播放器 */}
              <button
                style={{
                  position: 'absolute',
                  left: (MAP_WIDTH - 5) * TILE_SIZE,
                  top: (MAP_HEIGHT - 5) * TILE_SIZE,
                  width: TILE_SIZE * 2,
                  height: TILE_SIZE * 2,
                  zIndex: 400,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
                aria-label="切歌"
                title={`切歌：${songs[songIdx].name}`}
                onClick={() => {
                  const nextIdx = (songIdx + 1) % songs.length;
                  setSongIdx(nextIdx);
                  // 自动播放
                  setTimeout(() => {
                    if (audioRef.current) {
                      audioRef.current.load();
                      audioRef.current.play();
                    }
                  }, 0);
                }}
              >
                <img src="/music.png" alt="切歌" style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
              </button>
              {/* 隐藏的 audio 播放器，仅用于播放 */}
              <audio
                ref={audioRef}
                src={songs[songIdx].url.replace('music.163.com/song','music.163.com/song/media/outer/url') + '.mp3'}
                controls={false}
                onEnded={() => setIsPlaying(false)}
                style={{ display: 'none' }}
              />
            </CardContent>
          </Card>
        </div>

        {/* 聊天区域 */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="w-5 h-5" />
Chat Room
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-96">
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm font-['-apple-system','BlinkMacSystemFont','Segoe\ UI','Roboto','Helvetica\ Neue',Arial,sans-serif]">No messages yet, start chatting!</div>
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
                  placeholder="Type a message..."
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
  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
