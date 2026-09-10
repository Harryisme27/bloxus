import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Shared max-width container + horizontal padding used by every route/page. */
export function PageContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />;
}
