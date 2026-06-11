"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateScoringAction } from "@/app/actions/admin";

export function AdminScoringForm({
  initial,
}: {
  initial: { exactPoints: number; outcomePoints: number; wrongPoints: number };
}) {
  const [exact, setExact] = useState(initial.exactPoints);
  const [outcome, setOutcome] = useState(initial.outcomePoints);
  const [wrong, setWrong] = useState(initial.wrongPoints);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setMsg(null);
    start(async () => {
      const res = await updateScoringAction({
        exactPoints: exact,
        outcomePoints: outcome,
        wrongPoints: wrong,
      });
      setMsg(res.ok ? "Saved — all results recomputed." : res.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Scoring</CardTitle>
        <p className="text-xs text-muted-foreground">
          Changing these recomputes points for every finished match.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Exact" value={exact} onChange={setExact} />
          <Field label="Outcome" value={outcome} onChange={setOutcome} />
          <Field label="Wrong" value={wrong} onChange={setWrong} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{msg}</span>
          <Button size="sm" onClick={save} disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={`score-${label}`}>{label}</Label>
      <Input
        id={`score-${label}`}
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) =>
          onChange(Math.max(0, Math.min(100, Number(e.target.value))))
        }
        className="text-center"
      />
    </div>
  );
}
