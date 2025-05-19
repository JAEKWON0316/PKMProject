"use client"

import React, { useRef, useEffect, useState } from "react"
import { useMousePosition } from "@/lib/hooks/use-mouse-position"

interface SparklesProps {
  id?: string
  background?: string
  minSize?: number
  maxSize?: number
  particleDensity?: number
  className?: string
  particleColor?: string
  particleOffsetX?: number
  particleOffsetY?: number
  speed?: number
}

export const SparklesCore = ({
  id,
  background = "transparent",
  minSize = 0.4,
  maxSize = 1,
  speed = 1,
  particleDensity = 100,
  className,
  particleColor = "#FFF",
  particleOffsetX = 0,
  particleOffsetY = 0,
}: SparklesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const context = useRef<CanvasRenderingContext2D | null>(null)
  const mousePosition = useMousePosition()
  const particles = useRef<any[]>([])
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (canvasContainerRef.current) {
      const { width, height } = canvasContainerRef.current.getBoundingClientRect()
      setDimensions({ width, height })
    }
  }, [])

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext("2d")
    }

    const handleResize = () => {
      if (canvasContainerRef.current) {
        const { width, height } = canvasContainerRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!context.current || !dimensions.width || !dimensions.height) return

    const createParticles = () => {
      particles.current = []
      const particleCount = particleDensity
      for (let i = 0; i < particleCount; i++) {
        const particle = {
          x: Math.random() * dimensions.width,
          y: Math.random() * dimensions.height,
          size: Math.random() * (maxSize - minSize) + minSize,
          opacity: Math.random(),
          color: particleColor,
          velocity: {
            x: (Math.random() - 0.5) * speed,
            y: (Math.random() - 0.5) * speed,
          },
        }
        particles.current.push(particle)
      }
    }

    createParticles()

    const renderParticles = () => {
      if (!context.current || !dimensions.width || !dimensions.height) return
      context.current.clearRect(0, 0, dimensions.width, dimensions.height)
      context.current.fillStyle = background
      context.current.fillRect(0, 0, dimensions.width, dimensions.height)

      particles.current.forEach((particle) => {
        if (particle.opacity <= 0.1) {
          particle.opacity = 0
        }
        context.current!.beginPath()
        context.current!.arc(
          particle.x,
          particle.y,
          particle.size,
          0,
          Math.PI * 2
        )
        context.current!.fillStyle = particle.color
        context.current!.globalAlpha = particle.opacity
        context.current!.fill()
        context.current!.globalAlpha = 1

        // Add slight mouse interaction
        if (mousePosition.x !== null && mousePosition.y !== null) {
          const dx = mousePosition.x - particle.x
          const dy = mousePosition.y - particle.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const maxDistance = 200
          if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance
            particle.velocity.x += (dx / distance) * force * 0.02
            particle.velocity.y += (dy / distance) * force * 0.02
          }
        }

        particle.x += particle.velocity.x + particleOffsetX
        particle.y += particle.velocity.y + particleOffsetY

        // Reset particles that are out of bounds
        if (
          particle.x < 0 ||
          particle.x > dimensions.width ||
          particle.y < 0 ||
          particle.y > dimensions.height
        ) {
          if (Math.random() < 0.5) {
            // Reset on a border
            if (Math.random() < 0.5) {
              // Reset on left or right border
              particle.x = Math.random() < 0.5 ? 0 : dimensions.width
              particle.y = Math.random() * dimensions.height
            } else {
              // Reset on top or bottom border
              particle.x = Math.random() * dimensions.width
              particle.y = Math.random() < 0.5 ? 0 : dimensions.height
            }
          } else {
            // Reset at a random position
            particle.x = Math.random() * dimensions.width
            particle.y = Math.random() * dimensions.height
          }
          particle.velocity.x = (Math.random() - 0.5) * speed
          particle.velocity.y = (Math.random() - 0.5) * speed
        }
      })

      animationRef.current = requestAnimationFrame(renderParticles)
    }

    renderParticles()
  }, [dimensions, maxSize, minSize, particleColor, particleDensity, particleOffsetX, particleOffsetY, speed, background, mousePosition.x, mousePosition.y])

  return (
    <div
      ref={canvasContainerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <canvas
        id={id}
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
    </div>
  )
}
