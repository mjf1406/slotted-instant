/** @format */

"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "./button"

type ResponsiveAlertDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  contentClassName?: string
  breakpoint?: string
  children?: React.ReactNode
  hideTitleOnMobile?: boolean
  cancelText?: string
  actionText?: string
  onCancel?: () => void
  onAction?: () => void
  actionVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  disabled?: boolean
}

export default function ResponsiveAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  contentClassName,
  breakpoint = "(min-width: 768px)",
  children,
  hideTitleOnMobile = false,
  cancelText = "Cancel",
  actionText = "Continue",
  onCancel,
  onAction,
  actionVariant = "default",
  disabled = false,
}: ResponsiveAlertDialogProps) {
  const isDesktop = useMediaQuery(breakpoint)

  if (isDesktop) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className={contentClassName}>
          {(title || description) && (
            <AlertDialogHeader>
              {title && <AlertDialogTitle>{title}</AlertDialogTitle>}
              {description && (
                <AlertDialogDescription>{description}</AlertDialogDescription>
              )}
            </AlertDialogHeader>
          )}
          {children}
          <AlertDialogFooter>
            {onCancel && (
              <AlertDialogCancel onClick={onCancel} disabled={disabled}>
                {cancelText}
              </AlertDialogCancel>
            )}
            {onAction && (
              <AlertDialogAction
                onClick={onAction}
                disabled={disabled}
                className={
                  actionVariant === "destructive"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : ""
                }
              >
                {actionText}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  // Mobile / Drawer
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={contentClassName ?? "p-5"}>
        {((title && !hideTitleOnMobile) || description) && (
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
        )}
        {children}
        <DrawerFooter>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={disabled}>
              {cancelText}
            </Button>
          )}
          {onAction && (
            <Button
              variant={actionVariant}
              onClick={onAction}
              disabled={disabled}
              className={
                actionVariant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {actionText}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

