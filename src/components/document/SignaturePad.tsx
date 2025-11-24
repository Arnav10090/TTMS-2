"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

export type SignaturePadHandle = {
  clear: () => void
  getDataURL: (type?: string) => string
  hasSignature: () => boolean
  loadImage: (url: string) => Promise<void>
  setImageFromFile: (file: File) => Promise<void>
}

export default forwardRef<SignaturePadHandle, { onChangeHasSignature?: (v: boolean) => void }>(function SignaturePad({ onChangeHasSignature }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(dpr, dpr)
  }, [])

  useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)
      setTouched(false)
      onChangeHasSignature?.(false)
    },
    getDataURL(type = 'image/png') {
      const canvas = canvasRef.current!
      return canvas.toDataURL(type)
    },
    hasSignature() {
      return touched
    },
    async loadImage(url: string) {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const rect = canvas.getBoundingClientRect()
      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          ctx.clearRect(0, 0, rect.width, rect.height)
          const scale = Math.min(rect.width / img.width, rect.height / img.height)
          const dw = img.width * scale
          const dh = img.height * scale
          const dx = (rect.width - dw) / 2
          const dy = (rect.height - dh) / 2
          ctx.drawImage(img, dx, dy, dw, dh)
          setTouched(true)
          onChangeHasSignature?.(true)
          resolve()
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = url
      })
    },
    async setImageFromFile(file: File) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
      await (this as any).loadImage(dataUrl)
    }
  }), [touched, onChangeHasSignature])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const draw = (x: number, y: number, move = false) => {
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.strokeStyle = '#1e40af'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    if (!move) { ctx.beginPath(); ctx.moveTo(x, y) } else { ctx.lineTo(x, y); ctx.stroke() }
  }

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true)
    setTouched(true)
    onChangeHasSignature?.(true)
    const p = getPos(e)
    draw(p.x, p.y)
  }

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return
    const p = getPos(e)
    draw(p.x, p.y, true)
  }

  const end = () => setDrawing(false)

  return (
    <div className="border border-slate-300 rounded-ui overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-32 touch-none"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
    </div>
  )
})
