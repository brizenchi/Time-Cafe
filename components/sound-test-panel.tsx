"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSoundManager } from "../hooks/use-sound-manager"
import { Play, Volume2 } from "lucide-react"

export function SoundTestPanel() {
  const soundManager = useSoundManager()

  const testSounds = [
    { name: "脚步声", action: soundManager.playFootstep },
    { name: "聊天提示", action: soundManager.playChatNotification },
    { name: "按钮点击", action: soundManager.playButtonClick },
    { name: "进入咖啡馆", action: soundManager.playEnterCafe },
    { name: "错误音效", action: soundManager.playError },
  ]

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          音效测试面板
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between mb-4">
          <span>音效状态:</span>
          <Button
            variant={soundManager.soundEnabled ? "default" : "secondary"}
            size="sm"
            onClick={() => soundManager.setSoundEnabled(!soundManager.soundEnabled)}
          >
            {soundManager.soundEnabled ? "已开启" : "已关闭"}
          </Button>
        </div>

        {testSounds.map((sound, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => {
              soundManager.playButtonClick()
              setTimeout(sound.action, 100)
            }}
            disabled={!soundManager.soundEnabled}
          >
            <Play className="w-4 h-4 mr-2" />
            测试 {sound.name}
          </Button>
        ))}

        <div className="text-xs text-muted-foreground mt-4">
          💡 提示: 所有音效都是使用 Web Audio API 实时生成的像素风格音效
        </div>
      </CardContent>
    </Card>
  )
}
