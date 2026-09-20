/**
 * 发言人执行态点阵光球（live 行头像内容）：角色色单色点阵 Canvas 2D 动画。
 * thinking（轨道热斑游走＝等待首字节/推理中）与 listening（向外涟漪＝正文
 * 流出）两态间弹簧缩放 + 权重交叉淡入；裁掉参考实现 MatrixOrb 的 label、
 * level 与 idle 态（本场景只有执行中一种挂载时机），尺寸钉死为头像内容盒。
 * @module dsh-group-chat/client/SpeakerOrb
 */

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'

export type SpeakerOrbState = 'thinking' | 'listening'

const TAU = Math.PI * 2
const STATES: SpeakerOrbState[] = ['thinking', 'listening']

/** 头像内容盒：28px 外框减 2px 描边 ×2；圆形轮廓由 d 截断近似。 */
const SIZE = 24
const GRID = 7
/** 点阵铺开比例：外圈点贴近描边又不被 border-radius 裁切。 */
const SPREAD = 0.86

const SCALE: Record<SpeakerOrbState, number> = { thinking: 0.94, listening: 1 }
const STIFFNESS = 180
const DAMPING = 26
const ATTACK = 0.22
const RELEASE = 0.08
const BLEND = 0.16

/** thinking 态热斑轨道（点阵归一化坐标）。 */
const ORBITERS = [
  { radius: 0.62, speed: 2.2, phase: 0, spread: 0.42 },
  { radius: 0.4, speed: -1.7, phase: 2.1, spread: 0.36 },
  { radius: 0.8, speed: 1.15, phase: 4, spread: 0.34 },
]

// no Math.abs here, its corners read as a snap at every trough
function envelope(t: number) {
  const slow = 0.5 + 0.5 * Math.sin(t * 0.62 + 0.4)
  const fast = 0.5 + 0.5 * Math.sin(t * 1.9 + 1.1)
  return 0.22 + 0.78 * (0.45 + 0.55 * slow) * fast
}

function intensityOf(
  state: SpeakerOrbState,
  d: number,
  nx: number,
  ny: number,
  t: number,
  amplitude: number,
) {
  if (state === 'listening') {
    const ripple = 0.5 + 0.5 * Math.sin(d * 4.2 - t * 3)
    return 0.32 + amplitude * (0.34 + 0.38 * ripple)
  }

  let heat = 0
  for (const o of ORBITERS) {
    const a = t * o.speed + o.phase
    const dx = nx - Math.cos(a) * o.radius
    const dy = ny - Math.sin(a) * o.radius
    heat += Math.exp(-(dx * dx + dy * dy) / (o.spread * o.spread))
  }
  return 0.26 + 0.8 * Math.min(1, heat)
}

// zoom changes devicePixelRatio, and a buffer built for the old one gets upscaled
function subscribeToZoom(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

function useDevicePixelRatio() {
  return useSyncExternalStore(
    subscribeToZoom,
    () => Math.min(window.devicePixelRatio || 1, 4),
    () => 1,
  )
}

export function SpeakerOrb(props: { state: SpeakerOrbState, color: string }): ReactNode {
  const { state, color } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(state)
  const redrawRef = useRef<(() => void) | null>(null)
  const dpr = useDevicePixelRatio()

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // scaling by buffer/size, not dpr, keeps the transform exact when it rounds
    const buffer = Math.round(SIZE * dpr)
    canvas.width = canvas.height = buffer
    ctx.scale(buffer / SIZE, buffer / SIZE)
    ctx.fillStyle = color

    const half = (GRID - 1) / 2
    const spacing = (SIZE * SPREAD) / (GRID - 1)
    const maxRadius = spacing * 0.6
    const center = SIZE / 2

    const weights: Record<SpeakerOrbState, number> = { thinking: 0, listening: 0 }
    weights[stateRef.current] = 1

    const draw = (t: number, amplitude: number, scale: number) => {
      ctx.clearRect(0, 0, SIZE, SIZE)

      for (let iy = 0; iy < GRID; iy++) {
        for (let ix = 0; ix < GRID; ix++) {
          const nx = (ix - half) / half
          const ny = (iy - half) / half
          const d = Math.hypot(nx, ny)
          // 1.12, not the square's 1.41 corner, is what makes the outline round
          if (d > 1.12) continue

          let blended = 0
          for (const s of STATES) {
            if (weights[s] < 0.001) continue
            blended += weights[s] * intensityOf(s, d, nx, ny, t, amplitude)
          }

          const intensity = Math.min(1, Math.max(0, blended))
          const radius = maxRadius * Math.exp(-d * d * 1.7) * intensity * scale
          // anything under half a device pixel renders as haze, not a dot
          if (radius * dpr < 0.5) continue

          ctx.beginPath()
          ctx.arc(
            center + (ix - half) * spacing * scale,
            center + (iy - half) * spacing * scale,
            radius,
            0,
            TAU,
          )
          ctx.fill()
        }
      }
    }

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce) {
      redrawRef.current = () => {
        const current = stateRef.current
        for (const s of STATES) weights[s] = s === current ? 1 : 0
        draw(0, envelope(0), SCALE[current])
      }
      redrawRef.current()
      return () => {
        redrawRef.current = null
      }
    }

    let t = 0
    let amplitude = 0
    let scale = SCALE[stateRef.current]
    let velocity = 0
    let last = performance.now()
    let raf = 0

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      t += dt

      const current = stateRef.current
      const target = envelope(t)
      const rate = target > amplitude ? ATTACK : RELEASE
      amplitude += (target - amplitude) * (1 - Math.pow(1 - rate, dt * 60))

      // per-state weights, so interrupting a change blends from what is on screen
      const step = 1 - Math.pow(1 - BLEND, dt * 60)
      for (const s of STATES) {
        weights[s] += ((s === current ? 1 : 0) - weights[s]) * step
      }

      velocity += (-STIFFNESS * (scale - SCALE[current]) - DAMPING * velocity) * dt
      scale += velocity * dt

      draw(t, amplitude, scale)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => cancelAnimationFrame(raf)
    // state stays out of the deps on purpose: the loop retargets, it never restarts
  }, [color, dpr])

  useEffect(() => {
    redrawRef.current?.()
  }, [state])

  return <canvas ref={canvasRef} aria-hidden className="dsgc-orb" style={{ width: SIZE, height: SIZE }} />
}
