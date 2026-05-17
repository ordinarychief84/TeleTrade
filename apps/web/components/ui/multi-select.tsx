'use client';

import * as React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({ options, value, onChange, placeholder = 'Select…', className }: MultiSelectProps) {
  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };

  const label =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? options.find((o) => o.value === value[0])?.label ?? value[0]
        : `${value.length} selected`;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value.length === 0 && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="z-50 min-w-[--radix-dropdown-menu-trigger-width] max-h-72 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {options.map((opt) => {
            const checked = value.includes(opt.value);
            return (
              <DropdownMenu.Item
                key={opt.value}
                onSelect={(e) => {
                  e.preventDefault();
                  toggle(opt.value);
                }}
                className={cn(
                  'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent focus:bg-accent',
                  checked && 'font-medium'
                )}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded border border-input">
                  {checked && <Check className="h-3 w-3" />}
                </span>
                {opt.label}
              </DropdownMenu.Item>
            );
          })}
          {value.length > 0 && (
            <>
              <div className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                onSelect={(e) => {
                  e.preventDefault();
                  onChange([]);
                }}
                className="cursor-pointer rounded-sm px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent focus:bg-accent"
              >
                Clear all
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
