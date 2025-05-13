"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastProgress
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(function ({ id, title, description, action, duration = 5000, ...props }) {
        return (
          <Toast key={id} duration={duration} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose onClick={() => dismiss(id)} />
            <ToastProgress duration={duration} />
          </Toast>
        )
      })}
    </div>
  )
} 