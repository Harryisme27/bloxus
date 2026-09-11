import { useEffect, useRef, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, ChevronsRight, Eye, EyeOff, KeyRound, Lock, LogIn, Mail } from "lucide-react";
import { AuthCard } from "@/components/account/AuthCard";
import { DiscordIcon } from "@/components/account/SocialLoginButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TurnstileWidget, turnstileEnabled } from "@/components/account/TurnstileWidget";
import { useAuthStore } from "@/store/authStore";
import { usePick } from "@/i18n";

const STR = {
  en: {
    title: "Log in",
    subtitle: "Access your dashboard, orders, and transaction proofs.",
    slideLabel: "Click or drag to login",
    slideAria: "Click or drag the Discord icon to login",
    redirecting: "Redirecting…",
    noAccount: "Don't have an account?",
    signUpNow: "Sign up now",
    email: "Email or display name",
    emailPlaceholder: "name@example.com",
    password: "Password",
    passwordPlaceholder: "Your password",
    hidePassword: "Hide password",
    showPassword: "Show password",
    forgot: "Forgot password?",
    signingIn: "Signing in…",
    signIn: "Log in",
    welcomeBack: "Signed in successfully",
    or: "or",
    oauthErrors: {
      discord_denied: "You cancelled the Discord sign-in.",
      discord_failed: "Discord didn't respond. Please try again.",
      bad_state: "Your sign-in session expired. Please try again.",
      no_email: "This Discord account has no email address.",
      email_unverified: "Your Discord email isn't verified yet. Verify it in Discord, then try again.",
      account_disabled: "This account has been disabled.",
      server_error: "Discord sign-in is having trouble. Please try again later or sign in with email.",
    } as Record<string, string>,
  },
  ru: {
    title: "Вход",
    subtitle: "Доступ к вашей панели, заказам и подтверждениям транзакций.",
    slideLabel: "Нажмите или потяните, чтобы войти",
    slideAria: "Нажмите или потяните значок Discord, чтобы войти",
    redirecting: "Перенаправление…",
    noAccount: "Нет аккаунта?",
    signUpNow: "Зарегистрироваться",
    email: "Email или отображаемое имя",
    emailPlaceholder: "name@example.com",
    password: "Пароль",
    passwordPlaceholder: "Ваш пароль",
    hidePassword: "Скрыть пароль",
    showPassword: "Показать пароль",
    forgot: "Забыли пароль?",
    signingIn: "Выполняется вход…",
    signIn: "Войти",
    welcomeBack: "Вы успешно вошли",
    or: "или",
    oauthErrors: {
      discord_denied: "Вы отменили вход через Discord.",
      discord_failed: "Discord не отвечает. Пожалуйста, попробуйте ещё раз.",
      bad_state: "Сессия входа истекла. Пожалуйста, попробуйте ещё раз.",
      no_email: "У этого аккаунта Discord нет адреса email.",
      email_unverified: "Ваш email в Discord ещё не подтверждён. Подтвердите его в Discord и попробуйте снова.",
      account_disabled: "Этот аккаунт заблокирован.",
      server_error: "Вход через Discord временно не работает. Попробуйте позже или войдите по email.",
    } as Record<string, string>,
  },
  pt: {
    title: "Entrar",
    subtitle: "Acesse seu painel, pedidos e comprovantes de transação.",
    slideLabel: "Clique ou arraste para entrar",
    slideAria: "Clique ou arraste o ícone do Discord para entrar",
    redirecting: "Redirecionando…",
    noAccount: "Não tem uma conta?",
    signUpNow: "Cadastre-se",
    email: "E-mail ou nome de exibição",
    emailPlaceholder: "name@example.com",
    password: "Senha",
    passwordPlaceholder: "Sua senha",
    hidePassword: "Ocultar senha",
    showPassword: "Mostrar senha",
    forgot: "Esqueceu a senha?",
    signingIn: "Entrando…",
    signIn: "Entrar",
    welcomeBack: "Login feito com sucesso",
    or: "ou",
    oauthErrors: {
      discord_denied: "Você cancelou o login com o Discord.",
      discord_failed: "O Discord não respondeu. Tente novamente.",
      bad_state: "Sua sessão de login expirou. Tente novamente.",
      no_email: "Esta conta do Discord não tem e-mail.",
      email_unverified: "Seu e-mail do Discord ainda não foi verificado. Verifique-o no Discord e tente novamente.",
      account_disabled: "Esta conta foi desativada.",
      server_error: "O login com Discord está com problemas. Tente mais tarde ou entre com e-mail.",
    } as Record<string, string>,
  },
  tr: {
    title: "Giriş yap",
    subtitle: "Paneline, siparişlerine ve işlem kanıtlarına eriş.",
    slideLabel: "Giriş için tıkla veya sürükle",
    slideAria: "Giriş yapmak için Discord simgesine tıkla veya sürükle",
    redirecting: "Yönlendiriliyor…",
    noAccount: "Hesabın yok mu?",
    signUpNow: "Hemen kaydol",
    email: "E-posta veya görünen ad",
    emailPlaceholder: "name@example.com",
    password: "Şifre",
    passwordPlaceholder: "Şifren",
    hidePassword: "Şifreyi gizle",
    showPassword: "Şifreyi göster",
    forgot: "Şifreni mi unuttun?",
    signingIn: "Giriş yapılıyor…",
    signIn: "Giriş yap",
    welcomeBack: "Giriş başarılı",
    or: "veya",
    oauthErrors: {
      discord_denied: "Discord ile girişi iptal ettin.",
      discord_failed: "Discord yanıt vermedi. Lütfen tekrar dene.",
      bad_state: "Giriş oturumunun süresi doldu. Lütfen tekrar dene.",
      no_email: "Bu Discord hesabının e-posta adresi yok.",
      email_unverified: "Discord e-postan henüz doğrulanmamış. Discord'da doğrulayıp tekrar dene.",
      account_disabled: "Bu hesap devre dışı bırakıldı.",
      server_error: "Discord ile giriş şu anda sorun yaşıyor. Lütfen daha sonra tekrar dene veya e-posta ile giriş yap.",
    } as Record<string, string>,
  },
  fr: {
    title: "Connexion",
    subtitle: "Accédez à votre tableau de bord, à vos commandes et à vos preuves de transaction.",
    slideLabel: "Cliquez ou glissez pour vous connecter",
    slideAria: "Cliquez ou glissez l'icône Discord pour vous connecter",
    redirecting: "Redirection…",
    noAccount: "Pas encore de compte ?",
    signUpNow: "Inscrivez-vous",
    email: "E-mail ou nom d'affichage",
    emailPlaceholder: "name@example.com",
    password: "Mot de passe",
    passwordPlaceholder: "Votre mot de passe",
    hidePassword: "Masquer le mot de passe",
    showPassword: "Afficher le mot de passe",
    forgot: "Mot de passe oublié ?",
    signingIn: "Connexion…",
    signIn: "Se connecter",
    welcomeBack: "Connexion réussie",
    or: "ou",
    oauthErrors: {
      discord_denied: "Vous avez annulé la connexion avec Discord.",
      discord_failed: "Discord ne répond pas. Veuillez réessayer.",
      bad_state: "Votre session de connexion a expiré. Veuillez réessayer.",
      no_email: "Ce compte Discord n'a pas d'adresse e-mail.",
      email_unverified: "Votre e-mail Discord n'est pas encore vérifié. Vérifiez-le dans Discord, puis réessayez.",
      account_disabled: "Ce compte a été désactivé.",
      server_error: "La connexion avec Discord rencontre un problème. Réessayez plus tard ou connectez-vous par e-mail.",
    } as Record<string, string>,
  },
  es: {
    title: "Iniciar sesión",
    subtitle: "Accede a tu panel, tus pedidos y tus comprobantes de transacción.",
    slideLabel: "Haz clic o arrastra para entrar",
    slideAria: "Haz clic o arrastra el icono de Discord para iniciar sesión",
    redirecting: "Redirigiendo…",
    noAccount: "¿No tienes cuenta?",
    signUpNow: "Regístrate ahora",
    email: "Correo o nombre visible",
    emailPlaceholder: "name@example.com",
    password: "Contraseña",
    passwordPlaceholder: "Tu contraseña",
    hidePassword: "Ocultar contraseña",
    showPassword: "Mostrar contraseña",
    forgot: "¿Olvidaste tu contraseña?",
    signingIn: "Iniciando sesión…",
    signIn: "Iniciar sesión",
    welcomeBack: "Sesión iniciada correctamente",
    or: "o",
    oauthErrors: {
      discord_denied: "Cancelaste el inicio de sesión con Discord.",
      discord_failed: "Discord no respondió. Inténtalo de nuevo.",
      bad_state: "Tu sesión de inicio expiró. Inténtalo de nuevo.",
      no_email: "Esta cuenta de Discord no tiene correo electrónico.",
      email_unverified: "Tu correo de Discord aún no está verificado. Verifícalo en Discord y vuelve a intentarlo.",
      account_disabled: "Esta cuenta ha sido desactivada.",
      server_error: "El inicio de sesión con Discord tiene problemas. Inténtalo más tarde o entra con tu correo.",
    } as Record<string, string>,
  },
  de: {
    title: "Anmelden",
    subtitle: "Greif auf dein Dashboard, deine Bestellungen und Transaktionsnachweise zu.",
    slideLabel: "Klicken oder ziehen zum Anmelden",
    slideAria: "Klicke oder ziehe das Discord-Symbol, um dich anzumelden",
    redirecting: "Weiterleitung…",
    noAccount: "Noch kein Konto?",
    signUpNow: "Jetzt registrieren",
    email: "E-Mail oder Anzeigename",
    emailPlaceholder: "name@example.com",
    password: "Passwort",
    passwordPlaceholder: "Dein Passwort",
    hidePassword: "Passwort verbergen",
    showPassword: "Passwort anzeigen",
    forgot: "Passwort vergessen?",
    signingIn: "Anmeldung läuft…",
    signIn: "Anmelden",
    welcomeBack: "Erfolgreich angemeldet",
    or: "oder",
    oauthErrors: {
      discord_denied: "Du hast die Anmeldung mit Discord abgebrochen.",
      discord_failed: "Discord hat nicht geantwortet. Bitte versuch es erneut.",
      bad_state: "Deine Anmeldesitzung ist abgelaufen. Bitte versuch es erneut.",
      no_email: "Dieses Discord-Konto hat keine E-Mail-Adresse.",
      email_unverified: "Deine Discord-E-Mail ist noch nicht bestätigt. Bestätige sie in Discord und versuch es dann erneut.",
      account_disabled: "Dieses Konto wurde deaktiviert.",
      server_error: "Bei der Discord-Anmeldung gibt es gerade Probleme. Versuch es später erneut oder melde dich per E-Mail an.",
    } as Record<string, string>,
  },
  it: {
    title: "Accedi",
    subtitle: "Accedi alla tua dashboard, ai tuoi ordini e alle prove delle transazioni.",
    slideLabel: "Clicca o trascina per accedere",
    slideAria: "Clicca o trascina l'icona di Discord per accedere",
    redirecting: "Reindirizzamento…",
    noAccount: "Non hai un account?",
    signUpNow: "Registrati ora",
    email: "Email o nome visualizzato",
    emailPlaceholder: "name@example.com",
    password: "Password",
    passwordPlaceholder: "La tua password",
    hidePassword: "Nascondi password",
    showPassword: "Mostra password",
    forgot: "Password dimenticata?",
    signingIn: "Accesso in corso…",
    signIn: "Accedi",
    welcomeBack: "Accesso effettuato",
    or: "oppure",
    oauthErrors: {
      discord_denied: "Hai annullato l'accesso con Discord.",
      discord_failed: "Discord non ha risposto. Riprova.",
      bad_state: "La sessione di accesso è scaduta. Riprova.",
      no_email: "Questo account Discord non ha un indirizzo email.",
      email_unverified: "La tua email di Discord non è ancora verificata. Verificala su Discord e riprova.",
      account_disabled: "Questo account è stato disattivato.",
      server_error: "L'accesso con Discord ha qualche problema. Riprova più tardi o accedi con l'email.",
    } as Record<string, string>,
  },
  fil: {
    title: "Mag-log in",
    subtitle: "I-access ang iyong dashboard, mga order, at mga patunay ng transaksyon.",
    slideLabel: "I-click o i-drag para mag-login",
    slideAria: "I-click o i-drag ang Discord icon para mag-login",
    redirecting: "Nire-redirect…",
    noAccount: "Wala ka pang account?",
    signUpNow: "Mag-sign up na",
    email: "Email o display name",
    emailPlaceholder: "name@example.com",
    password: "Password",
    passwordPlaceholder: "Ang iyong password",
    hidePassword: "Itago ang password",
    showPassword: "Ipakita ang password",
    forgot: "Nakalimutan ang password?",
    signingIn: "Nagla-log in…",
    signIn: "Mag-log in",
    welcomeBack: "Matagumpay kang naka-log in",
    or: "o",
    oauthErrors: {
      discord_denied: "Kinansela mo ang pag-sign in gamit ang Discord.",
      discord_failed: "Hindi sumagot ang Discord. Pakisubukang muli.",
      bad_state: "Nag-expire na ang iyong sign-in session. Pakisubukang muli.",
      no_email: "Walang email address ang Discord account na ito.",
      email_unverified: "Hindi pa verified ang email mo sa Discord. I-verify ito sa Discord, tapos subukang muli.",
      account_disabled: "Na-disable na ang account na ito.",
      server_error: "May problema ang Discord sign-in ngayon. Subukang muli mamaya o mag-sign in gamit ang email.",
    } as Record<string, string>,
  },
  id: {
    title: "Masuk",
    subtitle: "Akses dasbor, pesanan, dan bukti transaksimu.",
    slideLabel: "Klik atau geser untuk masuk",
    slideAria: "Klik atau geser ikon Discord untuk masuk",
    redirecting: "Mengalihkan…",
    noAccount: "Belum punya akun?",
    signUpNow: "Daftar sekarang",
    email: "Email atau nama tampilan",
    emailPlaceholder: "name@example.com",
    password: "Kata sandi",
    passwordPlaceholder: "Kata sandimu",
    hidePassword: "Sembunyikan kata sandi",
    showPassword: "Tampilkan kata sandi",
    forgot: "Lupa kata sandi?",
    signingIn: "Sedang masuk…",
    signIn: "Masuk",
    welcomeBack: "Berhasil masuk",
    or: "atau",
    oauthErrors: {
      discord_denied: "Kamu membatalkan masuk dengan Discord.",
      discord_failed: "Discord tidak merespons. Coba lagi ya.",
      bad_state: "Sesi masukmu sudah kedaluwarsa. Coba lagi ya.",
      no_email: "Akun Discord ini tidak punya alamat email.",
      email_unverified: "Email Discord-mu belum diverifikasi. Verifikasi dulu di Discord, lalu coba lagi.",
      account_disabled: "Akun ini telah dinonaktifkan.",
      server_error: "Masuk dengan Discord sedang bermasalah. Coba lagi nanti atau masuk dengan email.",
    } as Record<string, string>,
  },
};

