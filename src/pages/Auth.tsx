import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, CheckSquare, Flame, FileText, BarChart2,
  Zap, ArrowRight, Calendar, Sun, Moon, Mail, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SIGN_IN_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Превышено время ожидания ответа сервера")), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

const FEATURES = [
  { icon: CheckSquare, color: "text-blue-500", label: "Задачи" },
  { icon: Flame, color: "text-orange-500", label: "Привычки" },
  { icon: FileText, color: "text-amber-500", label: "Заметки" },
  { icon: Calendar, color: "text-emerald-500", label: "Календарь" },
  { icon: BarChart2, color: "text-purple-500", label: "Аналитика" },
];

const Auth = () => {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<"form" | "verify">("form"); // 👈 новый шаг
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");                        // 👈 код из письма
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) navigate("/");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // ── Регистрация: отправляем код на почту ──
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setStep("verify"); // 👈 переходим на экран ввода кода
      toast({
        title: "Код отправлен",
        description: `Проверьте почту ${email} — мы прислали код подтверждения.`,
      });
    } catch (error: any) {
      toast({ title: "Ошибка регистрации", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Подтверждение кода ──
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "signup",
      });
      if (error) throw error;
      toast({ title: "Почта подтверждена!", description: "Добро пожаловать в Momentum." });
      // onAuthStateChange сам перекинет на "/" — пользователь уже залогинен
    } catch (error: any) {
      toast({ title: "Неверный код", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Повторная отправка кода ──
  const handleResend = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      toast({ title: "Код отправлен повторно", description: `Проверьте почту ${email}.` });
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let result;
      try {
        result = await withTimeout(supabase.auth.signInWithPassword({ email, password }), SIGN_IN_TIMEOUT_MS);
      } catch {
        result = await withTimeout(supabase.auth.signInWithPassword({ email, password }), SIGN_IN_TIMEOUT_MS);
      }
      if (result.error) throw result.error;
      toast({ title: "Добро пожаловать!", description: "Вы успешно вошли в систему." });
    } catch (error: any) {
      toast({ title: "Ошибка входа", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen relative overflow-hidden flex items-center justify-center p-6 transition-colors duration-500",
      "bg-gradient-to-br from-slate-100 via-blue-50/60 to-indigo-50",
      "dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
    )}>

      {/* ── Декоративные блобы ── */}
      <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full pointer-events-none
        bg-primary/10 blur-3xl
        dark:bg-primary/15" />
      <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none
        bg-purple-400/15 blur-3xl
        dark:bg-purple-500/15" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none
        bg-blue-400/10 blur-3xl
        dark:bg-primary/8" />

      {/* ── Кнопка темы ── */}
      <button
        onClick={toggleTheme}
        className={cn(
          "absolute top-5 right-5 z-20 w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200",
          "bg-white/80 border-slate-200 text-slate-600 hover:bg-white shadow-sm",
          "dark:bg-white/10 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/20"
        )}
        aria-label="Переключить тему"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* ── Контент ── */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center gap-16">

        {/* ── Левая брендинговая часть ── */}
        <div className="flex-1 hidden lg:flex flex-col gap-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg
              bg-primary/20 border border-primary/30 shadow-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Momentum
            </span>
          </div>

          <div className="space-y-4">
            <h2 className="text-5xl font-bold leading-[1.15] text-slate-900 dark:text-white">
              Управляй<br />
              <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                продуктивностью
              </span><br />
              каждый день
            </h2>
            <p className="text-lg leading-relaxed max-w-sm text-slate-500 dark:text-white/50">
              Всё необходимое для организации жизни и достижения целей в одном месте.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {FEATURES.map(({ icon: Icon, color, label }) => (
              <div key={label} className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-sm",
                "bg-white/70 border-slate-200 shadow-sm",
                "dark:bg-white/5 dark:border-white/10"
              )}>
                <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", color)} />
                <span className="text-sm font-medium text-slate-700 dark:text-white/70">{label}</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-slate-400 dark:text-white/20">© 2026 Momentum</p>
        </div>

        {/* ── Карточка формы ── */}
        <div className="w-full max-w-md">
          <div className={cn(
            "rounded-2xl border p-8 space-y-7 backdrop-blur-2xl transition-colors duration-500",
            "bg-white/80 border-slate-200/80 shadow-2xl shadow-slate-200/60",
            "dark:bg-white/5 dark:border-white/10 dark:shadow-black/40"
          )}>

            {/* Мобильный лого */}
            <div className="lg:hidden flex items-center gap-2 justify-center mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">Momentum</span>
            </div>

            {step === "form" ? (
              <>
                {/* Заголовок формы */}
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {tab === "signin" ? "С возвращением" : "Создать аккаунт"}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-white/40">
                    {tab === "signin" ? "Введите данные для входа" : "Зарегистрируйтесь бесплатно"}
                  </p>
                </div>

                {/* Переключатель вкладок */}
                <div className={cn(
                  "flex gap-1 p-1 rounded-xl border",
                  "bg-slate-100 border-slate-200",
                  "dark:bg-white/5 dark:border-white/10"
                )}>
                  {(["signin", "signup"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        tab === t
                          ? "bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white"
                          : "text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white/70"
                      )}
                    >
                      {t === "signin" ? "Вход" : "Регистрация"}
                    </button>
                  ))}
                </div>

                {/* Поля ввода */}
                <form onSubmit={tab === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-email"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-white/50">
                      Email
                    </Label>
                    <Input
                      id="auth-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className={cn(
                        "h-11",
                        "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300",
                        "focus:border-primary/60 focus:bg-white",
                        "dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/20 dark:focus:bg-white/8"
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="auth-password"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-white/50">
                      Пароль
                    </Label>
                    <Input
                      id="auth-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className={cn(
                        "h-11",
                        "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300",
                        "focus:border-primary/60 focus:bg-white",
                        "dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/20 dark:focus:bg-white/8"
                      )}
                    />
                    {tab === "signup" && (
                      <p className="text-xs text-slate-400 dark:text-white/30">Минимум 6 символов</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 mt-1 flex items-center justify-center gap-2 rounded-xl
                      bg-primary hover:bg-primary/90 text-primary-foreground
                      font-semibold text-sm transition-all duration-200
                      shadow-lg shadow-primary/25
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {tab === "signin" ? "Войти" : "Создать аккаунт"}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Переключение */}
                <p className="text-center text-sm text-slate-400 dark:text-white/30">
                  {tab === "signin" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
                  <button
                    type="button"
                    onClick={() => setTab(tab === "signin" ? "signup" : "signin")}
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    {tab === "signin" ? "Зарегистрироваться" : "Войти"}
                  </button>
                </p>
              </>
            ) : (
              <>
                {/* ── Экран ввода кода ── */}
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-1">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Подтвердите почту
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-white/40">
                    Мы отправили код на<br />
                    <span className="font-medium text-slate-700 dark:text-white/70">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-code"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-white/50">
                      Код подтверждения
                    </Label>
                    <Input
                      id="auth-code"
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                      className={cn(
                        "h-12 text-center text-2xl tracking-[0.5em] font-semibold",
                        "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300",
                        "focus:border-primary/60 focus:bg-white",
                        "dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/20 dark:focus:bg-white/8"
                      )}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length < 6}
                    className="w-full h-12 flex items-center justify-center gap-2 rounded-xl
                      bg-primary hover:bg-primary/90 text-primary-foreground
                      font-semibold text-sm transition-all duration-200
                      shadow-lg shadow-primary/25
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Подтвердить<ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </form>

                <div className="flex flex-col items-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
                  >
                    Отправить код повторно
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep("form"); setCode(""); }}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white/70 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Назад
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;