import { create } from "zustand";
import { persist } from "zustand/middleware";

// Controls how the (fake) checkout flow resolves in this demo. A later agent
// wiring up /checkout can read `scenario` to decide whether to route the
// user to /order-success, /payment-failed, or /payment-cancelled.
export type DemoScenario = "success" | "failed" | "cancelled";

interface DemoState {
  scenario: DemoScenario;
  setScenario: (scenario: DemoScenario) => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      scenario: "success",
      setScenario: (scenario) => set({ scenario }),
    }),
    { name: "uniemarket-demo" },
  ),
);