/** Kích thước handle (px) + padding trong nút — dùng để tính quãng kéo tối đa. */
const HANDLE = 44;
const PAD = 10;

/** Nút "Click or drag to login" kiểu yummytrack: handle Discord kéo được sang
 * phải; kéo quá ~70% (hoặc bấm/Enter) thì chuyển sang trang OAuth Discord. */
function SlideDiscordLogin({ next }: { next: string }) {
  const t = usePick(STR);
  const loginWithOAuth = useAuthStore((s) => s.loginWithOAuth);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const startX = useRef(0);
  const moved = useRef(false);

  async function trigger() {
    if (busy) return;
    setBusy(true);
    const result = await loginWithOAuth("discord", next);
    if (!result.success) {
      toast.error(result.error);
      setBusy(false);
    }
    // Thành công thì trình duyệt đang rời trang — giữ trạng thái chờ.
  }

  function maxDrag() {
    const el = btnRef.current;
    return el ? Math.max(0, el.clientWidth - HANDLE - PAD * 2) : 0;
  }

  function onPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    if (busy) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    moved.current = false;
    setDragging(true);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragging || busy) return;
    const dx = Math.min(Math.max(0, e.clientX - startX.current), maxDrag());
    if (dx > 8) moved.current = true;
    setDrag(dx);
  }

  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    // Kéo quá 70% quãng đường -> đăng nhập; bấm nhanh (không kéo) cũng vậy.
    if (!busy && (drag >= maxDrag() * 0.7 || !moved.current)) void trigger();
    setDrag(0);
  }

  return (
    <button
      ref={btnRef}
      type="button"
      disabled={busy}
      aria-label={t.slideAria}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        setDragging(false);
        setDrag(0);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          void trigger();
        }
      }}
      className="um-slide-btn flex h-16 w-full touch-none select-none items-center rounded-2xl border border-border-strong bg-surface-2 px-2.5 text-sm font-bold uppercase tracking-[0.14em] text-text transition-colors hover:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-60"
    >
      <span className="um-slide-fill" aria-hidden />
      <span
        aria-hidden
        style={{
          transform: `translateX(${drag}px)`,
          transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        className="inline-flex h-11 w-11 shrink-0 cursor-grab items-center justify-center rounded-xl bg-[#5865F2] shadow-lg shadow-[#5865F2]/30 active:cursor-grabbing"
      >
        <DiscordIcon className="um-icon-bob h-6 w-6" fill="#fff" />
      </span>
      <span className="flex-1 text-center" aria-hidden>
        {busy ? t.redirecting : t.slideLabel}
      </span>
      <ChevronsRight className="um-slide-chevrons mr-1.5 h-4 w-4 shrink-0 text-text-subtle" aria-hidden />
    </button>
  );
}

