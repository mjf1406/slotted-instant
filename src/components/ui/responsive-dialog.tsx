/** @format */

"use client"

import * as React from "react"
import clsx from "clsx"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "./button"

type Props = {
  triggerText?: string
  triggerIcon?: React.ReactNode
  trigger?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  contentClassName?: string
  title?: React.ReactNode
  description?: React.ReactNode
  breakpoint?: string
  children?: React.ReactNode
  fixedTrigger?: boolean
  hideTitleOnMobile?: boolean
  hideTriggerTextOnMobile?: boolean
  triggerClassName?: string
}

export default function ResponsiveDialog({
  triggerText,
  triggerIcon,
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  contentClassName,
  title,
  description,
  breakpoint = "(min-width: 768px)",
  children,
  fixedTrigger = false,
  hideTitleOnMobile = false,
  hideTriggerTextOnMobile = false,
  triggerClassName,
}: Props) {
  const isDesktop = useMediaQuery(breakpoint)
  const hasTrigger = Boolean(trigger || triggerText || triggerIcon)

  type BtnProps = React.ComponentPropsWithoutRef<typeof Button> & {
    className?: string
  }

  const TriggerButton = React.forwardRef<HTMLButtonElement, BtnProps>(
    (props, ref) => {
      const { className, ...rest } = props
      const textClass = hideTriggerTextOnMobile ? "hidden md:inline" : ""

      const sizeClasses = isDesktop
        ? "px-3 py-2 rounded-md text-sm"
        : "p-2 rounded-full text-base w-12 h-12 shadow-lg"

      return (
        <Button
          ref={ref}
          variant={"default"}
          className={clsx(triggerClassName, className, sizeClasses)}
          aria-label={triggerText ? undefined : "Open dialog"}
          {...rest}
        >
          {triggerIcon && <span>{triggerIcon}</span>}
          {triggerText && (
            <span className={textClass + " ml-2"}>{triggerText}</span>
          )}
        </Button>
      )
    }
  )

  TriggerButton.displayName = "ResponsiveDialogTriggerButton"

  if (isDesktop) {
    return (
      <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        {trigger ? (
          <DialogTrigger asChild>{trigger}</DialogTrigger>
        ) : hasTrigger ? (
          <DialogTrigger asChild>
            <TriggerButton />
          </DialogTrigger>
        ) : null}
        <DialogContent className={contentClassName}>
          {(title || description) && (
            <DialogHeader>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </DialogHeader>
          )}
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  // Mobile / Drawer
  const drawerTrigger = trigger ? (
    fixedTrigger ? (
      <div
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 40,
        }}
      >
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      </div>
    ) : (
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
    )
  ) : hasTrigger ? (
    fixedTrigger ? (
      <div
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 40,
        }}
      >
        <DrawerTrigger asChild>
          <TriggerButton />
        </DrawerTrigger>
      </div>
    ) : (
      <DrawerTrigger asChild>
        <TriggerButton />
      </DrawerTrigger>
    )
  ) : null

  return (
    <Drawer open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {drawerTrigger}
      <DrawerContent className={contentClassName ?? "p-5"}>
        {((title && !hideTitleOnMobile) || description) && (
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
        )}
        {children}
      </DrawerContent>
    </Drawer>
  )
}

