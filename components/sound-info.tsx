"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Headphones } from "lucide-react"

export function SoundInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          音效说明
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <Headphones className="w-4 h-4 mt-1 text-blue-500" />
          <div>
            <div className="font-medium">脚步声</div>
            <div className="text-sm text-muted-foreground">移动时播放的像素风格脚步音效</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Headphones className="w-4 h-4 mt-1 text-green-500" />
          <div>
            <div className="font-medium">聊天提示</div>
            <div className="text-sm text-muted-foreground">发送消息时的双音调提示音</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Headphones className="w-4 h-4 mt-1 text-purple-500" />
          <div>
            <div className="font-medium">按钮点击</div>
            <div className="text-sm text-muted-foreground">点击按钮时的清脆音效</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Headphones className="w-4 h-4 mt-1 text-yellow-500" />
          <div>
            <div className="font-medium">进入咖啡馆</div>
            <div className="text-sm text-muted-foreground">欢迎进入的和弦音效</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Headphones className="w-4 h-4 mt-1 text-red-500" />
          <div>
            <div className="font-medium">错误提示</div>
            <div className="text-sm text-muted-foreground">撞墙或无效操作的警告音</div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="text-sm">
            <strong>🎵 技术说明:</strong> 所有音效都使用 Web Audio API 实时生成，
            采用经典的像素游戏音效风格，包括方波、锯齿波等波形。
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
