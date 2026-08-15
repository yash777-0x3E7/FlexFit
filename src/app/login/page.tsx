"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

export default function LoginPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      router.push("/dashboard");
    },
  });

  const register = trpc.auth.register.useMutation({
    onSuccess: async () => {
      // Auto-login after registration is supported by trpc.auth.register setting the cookie,
      // so we can just invalidate and redirect.
      await utils.invalidate();
      router.push("/dashboard");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      login.mutate({ email, password });
    } else {
      register.mutate({ email, password, name, phone });
    }
  };

  const isPending = login.isPending || register.isPending;
  const error = login.error || register.error;

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {mode === "login" ? "Sign in" : "Create an account"}
      </h1>

      <form className="panel space-y-4 p-5" onSubmit={handleSubmit}>
        {mode === "register" && (
          <>
            <div className="space-y-1.5">
              <label className="text-sm muted">Name</label>
              <input
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm muted">Phone</label>
              <input
                className="input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <label className="text-sm muted">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm muted">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-400">
            {error.message}
          </p>
        )}

        <button
          className="btn btn-primary w-full"
          type="submit"
          disabled={isPending}
        >
          {isPending 
            ? (mode === "login" ? "Signing in..." : "Creating account...") 
            : (mode === "login" ? "Sign in" : "Create account")}
        </button>
        
        <div className="text-center mt-4">
          <button
            type="button"
            className="text-sm text-cyan-400 hover:text-cyan-300"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </form>

      {mode === "login" && (
        <div className="panel p-4 text-sm muted">
          <p className="mb-2 font-medium" style={{ color: "var(--text)" }}>
            Demo accounts
          </p>
          <p>admin@flexfit.test / admin123</p>
          <p>arjun@flexfit.test / trainer123</p>
          <p>rahul.k@example.com / member123</p>
        </div>
      )}
    </div>
  );
}
