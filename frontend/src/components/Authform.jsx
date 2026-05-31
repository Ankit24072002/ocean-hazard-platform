import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserPlus, UserRound, Waves } from "lucide-react";

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
    return ["Weak", "Fair", "Good", "Strong"][Math.max(score - 1, 0)] || "Weak";
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
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
        <section className="relative flex min-h-[42vh] flex-col justify-between overflow-hidden bg-[linear-gradient(rgba(8,47,73,.72),rgba(15,23,42,.9)),url('/Storms-Images.jpg')] bg-cover bg-center px-6 py-8 md:px-12 lg:min-h-screen">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-cyan-800">
              <Waves size={25} />
            </div>
            <div>
              <p className="text-lg font-semibold">Ocean Hazard Platform</p>
              <p className="text-sm text-cyan-100">INCOIS-aligned coastal intelligence</p>
            </div>
          </div>
          <div className="max-w-xl py-10 md:py-16">
            <h1 className="text-3xl font-semibold leading-tight md:text-5xl">Report, verify, and respond to coastal hazards in real time.</h1>
            <p className="mt-5 text-sm leading-7 text-cyan-50 md:text-base">
              Citizen reports, geotagged media, social media NLP, hotspot detection, and role-based dashboards in one operational workspace.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-cyan-50 sm:grid-cols-3">
            <span className="rounded-md bg-white/10 px-3 py-2">Offline-ready reports</span>
            <span className="rounded-md bg-white/10 px-3 py-2">Multilingual NLP</span>
            <span className="rounded-md bg-white/10 px-3 py-2">Official warning layers</span>
          </div>
        </section>

        <section className="flex items-center justify-center bg-slate-100 px-4 py-8 text-slate-950 md:px-6">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl md:p-6">
            <div className="mb-6">
              <p className="text-sm font-medium text-cyan-800">{mode === "login" ? "Welcome back" : "Create workspace access"}</p>
              <h2 className="mt-1 text-2xl font-semibold">{mode === "login" ? "Sign in to dashboard" : "Sign up"}</h2>
              <p className="mt-2 text-sm text-slate-500">Use Google or email to continue to the coastal operations workspace.</p>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-md bg-slate-100 p-1 text-sm font-medium">
              <button onClick={() => setMode("login")} className={`rounded px-3 py-2 ${mode === "login" ? "bg-white shadow-sm" : "text-slate-600"}`}>
                Login
              </button>
              <button onClick={() => setMode("register")} className={`rounded px-3 py-2 ${mode === "register" ? "bg-white shadow-sm" : "text-slate-600"}`}>
                Sign up
              </button>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={continueWithGoogle}
                className="flex min-h-11 w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 transition hover:border-cyan-700 hover:bg-slate-50"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-sm font-bold text-cyan-700">
                  G
                </span>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
                <span className="h-px flex-1 bg-slate-200"></span>
                <span>Email</span>
                <span className="h-px flex-1 bg-slate-200"></span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {mode === "register" && (
                <Field icon={UserRound}>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required className="w-full bg-transparent py-3 outline-none" />
                </Field>
              )}

              <Field icon={Mail}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required className="w-full bg-transparent py-3 outline-none" />
              </Field>

              <Field icon={LockKeyhole}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={6}
                  className="w-full bg-transparent py-3 outline-none"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-500 hover:text-slate-900">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </Field>

              {mode === "register" && (
                <>
                  <Field icon={ShieldCheck}>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-transparent py-3 outline-none">
                      <option value="citizen">Citizen</option>
                      <option value="analyst">Analyst</option>
                      <option value="official">Government official</option>
                    </select>
                  </Field>
                  <Field icon={LockKeyhole}>
                    <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required className="w-full bg-transparent py-3 outline-none" />
                  </Field>
                  <p className="text-xs text-slate-500">Password strength: {strength}</p>
                </>
              )}

              {mode === "login" && (
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  Remember this email
                </label>
              )}

              {message && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p>}

              <button disabled={loading} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-3 font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-70">
                {mode === "login" ? <ShieldCheck size={18} /> : <UserPlus size={18} />}
                {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ icon: Icon, children }) {
  return (
    <div className="flex min-h-12 items-center gap-3 rounded-md border border-slate-300 px-3 focus-within:border-cyan-700">
      <Icon size={18} className="shrink-0 text-slate-500" />
      {children}
    </div>
  );
}
