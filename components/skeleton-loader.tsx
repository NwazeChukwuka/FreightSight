"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
  variant?: "default" | "text" | "circular" | "rectangular" | "rounded"
  width?: string | number
  height?: string | number
  lines?: number
}

export function Skeleton({ 
  className, 
  variant = "default", 
  width, 
  height, 
  lines = 1 
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-muted"
  
  const variantClasses = {
    default: "rounded-md",
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-none",
    rounded: "rounded-lg"
  }

  const style = {
    width: width || (variant === "text" ? "100%" : undefined),
    height: height || (variant === "text" ? "1rem" : undefined)
  }

  if (variant === "text" && lines > 1) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClasses, variantClasses[variant])}
            style={{
              ...style,
              width: i === lines - 1 ? "70%" : "100%" // Last line shorter
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  )
}

// Predefined skeleton components for common use cases

export function ParcelCardSkeleton() {
  return (
    <div className="glass p-6 rounded-lg">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Skeleton width="60%" height="1.5rem" className="mb-2" />
          <Skeleton width="40%" height="1rem" />
        </div>
        <Skeleton width="80px" height="32px" variant="rounded" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Skeleton width="30%" height="0.75rem" />
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="90%" height="1rem" />
        </div>
        <div className="space-y-2">
          <Skeleton width="30%" height="0.75rem" />
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="85%" height="1rem" />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <Skeleton width="120px" height="1rem" />
        <div className="flex gap-2">
          <Skeleton width="80px" height="32px" variant="rounded" />
          <Skeleton width="80px" height="32px" variant="rounded" />
        </div>
      </div>
    </div>
  )
}

export function TrackingHistorySkeleton() {
  return (
    <div className="glass overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-semibold">
              <Skeleton width="100px" height="1rem" />
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold">
              <Skeleton width="80px" height="1rem" />
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold">
              <Skeleton width="60px" height="1rem" />
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold">
              <Skeleton width="80px" height="1rem" />
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold">
              <Skeleton width="60px" height="1rem" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-border/5">
              <td className="py-3 px-4">
                <Skeleton width="120px" height="1rem" />
              </td>
              <td className="py-3 px-4">
                <Skeleton width="80px" height="1rem" />
              </td>
              <td className="py-3 px-4">
                <Skeleton width="100px" height="24px" variant="rounded" />
              </td>
              <td className="py-3 px-4">
                <Skeleton width="100px" height="1rem" />
              </td>
              <td className="py-3 px-4">
                <Skeleton width="32px" height="32px" variant="circular" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <Skeleton width="40px" height="40px" variant="circular" />
            <Skeleton width="60px" height="1rem" />
          </div>
          <Skeleton width="80%" height="2rem" className="mb-2" />
          <Skeleton width="60%" height="1rem" />
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="glass p-6 rounded-lg space-y-6">
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton width="30%" height="1rem" />
            <Skeleton width="100%" height="2.5rem" variant="rounded" />
          </div>
        ))}
      </div>
      
      <div className="flex gap-4 pt-4">
        <Skeleton width="120px" height="2.5rem" variant="rounded" />
        <Skeleton width="100px" height="2.5rem" variant="rounded" />
      </div>
    </div>
  )
}

export function SearchSkeleton() {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-1 relative">
        <Skeleton width="100%" height="3rem" variant="rounded" />
      </div>
      <Skeleton width="150px" height="3rem" variant="rounded" />
    </div>
  )
}

export function TableSkeleton({ rows = 10, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="glass overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="text-left py-3 px-4 text-sm font-semibold">
                <Skeleton width={`${80 + Math.random() * 40}px`} height="1rem" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-border/5">
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="py-3 px-4">
                  <Skeleton width={`${60 + Math.random() * 80}px`} height="1rem" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