/** Form đăng nhập tay (email/tên hiển thị + mật khẩu), giữ gọn một cột. */
function ManualLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const t = usePick(STR);
  const login = useAuthStore((s) => s.login);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(identifier, password, captchaToken ?? undefined);
    if (result.success) {
      toast.success(t.welcomeBack);
      onSuccess();
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="login-identifier">{t.email}</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle">
            <Mail className="um-icon-bob h-4 w-4" aria-hidden />
          </span>
          <Input
            id="login-identifier"
            type="text"
            autoComplete="username"
            placeholder={t.emailPlaceholder}
            className="pl-9"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">{t.password}</Label>
          <Link to="/forgot-password" className="text-xs text-yellow hover:text-yellow-hover">
            {t.forgot}
          </Link>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle">
            <Lock className="um-icon-sway h-4 w-4" aria-hidden />
          </span>
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={t.passwordPlaceholder}
            className="px-9"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle transition-colors hover:text-text"
            aria-label={showPassword ? t.hidePassword : t.showPassword}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      <TurnstileWidget onToken={setCaptchaToken} />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={submitting || (turnstileEnabled && !captchaToken)}
      >
        <LogIn className="um-icon-bob h-4 w-4" aria-hidden />
        {submitting ? t.signingIn : t.signIn}
      </Button>
    </form>
  );
}

