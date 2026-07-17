// Web Audio "new order" beep — no audio asset, no imports.
// Short 880Hz sine (gain 0.08, ~0.15s). Called from NotificationBell's realtime
// handler when an 'order_new' notification lands and the viewer is staff.
//
// Autoplay policies may block sound until the user has interacted with the page;
// every call is wrapped in try/catch so a blocked beep is a silent no-op.

type AudioContextCtor = typeof AudioContext;

// Reuse a single AudioContext across beeps (browsers cap the number you can open).
let audioCtx: AudioContext | null = null;

/** Play a short amber "ding" for a new order. Safe to call anytime — never throws. */
export function playOrderBeep(): void {
  try {
    const w = window as typeof window & { webkitAudioContext?: AudioContextCtor };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return;

    if (!audioCtx) audioCtx = new Ctor();
    const ctx = audioCtx;
    // Contexts start "suspended" until a user gesture — try to wake it up.
    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.08, now);
    // Gentle exponential release avoids an audible click at the tail.
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Autoplay blocked (no user gesture yet) — silently ignore.
  }
}
