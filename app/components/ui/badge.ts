"use client"

import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { HTMLAttributes, ReactNode } from "react"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
  className?: string
  children?: ReactNode
}

export function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: BadgeProps) {
  // 显式验证输入值
  const validVariant = (variant as string) in badgeVariants.variants.variant 
    ? variant 
    : "default";
  
  // 使用有效值生成类名
  const validClassName = cn(badgeVariants({ variant: validVariant }), className || "");
  
  return (
    <div className={validClassName} {...props}>
      {children}
    </div>
  );
}

export { badgeVariants } 
