import { useState } from "react";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CreditCard, Lock, Smartphone } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export type StripePromise = ReturnType<typeof loadStripe>;

function StripePaymentForm({
  orderId,
  total,
  initialMethod,
  onComplete,
}: {
  orderId: string;
  total: number;
  initialMethod: "apple" | "card";
  onComplete: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [method, setMethod] = useState<"apple" | "card">(initialMethod);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState<boolean | null>(null);

  async function confirmPayment() {
    if (!stripe || !elements || busy) return;
    setBusy(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}?stripe=success`,
      },
      // Card payments stay on Bloxus. A bank-required authentication step can
      // still temporarily redirect and then return to this order.
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Payment could not be completed.");
      setBusy(false);
      return;
    }
    onComplete();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#343844] bg-[#111218] p-2">
        <button
          type="button"
          onClick={() => setMethod("apple")}
          className={cn(
            "flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all",
            method === "apple"
              ? "bg-yellow text-[#17200f] shadow-glow-amber"
              : "text-text-muted hover:bg-[#252833] hover:text-text",
          )}
        >
          <Smartphone className="h-4 w-4" aria-hidden />
          Apple Pay
        </button>
        <button
          type="button"
          onClick={() => setMethod("card")}
          className={cn(
            "flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all",
            method === "card"
              ? "bg-yellow text-[#17200f] shadow-glow-amber"
              : "text-text-muted hover:bg-[#252833] hover:text-text",
          )}
        >
          <CreditCard className="h-4 w-4" aria-hidden />
          Card
        </button>
      </div>

      {method === "apple" ? (
        <div className="rounded-2xl border border-[#343844] bg-[#1a1c23] p-4">
          <div className="mb-4 text-center">
            <p className="font-heading text-base font-bold text-text">Pay with Apple Pay</p>
            <p className="mt-1 text-xs text-text-muted">
              Continue below. A supported computer may show a code to scan with your iPhone.
            </p>
          </div>
          <ExpressCheckoutElement
            options={{
              buttonHeight: 48,
              buttonType: { applePay: "plain" },
              buttonTheme: { applePay: "white" },
              paymentMethods: {
                applePay: "always",
                googlePay: "never",
                link: "never",
                paypal: "never",
                amazonPay: "never",
                klarna: "never",
              },
              layout: { maxColumns: 1, maxRows: 1, overflow: "never" },
            }}
            onReady={({ availablePaymentMethods }) => {
              setAppleAvailable(Boolean(availablePaymentMethods?.applePay));
            }}
            onConfirm={() => void confirmPayment()}
          />
          {appleAvailable === false ? (
            <p className="mt-3 rounded-xl border border-yellow/25 bg-yellow/10 p-3 text-center text-xs text-text-muted">
              Apple Pay is unavailable on this browser or device. Use Safari on a supported Apple device, or choose Card.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#343844] bg-[#1a1c23] p-4 sm:p-5">
          <PaymentElement
            options={{
              layout: {
                type: "accordion",
                defaultCollapsed: false,
                radios: "never",
                spacedAccordionItems: false,
              },
              wallets: { applePay: "never", googlePay: "never" },
            }}
          />
          <button
            type="button"
            disabled={!stripe || !elements || busy}
            onClick={() => void confirmPayment()}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-yellow font-heading text-sm font-extrabold text-[#17200f] transition-colors hover:bg-yellow-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Lock className="h-4 w-4" aria-hidden />
            {busy ? "Processing..." : `Pay ${formatPrice(total)}`}
          </button>
        </div>
      )}

      {error ? (
        <p className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>
      ) : null}
      <p className="flex items-center justify-center gap-2 text-center text-xs text-text-subtle">
        <Lock className="h-3.5 w-3.5" aria-hidden />
        Payment details are encrypted and handled securely by Stripe.
      </p>
    </div>
  );
}

export function StripeInlineCheckout({
  stripePromise,
  clientSecret,
  orderId,
  total,
  initialMethod = "card",
  onComplete,
}: {
  stripePromise: StripePromise;
  clientSecret: string;
  orderId: string;
  total: number;
  initialMethod?: "apple" | "card";
  onComplete: () => void;
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        fonts: [
          {
            cssSrc:
              "https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap",
          },
        ],
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#7cc35a",
            colorBackground: "#20222b",
            colorText: "#ffffff",
            colorTextSecondary: "#e2e4e8",
            colorDanger: "#ff6b6b",
            borderRadius: "12px",
            fontFamily: "'Baloo 2', Arial, sans-serif",
            spacingUnit: "4px",
          },
          rules: {
            ".Input": { border: "1px solid #444957", boxShadow: "none", color: "#ffffff" },
            ".Input:focus": {
              border: "1px solid #7cc35a",
              boxShadow: "0 0 0 3px rgba(124,195,90,.14)",
            },
            ".Input::placeholder": { color: "#9298a3" },
            ".Label": { color: "#ffffff", fontWeight: "600" },
            ".TabLabel": { color: "#ffffff", fontWeight: "700" },
            ".AccordionItem": { color: "#ffffff" },
            ".Block": { color: "#ffffff" },
            ".Text": { color: "#e2e4e8" },
          },
        },
      }}
    >
      <StripePaymentForm
        orderId={orderId}
        total={total}
        initialMethod={initialMethod}
        onComplete={onComplete}
      />
    </Elements>
  );
}
