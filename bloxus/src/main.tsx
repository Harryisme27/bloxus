import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

// Self-hosted fonts (see fontsource packages in package.json). Weights match
// One font across headings, body text, form controls, prices, and order codes.
// Loading both subsets prevents fallback glyphs from changing the appearance.
import "@fontsource/baloo-2/latin-400.css";
import "@fontsource/baloo-2/latin-500.css";
import "@fontsource/baloo-2/latin-600.css";
import "@fontsource/baloo-2/latin-700.css";
import "@fontsource/baloo-2/latin-800.css";
import "@fontsource/baloo-2/vietnamese-400.css";
import "@fontsource/baloo-2/vietnamese-500.css";
import "@fontsource/baloo-2/vietnamese-600.css";
import "@fontsource/baloo-2/vietnamese-700.css";
import "@fontsource/baloo-2/vietnamese-800.css";

import "./index.css";
import { router } from "./App";
import { useAuthStore } from "./store/authStore";
import { ConfirmProvider } from "./components/ui/confirm";

// Xác định phiên đăng nhập Supabase ngay khi app khởi động. Khi CHƯA cấu hình
// Supabase (thiếu .env.local) thì init() thoát êm — storefront demo vẫn chạy.
useAuthStore.getState().init();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <RouterProvider router={router} />
      </ConfirmProvider>
      <Toaster
        theme="dark"
        position="bottom-left"
        toastOptions={{
          classNames: {
            toast: "!bg-surface-2 !border !border-border-strong !text-text",
            title: "!text-text",
            description: "!text-text-muted",
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
);
