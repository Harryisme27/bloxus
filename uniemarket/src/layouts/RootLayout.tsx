import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChatWidget } from "@/components/ChatWidget";

/** Shared shell for every route: sticky navbar, page outlet, footer, and the
 * floating chat widget. sonner's <Toaster/> is mounted once in main.tsx
 * (app root) rather than here, to avoid rendering two <Toaster/> instances
 * at once — sonner would otherwise show every toast twice. */
export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
