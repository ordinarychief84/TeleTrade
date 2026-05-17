'use client';
import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content> & { side?: 'left' | 'right' | 'bottom' }
>(({ className, children, side = 'left', ...props }, ref) => (
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
    <Dialog.Content
      ref={ref}
      className={cn(
        'fixed z-50 bg-card text-card-foreground shadow-xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out',
        side === 'left' && 'inset-y-0 left-0 w-72 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        side === 'right' && 'inset-y-0 right-0 w-72 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        side === 'bottom' && 'inset-x-0 bottom-0 max-h-[80vh] rounded-t-xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        className
      )}
      {...props}
    >
      {children}
      <Dialog.Close className="absolute top-3 right-3 p-1 rounded-md hover:bg-accent">
        <X className="h-4 w-4" />
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
));
SheetContent.displayName = 'SheetContent';
