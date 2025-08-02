"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bug, EyeOff, Trash2 } from "lucide-react"
import type { Player } from "../hooks/use-local-multiplayer"

interface DebugPanelProps {
  currentPlayer: Player
  otherPlayers: Player[]
  gameEvents: any[]
}

export function DebugPanel({ currentPlayer, otherPlayers, gameEvents }: DebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false)

  const clearStorage = () => {
    localStorage.removeItem("pixel-cafe-players")
    localStorage.removeItem("pixel-cafe-events")
    window.location.reload()
  }

  const getStorageInfo = () => {
    try {
      const players = JSON.parse(localStorage.getItem("pixel-cafe-players") || "[]")
      const events = JSON.parse(localStorage.getItem("pixel-cafe-events") || "[]")
      return { players, events }
    } catch {
      return { players: [], events: [] }
    }
  }

  const { players: allStoredPlayers, events: allStoredEvents } = getStorageInfo()

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={() => setIsVisible(true)} size="sm" variant="outline" className="bg-white/90 backdrop-blur-sm">
          <Bug className="w-4 h-4 mr-1" />
          调试
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4" />
              调试面板
            </div>
            <Button onClick={() => setIsVisible(false)} size="sm" variant="ghost">
              <EyeOff className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div>
            <div className="font-medium mb-1">当前玩家:</div>
            <div className="bg-gray-100 p-2 rounded">
              <div>名字: {currentPlayer.name}</div>
              <div>ID: {currentPlayer.id.slice(-8)}</div>
              <div>
                位置: ({currentPlayer.x}, {currentPlayer.y})
              </div>
              <div>
                颜色: <span style={{ color: currentPlayer.color }}>●</span> {currentPlayer.color}
              </div>
            </div>
          </div>

          <div>
            <div className="font-medium mb-1">其他玩家 ({otherPlayers.length}):</div>
            <div className="bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
              {otherPlayers.length === 0 ? (
                <div className="text-gray-500">无其他玩家</div>
              ) : (
                otherPlayers.map((player) => (
                  <div key={player.id} className="mb-1">
                    <span style={{ color: player.color }}>●</span> {player.name}
                    <span className="text-gray-500">
                      {" "}
                      ({player.x}, {player.y})
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="font-medium mb-1">存储中的所有玩家 ({allStoredPlayers.length}):</div>
            <div className="bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
              {allStoredPlayers.map((player: Player) => (
                <div key={player.id} className="mb-1">
                  <span style={{ color: player.color }}>●</span> {player.name}
                  <span className="text-gray-500"> (ID: {player.id.slice(-4)})</span>
                  {player.id === currentPlayer.id && <span className="text-blue-500"> [我]</span>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="font-medium mb-1">最近事件 ({gameEvents.length}):</div>
            <div className="bg-gray-100 p-2 rounded max-h-16 overflow-y-auto">
              {gameEvents.length === 0 ? (
                <div className="text-gray-500">无最近事件</div>
              ) : (
                gameEvents.slice(-3).map((event) => (
                  <div key={event.id} className="mb-1">
                    {event.type} - {event.playerId.slice(-4)}
                  </div>
                ))
              )}
            </div>
          </div>

          <Button onClick={clearStorage} size="sm" variant="destructive" className="w-full">
            <Trash2 className="w-4 h-4 mr-1" />
            清空存储并重新加载
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
