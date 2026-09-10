// Hiện dần một khối khi nó cuộn vào khung nhìn (kiểu bloxmart). Dùng
// IntersectionObserver, chỉ chạy 1 lần. Tôn trọng prefers-reduced-motion qua
// CSS (.um-reveal) nên không cần xử lý thêm ở JS.
import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface RevealProps {
  children: ReactNode;
  /** Trễ (ms) trước khi hiện — để các khối kế nhau hiện lần lượt. */
  delay?: number;
  className?: string;
  as?: ElementType;
}

export function Reveal({ children, delay = 0, className, as: Tag = "div" }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("um-reveal", visible && "um-reveal-visible", className)}
    >
      {children}
    </Tag>
  );
}
