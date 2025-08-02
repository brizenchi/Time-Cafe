"use client"

import { useCallback, useRef, useState } from "react"

interface SoundConfig {
  volume: number
  loop?: boolean
}

export function useSoundManager() {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioContextRef = useRef<AudioContext | null>(null)
  const soundBuffersRef = useRef<Map<string, AudioBuffer>>(new Map())
  const playingSoundsRef = useRef<Set<AudioBufferSourceNode>>(new Set())

  // 初始化音频上下文
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  // 创建像素风格音效
  const createPixelSound = useCallback(
    (frequency: number, duration: number, type: OscillatorType = "square") => {
      const audioContext = initAudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      oscillator.type = type

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

      return { oscillator, gainNode, duration }
    },
    [initAudioContext],
  )

  // 播放脚步声
  const playFootstep = useCallback(() => {
    if (!soundEnabled) return

    const { oscillator } = createPixelSound(150 + Math.random() * 50, 0.1)
    oscillator.start()
    oscillator.stop(initAudioContext().currentTime + 0.1)
  }, [soundEnabled, createPixelSound, initAudioContext])

  // 播放聊天提示音
  const playChatNotification = useCallback(() => {
    if (!soundEnabled) return

    const audioContext = initAudioContext()
    const { oscillator: osc1 } = createPixelSound(800, 0.1)
    const { oscillator: osc2 } = createPixelSound(1000, 0.1)

    osc1.start()
    osc1.stop(audioContext.currentTime + 0.1)

    setTimeout(() => {
      osc2.start()
      osc2.stop(audioContext.currentTime + 0.1)
    }, 100)
  }, [soundEnabled, createPixelSound, initAudioContext])

  // 播放按钮点击音
  const playButtonClick = useCallback(() => {
    if (!soundEnabled) return

    const { oscillator } = createPixelSound(600, 0.05)
    oscillator.start()
    oscillator.stop(initAudioContext().currentTime + 0.05)
  }, [soundEnabled, createPixelSound, initAudioContext])

  // 播放进入咖啡馆音效
  const playEnterCafe = useCallback(() => {
    if (!soundEnabled) return

    const audioContext = initAudioContext()
    const frequencies = [523, 659, 784, 1047] // C, E, G, C (欢快的和弦)

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const { oscillator } = createPixelSound(freq, 0.3, "sine")
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.3)
      }, index * 100)
    })
  }, [soundEnabled, createPixelSound, initAudioContext])

  // 播放错误音效（撞墙等）
  const playError = useCallback(() => {
    if (!soundEnabled) return

    const { oscillator } = createPixelSound(200, 0.2, "sawtooth")
    const audioContext = initAudioContext()

    // 创建一个下降的音调效果
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.2)
  }, [soundEnabled, createPixelSound, initAudioContext])

  // 播放背景环境音
  const playAmbientSound = useCallback(() => {
    if (!soundEnabled) return

    // 咖啡馆环境音（轻柔的白噪音）
    const audioContext = initAudioContext()
    const bufferSize = audioContext.sampleRate * 2
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
    const output = noiseBuffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.02 // 很轻的白噪音
    }

    const whiteNoise = audioContext.createBufferSource()
    const gainNode = audioContext.createGain()

    whiteNoise.buffer = noiseBuffer
    whiteNoise.loop = true
    whiteNoise.connect(gainNode)
    gainNode.connect(audioContext.destination)
    gainNode.gain.value = 0.05

    whiteNoise.start()

    return () => whiteNoise.stop()
  }, [soundEnabled, initAudioContext])

  // 播放烟花音效
  const playFirework = useCallback(() => {
    if (!soundEnabled) return

    const audioContext = initAudioContext()

    // 烟花爆炸音效 - 多层音效
    setTimeout(() => {
      const { oscillator: osc1 } = createPixelSound(100, 0.1, "sawtooth")
      osc1.start()
      osc1.stop(audioContext.currentTime + 0.1)
    }, 0)

    setTimeout(() => {
      const { oscillator: osc2 } = createPixelSound(200, 0.2, "square")
      osc2.start()
      osc2.stop(audioContext.currentTime + 0.2)
    }, 50)

    setTimeout(() => {
      const { oscillator: osc3 } = createPixelSound(400, 0.3, "sine")
      osc3.start()
      osc3.stop(audioContext.currentTime + 0.3)
    }, 100)
  }, [soundEnabled, createPixelSound, initAudioContext])

  // 播放送礼音效
  const playGiftSend = useCallback(() => {
    if (!soundEnabled) return

    const audioContext = initAudioContext()
    const frequencies = [523, 659, 784] // C, E, G (愉快的和弦)

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const { oscillator } = createPixelSound(freq, 0.2, "sine")
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.2)
      }, index * 80)
    })
  }, [soundEnabled, createPixelSound, initAudioContext])

  // 播放收到礼物音效
  const playGiftReceive = useCallback(() => {
    if (!soundEnabled) return

    const audioContext = initAudioContext()
    const { oscillator } = createPixelSound(800, 0.1, "triangle")

    // 创建上升音调效果
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.1)
  }, [soundEnabled, createPixelSound, initAudioContext])

  return {
    soundEnabled,
    setSoundEnabled,
    playFootstep,
    playChatNotification,
    playButtonClick,
    playEnterCafe,
    playError,
    playAmbientSound,
    playFirework,
    playGiftSend,
    playGiftReceive,
  }
}
