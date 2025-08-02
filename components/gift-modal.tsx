"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Coffee, Heart, Cake, Gift } from "lucide-react"

interface GiftModalProps {
  isOpen: boolean
  onClose: () => void
  targetPlayer: { name: string; id: string } | null
  onSendGift: (giftType: string) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  popoverStyle?: React.CSSProperties
}

const gifts = [
  { id: "coffee", name: "咖啡", icon: Coffee, color: "#8B4513", description: "一杯香浓的咖啡" },
  { id: "flower", name: "鲜花", icon: Heart, color: "#ff6b6b", description: "美丽的花束" },
  { id: "cake", name: "蛋糕", icon: Cake, color: "#feca57", description: "甜美的小蛋糕" },
  { id: "gift", name: "礼物", icon: Gift, color: "#4ecdc4", description: "神秘的礼物盒" },
]

export function GiftModal({ isOpen, onClose, targetPlayer, onSendGift, onMouseEnter, onMouseLeave, popoverStyle }: GiftModalProps) {
  const [selectedGift, setSelectedGift] = useState<string | null>(null)

  if (!isOpen || !targetPlayer) return null

  const handleSendGift = () => {
    if (selectedGift) {
      onSendGift(selectedGift)
      setSelectedGift(null)
      onClose()
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-2 z-50" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={popoverStyle}>
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              送礼给 {targetPlayer.name}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">选择一个礼物送给 {targetPlayer.name}：</div>

          <div className="grid grid-cols-2 gap-3">
            {gifts.map((gift) => {
              const Icon = gift.icon
              return (
                <Button
                  key={gift.id}
                  variant={selectedGift === gift.id ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => setSelectedGift(gift.id)}
                >
                  <Icon className="w-8 h-8" style={{ color: gift.color }} />
                  <div className="text-center">
                    <div className="font-medium">{gift.name}</div>
                    <div className="text-xs text-muted-foreground">{gift.description}</div>
                  </div>
                </Button>
              )
            })}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              取消
            </Button>
            <Button onClick={handleSendGift} disabled={!selectedGift} className="flex-1">
              送出礼物
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
