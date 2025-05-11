"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive"
  onOpenChange?: (open: boolean) => void
  open?: boolean
}

export type ToastActionElement = React.ReactElement

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
          variant === "default" &&
            "border-border bg-background text-foreground",
          variant === "destructive" &&
            "destructive group border-destructive bg-destructive text-destructive-foreground",
          className
        )}
        {...props}
      />
    )
  }
)
Toast.displayName = "Toast"

const ToastClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 transition-opacity hover:text-foreground focus:outline-none focus:ring-2 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    onClick={(e) => {
      e.preventDefault();
      const toast = e.currentTarget.closest('[data-state]');
      if (toast) {
        if (typeof props.onClick === 'function') {
          props.onClick(e);
        }
        
        const toastProps = (toast as any)._reactProps || (toast as any).__reactProps;
        if (toastProps && typeof toastProps.onOpenChange === 'function') {
          toastProps.onOpenChange(false);
        } else {
          toast.setAttribute('data-state', 'closed');
          setTimeout(() => {
            toast.remove();
          }, 300);
        }
      }
    }}
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
))
ToastClose.displayName = "ToastClose"

const ToastTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

export { Toast, ToastClose, ToastTitle, ToastDescription } 