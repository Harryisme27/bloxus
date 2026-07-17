import { ShieldAlert, FileText } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { cn } from "@/lib/utils";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    legal: "Pháp lý",
    lastUpdated: "Cập nhật lần cuối:",
    demoTitle: "Đây là nội dung demo.",
    demoBody:
      " Uniemarket là website trình diễn, không bán hàng và không thu tiền thật. Các điều khoản dưới đây chỉ mang tính minh hoạ, không có giá trị pháp lý.",
    toc: "Mục lục",
  },
  en: {
    legal: "Legal",
    lastUpdated: "Last updated:",
    demoTitle: "This is demo content.",
    demoBody:
      " Uniemarket is a showcase website — it does not sell anything and never collects real money. The terms below are for illustration only and carry no legal force.",
    toc: "Contents",
  },
};

export interface LegalSection {
  id: string;
  heading: string;
  /** Paragraphs and/or bullet lists rendered in order. */
  body: LegalBlock[];
}

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] };

export interface LegalPageLayoutProps {
  title: string;
  /** e.g. "16/07/2026" */
  lastUpdated: string;
  intro?: string;
  sections: LegalSection[];
  className?: string;
}

/** Shared layout for the Terms / Privacy / Refund static legal pages. */
export function LegalPageLayout({
  title,
  lastUpdated,
  intro,
  sections,
  className,
}: LegalPageLayoutProps) {
  const t = usePick(STR);
  return (
    <PageContainer className={cn("py-12 sm:py-16", className)}>
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-2 text-yellow">
          <FileText className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider">{t.legal}</span>
        </div>
        <h1 className="mt-2 font-heading text-3xl font-bold text-text sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-text-subtle">{t.lastUpdated} {lastUpdated}</p>

        {/* Demo notice */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-yellow-soft bg-yellow-soft p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" aria-hidden="true" />
          <p className="text-sm text-text-muted">
            <span className="font-semibold text-text">{t.demoTitle}</span>{t.demoBody}
          </p>
        </div>

        {intro ? <p className="mt-6 text-sm leading-relaxed text-text-muted">{intro}</p> : null}

        <div className="mt-8 grid gap-10 lg:grid-cols-[220px,1fr]">
          {/* Table of contents */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-subtle">
              {t.toc}
            </p>
            <nav className="flex flex-col gap-1">
              {sections.map((section, i) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
                >
                  <span className="mr-2 font-mono text-xs text-text-subtle">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {section.heading}
                </a>
              ))}
            </nav>
          </aside>

          {/* Sections */}
          <div className="min-w-0 space-y-10">
            {sections.map((section, i) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="font-heading text-xl font-bold text-text">
                  <span className="mr-2 text-yellow">{i + 1}.</span>
                  {section.heading}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-text-muted">
                  {section.body.map((block, bi) =>
                    block.type === "p" ? (
                      <p key={bi}>{block.text}</p>
                    ) : (
                      <ul key={bi} className="list-disc space-y-1.5 pl-5 marker:text-yellow">
                        {block.items.map((item, ii) => (
                          <li key={ii}>{item}</li>
                        ))}
                      </ul>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
