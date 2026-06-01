import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
  UserRound,
  Waves
} from "lucide-react";

const API = import.meta.env.VITE_API || "http://localhost:4000";

export default function AuthForm({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("citizen");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return {
      label: ["Weak", "Fair", "Good", "Strong"][Math.max(score - 1, 0)] || "Weak",
      score: Math.max(score, password ? 1 : 0)
    };
  }, [password]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (mode === "register" && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login" ? { email, password } : { name, email, password, role };
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || "Authentication failed");

      if (remember) localStorage.setItem("rememberEmail", email);
      else localStorage.removeItem("rememberEmail");

      onLogin(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function continueWithGoogle() {
    window.location.href = `${API}/api/auth/google`;
  }

  return (
    <main className="min-h-screen bg-[#eef4f6] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.96fr)_minmax(440px,1.04fr)]">
        <section className="relative hidden min-h-screen overflow-hidden bg-[linear-gradient(180deg,rgba(6,32,44,.42),rgba(8,20,31,.88)),url('/Storms-Images.jpg')] bg-cover bg-center text-white lg:flex">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/90 to-transparent" />
          <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-12">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-teal-800 shadow-lg">
                <Waves size={27} />
              </div>
              <div>
                <p className="text-lg font-semibold">Ocean Hazard Platform</p>
                <p className="text-sm text-teal-50">Coastal operations workspace</p>
              </div>
            </div>

            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-teal-50 backdrop-blur">
                <ShieldCheck size={16} />
                Verified reporting and response
              </div>
              <h1 className="text-4xl font-semibold leading-tight xl:text-5xl">
                Sign in to coordinate coastal hazard reports with confidence.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-100">
                Monitor incoming incidents, verify field signals, and support faster decisions from one secure dashboard.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Signal label="Reports" value="Live" />
              <Signal label="Warnings" value="Tracked" />
              <Signal label="Access" value="Role based" />
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 md:px-8">
          <div className="w-full max-w-[460px]">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-700 text-white">
                  <Waves size={24} />
                </div>
                <div>
                  <p className="font-semibold">Ocean Hazard</p>
                  <p className="text-sm text-slate-500">Operations platform</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,.14)] md:p-7">
              <div className="mb-6">
                <p className="text-sm font-medium text-teal-800">
                  {mode === "login" ? "Welcome back" : "Start your account"}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal">
                  {mode === "login" ? "Sign in" : "Create account"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {mode === "login"
                    ? "Enter your details to continue to the dashboard."
                    : "Set up secure access for reporting and verification."}
                </p>
              </div>

              <div className="mb-5 grid grid-cols-2 rounded-md bg-slate-100 p-1 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setMessage("");
                  }}
                  className={`min-h-10 rounded px-3 transition ${
                    mode === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setMessage("");
                  }}
                  className={`min-h-10 rounded px-3 transition ${
                    mode === "register" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Sign up
                </button>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={continueWithGoogle}
                  className="flex min-h-12 w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 transition hover:border-teal-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-sm font-bold text-teal-700">
                    G
                  </span>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 text-xs uppercase text-slate-400">
                  <span className="h-px flex-1 bg-slate-200"></span>
                  <span>Email</span>
                  <span className="h-px flex-1 bg-slate-200"></span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {mode === "register" && (
                  <Field icon={UserRound} label="Full name">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ankit Kumar"
                      required
                      className="w-full bg-transparent pb-2 text-sm outline-none"
                    />
                  </Field>
                )}

                <Field icon={Mail} label="Email address">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-transparent pb-2 text-sm outline-none"
                  />
                </Field>

                <Field icon={LockKeyhole} label="Password">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "login" ? "Enter password" : "Create password"}
                    required
                    minLength={6}
                    className="w-full bg-transparent pb-2 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </Field>

                {mode === "register" && (
                  <>
                    <Field icon={ShieldCheck} label="Account type">
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-transparent pb-2 text-sm outline-none"
                      >
                        <option value="citizen">Citizen</option>
                        <option value="analyst">Analyst</option>
                        <option value="official">Government official</option>
                      </select>
                    </Field>
                    <Field icon={LockKeyhole} label="Confirm password">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        required
                        className="w-full bg-transparent pb-2 text-sm outline-none"
                      />
                    </Field>
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                        <span>Password strength</span>
                        <span className="font-semibold text-slate-700">{strength.label}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((level) => (
                          <span
                            key={level}
                            className={`h-1.5 rounded-full ${
                              strength.score >= level ? "bg-teal-700" : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {mode === "login" && (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <label className="flex items-center gap-2 text-slate-600">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                      />
                      Remember me
                    </label>
                    <button type="button" className="font-medium text-teal-800 hover:text-teal-950">
                      Forgot password?
                    </button>
                  </div>
                )}

                {message && (
                  <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {message}
                  </p>
                )}

                <button
                  disabled={loading}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {mode === "login" ? <ShieldCheck size={18} /> : <UserPlus size={18} />}
                  {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500">
                {mode === "login" ? "New to the platform?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setMessage("");
                  }}
                  className="font-semibold text-teal-800 hover:text-teal-950"
                >
                  {mode === "login" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <Check size={17} className="mt-0.5 shrink-0" />
              <p>Your session is stored locally on this device after a successful sign in.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Signal({ label, value }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
      <p className="text-sm text-slate-200">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <label className="flex min-h-[66px] items-end gap-3 rounded-md border border-slate-300 px-3 pt-2 transition focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10">
      <Icon size={18} className="mb-2 shrink-0 text-slate-500" />
      <span className="min-w-0 flex-1">
        <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
        {children}
      </span>
    </label>
  );
}
