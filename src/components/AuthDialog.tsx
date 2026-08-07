import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type Mode = "signin" | "signup";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional override of the dialog headline (e.g. on the paywall). */
  title?: string;
  description?: string;
}

export default function AuthDialog({ open, onOpenChange, title, description }: Props) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const reset = () => {
    setEmail("");
    setPassword("");
    setSubmitting(false);
  };

  const ensureResearcher = async (userId: string, userEmail: string) => {
    await supabase
      .from("researchers")
      .upsert({ id: userId, email: userEmail }, { onConflict: "id" });
  };


  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) {
          toast.error(error.message.includes("already") ? "That email already has an account. Sign in instead." : error.message);
          return;
        }
        if (!data.session) {
          toast.error("That email already has an account. Sign in instead.");
          setMode("signin");
          return;
        }
        if (data.user) {
          await ensureResearcher(data.user.id, data.user.email ?? email);
        }
        // Fire-and-forget welcome email
        const userId = data.user?.id ?? email;
        const name = email.split("@")[0];
        supabase.functions
          .invoke("send-transactional-email", {
            body: {
              templateName: "welcome",
              recipientEmail: email,
              idempotencyKey: `welcome-${userId}`,
              templateData: { name },
            },
          })
          .catch(() => {});
        toast.success("Welcome to StudyDrop");
        onOpenChange(false);
        reset();
        navigate("/");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data.user) {
        await ensureResearcher(data.user.id, data.user.email ?? email);
      }
      toast.success("Welcome back");
      onOpenChange(false);
      reset();
      navigate("/");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Reset link sent to ${email}`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {title ?? (mode === "signin" ? "Welcome back" : "Create your account")}
          </DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>




        <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="signin" className="flex-1">Sign in</TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">Sign up</TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />}
            {mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        {mode === "signin" && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleForgot}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Forgot password?
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

