"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignUp = async () => {
    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Please check your email to confirm your account.");
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/";
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-foreground/10 rounded-xl p-6 shadow-sm bg-foreground/5">
        <h1 className="text-2xl font-bold mb-2">Log in to CleanCut</h1>

        <p className="text-sm opacity-70 mb-6">
          Create an account or log in to save your custom word list.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleLogin}
              disabled={isLoading || !email || !password}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              Log In
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleSignUp}
              disabled={isLoading || !email || !password}
              className="flex-1"
            >
              Sign Up
            </Button>
          </div>

          {message && (
            <div className="text-sm text-center border border-foreground/10 rounded-md p-3 bg-background">
              {message}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}