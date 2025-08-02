"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Gift, Heart } from "lucide-react"

interface EffectsDemoProps {
  onFirework: () => void
  onGiftEffect: () => void
}

export function EffectsDemo({ onFirework, onGiftEffect }: EffectsDemoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          特效演示
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={onFirework} className="w-full justify-start bg-transparent" variant="outline">
          <Sparkles className="w-4 h-4 mr-2" />
          烟花特效演示
        </Button>

        <Button onClick={onGiftEffect} className="w-full justify-start bg-transparent" variant="outline">
          <Gift className="w-4 h-4 mr-2" />
          送礼特效演示
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <Heart className="w-3 h-3 text-red-500" />
            <span>点击自己的角色可以放烟花</span>
          </div>
          <div className="flex items-center gap-2">
            <Gift className="w-3 h-3 text-blue-500" />
            <span>点击其他玩家可以送礼物</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
