"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;

export function AlertDialogContent({
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40" />
      <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 border border-line bg-card p-6 focus:outline-none">
        <AlertDialogPrimitive.Title className="font-serif text-2xl">{title}</AlertDialogPrimitive.Title>
        <AlertDialogPrimitive.Description className="mt-3 text-sm leading-6 text-muted">
          {description}
        </AlertDialogPrimitive.Description>
        <div className="mt-6 flex justify-end gap-2">
          <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: "outline" }))}>
            Cancel
          </AlertDialogPrimitive.Cancel>
          <AlertDialogPrimitive.Action
            className={cn(buttonVariants({ variant: destructive ? "danger" : "default" }))}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogPrimitive.Action>
        </div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}
