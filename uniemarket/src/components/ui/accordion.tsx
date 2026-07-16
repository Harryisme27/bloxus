import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Minimal, dependency-free single-open accordion implementation.

interface AccordionContextValue {
  openValue: string | null;
  toggle: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error("Accordion.* components must be used inside <Accordion>");
  return ctx;
}

export interface AccordionProps {
  /** Item value that starts open. Omit for all items closed. */
  defaultValue?: string;
  className?: string;
  children: React.ReactNode;
}

export function Accordion({ defaultValue, className, children }: AccordionProps) {
  const [openValue, setOpenValue] = React.useState<string | null>(defaultValue ?? null);

  const toggle = React.useCallback((value: string) => {
    setOpenValue((current) => (current === value ? null : value));
  }, []);

  return (
    <AccordionContext.Provider value={{ openValue, toggle }}>
      <div className={cn("divide-y divide-border", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

const AccordionItemContext = React.createContext<string | null>(null);

export interface AccordionItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function AccordionItem({ value, className, children }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={value}>
      <div className={cn("py-3", className)}>{children}</div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { openValue, toggle } = useAccordionContext();
  const value = React.useContext(AccordionItemContext);
  if (value === null) throw new Error("AccordionTrigger must be used inside <AccordionItem>");
  const isOpen = openValue === value;

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={() => toggle(value)}
      className={cn(
        "flex w-full items-center justify-between gap-4 text-left font-heading text-base font-semibold text-text",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn("h-4 w-4 shrink-0 text-text-subtle transition-transform", isOpen && "rotate-180")}
        aria-hidden="true"
      />
    </button>
  );
}

export function AccordionContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { openValue } = useAccordionContext();
  const value = React.useContext(AccordionItemContext);
  if (value === null) throw new Error("AccordionContent must be used inside <AccordionItem>");
  if (openValue !== value) return null;

  return (
    <div className={cn("pt-2 text-sm text-text-muted", className)} {...props}>
      {children}
    </div>
  );
}
