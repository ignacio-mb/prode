"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInAction, type AuthState } from "@/app/actions/auth";

const STORAGE_KEY = "prode:name";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ArrowRight className="size-4" />
      )}
      {pending ? "Ingresando…" : "Entrar al prode"}
    </Button>
  );
}

export function SignInForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(
    signInAction,
    null,
  );
  const [name, setName] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const autoTried = useRef(false);

  // Remember the name + auto-sign-in on return.
  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      setName(saved);
      if (!autoTried.current) {
        autoTried.current = true;
        // Defer so the controlled input value is committed first.
        requestAnimationFrame(() => formRef.current?.requestSubmit());
      }
    }
  }, []);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={() => {
        if (name.trim()) localStorage.setItem(STORAGE_KEY, name.trim());
      }}
      className="space-y-3"
    >
      <Input
        name="name"
        autoComplete="nickname"
        placeholder="Tu nombre (ej. Nacho)"
        aria-label="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={24}
        required
        autoFocus
      />
      {state?.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}
      <SubmitButton />
      <p className="text-center text-xs text-muted-foreground">
        Pone tu nombre y acordatelo, puto
      </p>
    </form>
  );
}
