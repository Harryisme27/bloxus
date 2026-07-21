import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";

import { Home } from "@/routes/Home";
import { GamesCatalog } from "@/routes/GamesCatalog";
import { GameDetail } from "@/routes/GameDetail";
import { ItemDetail } from "@/routes/ItemDetail";
import { Cart } from "@/routes/Cart";
import { Checkout } from "@/routes/Checkout";
import { OrderSuccess } from "@/routes/OrderSuccess";
import { Login } from "@/routes/Login";
import { Register } from "@/routes/Register";
import { Profile } from "@/routes/Profile";
import { Dashboard } from "@/routes/Dashboard";
import { OrderHistory } from "@/routes/OrderHistory";
import { OrderDetail } from "@/routes/OrderDetail";
import { Proofs } from "@/routes/Proofs";
import { Messages } from "@/routes/Messages";
import { About } from "@/routes/About";
import { Faq } from "@/routes/Faq";
import { Contact } from "@/routes/Contact";
import { Terms } from "@/routes/Terms";
import { Privacy } from "@/routes/Privacy";
import { Refund } from "@/routes/Refund";
import { Tutorial } from "@/routes/Tutorial";
import { Ctv } from "@/routes/Ctv";
import { NotFound } from "@/routes/NotFound";

// Khu làm việc /work (admin + Seller) — Phase 1 mới có khung + stub.
import { RequireRole } from "@/components/guards/RequireRole";
import { WorkLayout } from "@/routes/work/WorkLayout";
import { WorkDashboard } from "@/routes/work/WorkDashboard";
import { WorkOrders } from "@/routes/work/WorkOrders";
import { WorkOrderDetail } from "@/routes/work/WorkOrderDetail";
import { WorkPayments } from "@/routes/work/WorkPayments";
import { WorkCatalog } from "@/routes/work/WorkCatalog";
import { WorkCtv } from "@/routes/work/WorkCtv";
import { WorkWallet } from "@/routes/work/WorkWallet";
import { WorkChat } from "@/routes/work/WorkChat";
import { WorkSettings } from "@/routes/work/WorkSettings";

// Every route in the spec is wired here, each backed by a stub component in
// src/routes/*. Later agents fill in real page content by editing those
// stub files — this router/tree should rarely need to change.
export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "games", element: <GamesCatalog /> },
      { path: "games/:slug", element: <GameDetail /> },
      { path: "item/:id", element: <ItemDetail /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "order-success", element: <OrderSuccess /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "profile", element: <Profile /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "orders", element: <OrderHistory /> },
      { path: "orders/:id", element: <OrderDetail /> },
      { path: "proofs", element: <Proofs /> },
      { path: "messages", element: <Messages /> },
      { path: "ctv", element: <Ctv /> },
      { path: "about", element: <About /> },
      { path: "faq", element: <Faq /> },
      { path: "contact", element: <Contact /> },
      { path: "terms", element: <Terms /> },
      { path: "privacy", element: <Privacy /> },
      { path: "refund", element: <Refund /> },
      { path: "tutorial", element: <Tutorial /> },
      // Khu quản trị cũ /admin giờ nằm trong /work.
      { path: "admin", element: <Navigate to="/work" replace /> },
      {
        path: "work",
        element: (
          <RequireRole roles={["admin", "manager", "ctv"]}>
            <WorkLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <WorkDashboard /> },
          { path: "orders", element: <WorkOrders /> },
          { path: "orders/:id", element: <WorkOrderDetail /> },
          { path: "payments", element: <WorkPayments /> },
          { path: "catalog", element: <WorkCatalog /> },
          { path: "ctv", element: <WorkCtv /> },
          { path: "wallet", element: <WorkWallet /> },
          { path: "chat", element: <WorkChat /> },
          { path: "settings", element: <WorkSettings /> },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
