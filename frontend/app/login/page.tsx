"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signUp() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Account created. Check your email if confirmation is enabled.");
  }

  async function signIn() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-foreground/10 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Sign in</h1>
        <p className="text-sm opacity-70 mb-6">
          Sign in to save your custom word list.
        </p>

        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          className="w-full border border-foreground/20 rounded-md px-3 py-2 mb-4 bg-transparent"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />

        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          className="w-full border border-foreground/20 rounded-md px-3 py-2 mb-4 bg-transparent"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
        />

        <div className="flex gap-3">
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
            onClick={signIn}
            disabled={loading}
          >
            Log In
          </button>

          <button
            className="px-4 py-2 rounded-md border border-foreground/20 disabled:opacity-50"
            onClick={signUp}
            disabled={loading}
          >
            Sign Up
          </button>
        </div>

        {message && (
          <p className="mt-4 text-sm opacity-80">{message}</p>
        )}
      </div>
    </main>
  );
}