export function Login() {
  const t = usePick(STR);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Where to send the user after a successful sign-in (set by RequireAuth as
  // state.from, or by RequireRole as the ?next= query param).
  const from =
    (location.state as { from?: string } | null)?.from ??
    searchParams.get("next") ??
    "/dashboard";

  // Máy chủ đăng nhập Discord báo lỗi qua ?error=<mã> -> hiện thông báo rồi xoá khỏi URL.
  useEffect(() => {
    const code = searchParams.get("error");
    if (!code) return;
    toast.error(t.oauthErrors[code] ?? t.oauthErrors.server_error);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete("error");
        return params;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams, t]);

  // Already signed in → skip the form.
  if (user) return <Navigate to={from} replace />;

  return (
    <AuthCard
      title={t.title}
      subtitle={t.subtitle}
      footer={
        <span className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5">
          <span className="flex items-center gap-2 text-text-muted">
            <KeyRound className="um-icon-sway h-3.5 w-3.5 text-text-subtle" aria-hidden />
            {t.noAccount}
          </span>
          <Link
            to="/register"
            className="rounded-xl bg-yellow px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-text-on-yellow transition-colors hover:bg-yellow-hover"
          >
            {t.signUpNow}
          </Link>
        </span>
      }
    >
      <ManualLoginForm onSuccess={() => navigate(from, { replace: true })} />

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-text-subtle" aria-hidden>
        <span className="um-auth-hr flex-1" />
        {t.or}
        <span className="um-auth-hr flex-1" />
      </div>

      <div className="space-y-2.5">
        <SlideDiscordLogin next={from} />
      </div>
    </AuthCard>
  );
}
