"use client"

import { useCallback, useState, useMemo } from "react"

export interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: "firework" | "gift" | "heart" | "star"
}

export interface Effect {
  id: string
  x: number
  y: number
  particles: Particle[]
  duration: number
  startTime: number
  type: "firework" | "gift"
}

export function useEffects() {
  const [effects, setEffects] = useState<Effect[]>([])

  // 创建烟花特效
  const createFirework = useCallback((x: number, y: number, color?: string) => {
    const particles: Particle[] = []
    const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff"]

    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20
      const speed = 2 + Math.random() * 2
      particles.push({
        id: `firework-${i}-${Date.now()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 40,
        maxLife: 40,
        color: color || colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 2,
        type: "firework",
      })
    }

    const effect: Effect = {
      id: `firework-${Date.now()}`,
      x,
      y,
      particles,
      duration: 1500,
      startTime: Date.now(),
      type: "firework",
    }

    setEffects((prev) => [...prev, effect])
  }, [])

  // 创建送礼特效
  const createGiftEffect = useCallback((fromX: number, fromY: number, toX: number, toY: number, giftType: string) => {
    const particles: Particle[] = []
    const colors =
      giftType === "coffee"
        ? ["#8B4513", "#D2691E"]
        : giftType === "flower"
          ? ["#ff6b6b", "#ff9ff3", "#96ceb4"]
          : ["#4ecdc4", "#45b7d1"]

    for (let i = 0; i < 15; i++) {
      const progress = i / 15
      const x = fromX + (toX - fromX) * progress
      const y = fromY + (toY - fromY) * progress

      particles.push({
        id: `gift-${i}-${Date.now()}`,
        x: x + (Math.random() - 0.5) * 15,
        y: y + (Math.random() - 0.5) * 15,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        life: 30,
        maxLife: 30,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 2,
        type: giftType === "flower" ? "heart" : "star",
      })
    }

    const effect: Effect = {
      id: `gift-${Date.now()}`,
      x: toX,
      y: toY,
      particles,
      duration: 1000,
      startTime: Date.now(),
      type: "gift",
    }

    setEffects((prev) => [...prev, effect])
  }, [])

  // 更新特效
  const updateEffects = useCallback(() => {
    setEffects((prevEffects) => {
      const currentTime = Date.now()

      return prevEffects
        .map((effect) => ({
          ...effect,
          particles: effect.particles
            .map((particle) => ({
              ...particle,
              x: particle.x + particle.vx,
              y: particle.y + particle.vy,
              vy: particle.vy + 0.05, // 重力
              life: particle.life - 1,
            }))
            .filter((particle) => particle.life > 0),
        }))
        .filter((effect) => effect.particles.length > 0 && currentTime - effect.startTime < effect.duration)
    })
  }, [])

  // 绘制特效
  const drawEffects = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      effects.forEach((effect) => {
        effect.particles.forEach((particle) => {
          const alpha = particle.life / particle.maxLife
          ctx.save()
          ctx.globalAlpha = alpha

          if (particle.type === "heart") {
            ctx.fillStyle = particle.color
            const size = particle.size
            ctx.beginPath()
            ctx.arc(particle.x - size / 2, particle.y, size / 2, 0, Math.PI, true)
            ctx.arc(particle.x + size / 2, particle.y, size / 2, 0, Math.PI, true)
            ctx.arc(particle.x, particle.y + size, size, 0, Math.PI * 2)
            ctx.fill()
          } else if (particle.type === "star") {
            ctx.fillStyle = particle.color
            const size = particle.size
            ctx.beginPath()
            for (let i = 0; i < 5; i++) {
              const angle = (i * Math.PI * 2) / 5 - Math.PI / 2
              const x = particle.x + Math.cos(angle) * size
              const y = particle.y + Math.sin(angle) * size
              if (i === 0) ctx.moveTo(x, y)
              else ctx.lineTo(x, y)
            }
            ctx.closePath()
            ctx.fill()
          } else {
            ctx.fillStyle = particle.color
            ctx.beginPath()
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
            ctx.fill()
          }

          ctx.restore()
        })
      })
    },
    [effects],
  )

  return useMemo(
    () => ({
      effects,
      createFirework,
      createGiftEffect,
      updateEffects,
      drawEffects,
    }),
    [effects, createFirework, createGiftEffect, updateEffects, drawEffects],
  )
}
