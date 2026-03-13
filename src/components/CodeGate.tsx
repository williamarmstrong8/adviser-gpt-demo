import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GATE_STORAGE_KEY = "advisergpt-gate-unlocked";
const ACCESS_CODE = "1357";

export function CodeGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem(GATE_STORAGE_KEY) === "true"
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (code.trim() === ACCESS_CODE) {
      localStorage.setItem(GATE_STORAGE_KEY, "true");
      setUnlocked(true);
    } else {
      setError("Invalid code");
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-sidebar-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-background">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Enter access code</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                className="text-center text-lg tracking-widest"
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
