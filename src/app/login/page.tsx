"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    completePasswordReset,
    requestPasswordReset,
    signIn,
    signUp,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type AuthMode = "signin" | "signup" | "forgot" | "reset";

function resolveMode(rawMode: string | null): AuthMode {
    if (rawMode === "signup") return "signup";
    if (rawMode === "forgot") return "forgot";
    if (rawMode === "reset") return "reset";
    return "signin";
}

function LoginContent() {
    const searchParams = useSearchParams();
    const initialMode = resolveMode(searchParams.get("mode"));

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const callbackErrorParam = searchParams.get("error");
    const callbackErrorMessage =
        callbackErrorParam === "exchange_failed"
            ? "Failed to complete authentication. The link may have expired. Please try again."
            : callbackErrorParam === "missing_code"
                ? "Invalid authentication link. Please request a new one."
                : callbackErrorParam
                    ? "Authentication failed. Please try again."
                    : null;
    const effectiveMessage = message ?? (callbackErrorMessage ? { type: "error" as const, text: callbackErrorMessage } : null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const formData = new FormData();
        if (mode !== "reset") {
            formData.append("email", email);
        }
        if (mode !== "forgot") {
            formData.append("password", password);
        }
        if (mode === "reset") {
            formData.append("confirmPassword", confirmPassword);
        }

        try {
            let result;
            if (mode === "signin") {
                result = await signIn(formData);
            } else if (mode === "signup") {
                result = await signUp(formData);
            } else if (mode === "forgot") {
                result = await requestPasswordReset(formData);
            } else {
                result = await completePasswordReset(formData);
            }

            if (result?.error) {
                setMessage({ type: "error", text: result.error });
            } else if (result && "success" in result && result.success) {
                setMessage({ type: "success", text: result.message || "Success!" });
                if (mode === "forgot") {
                    setEmail("");
                } else if (mode === "reset") {
                    setPassword("");
                    setConfirmPassword("");
                    setMode("signin");
                }
            }
        } catch (err: unknown) {
            const digest =
                typeof err === "object" && err !== null && "digest" in err
                    ? (err as { digest?: unknown }).digest
                    : undefined;
            if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
                throw err;
            }

            console.error("Submission error:", err);
            setMessage({ type: "error", text: "An unexpected error occurred." });
        }

        setIsLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-6 h-12 w-12 rounded bg-slate-200 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-900 leading-none">TAS</span>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white tracking-tight">
                        {mode === "signin"
                            ? "Sign In"
                            : mode === "signup"
                                ? "Create Account"
                                : mode === "forgot"
                                    ? "Reset Password"
                                    : "Set New Password"}
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-sm">
                        {mode === "signin"
                            ? "Access the Task Accountability System"
                            : mode === "signup"
                                ? "Join TAS and start committing to your goals"
                                : mode === "forgot"
                                    ? "Enter your email and we will send a password reset link"
                                    : "Choose a new password for your account"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {mode !== "reset" && (
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-mono uppercase tracking-widest text-slate-500">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@domain.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-700 focus:border-slate-500 focus:ring-0 transition-colors"
                                />
                            </div>
                        )}

                        {mode !== "forgot" && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-xs font-mono uppercase tracking-widest text-slate-500">
                                        Password
                                    </Label>
                                    {mode === "signin" && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMode("forgot");
                                                setMessage(null);
                                            }}
                                            className="text-[10px] font-mono uppercase tracking-widest text-slate-300 hover:text-white transition-colors"
                                        >
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="********"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-700 focus:border-slate-500 focus:ring-0 transition-colors"
                                />
                            </div>
                        )}

                        {mode === "reset" && (
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-xs font-mono uppercase tracking-widest text-slate-500">
                                    Confirm Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="********"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-700 focus:border-slate-500 focus:ring-0 transition-colors"
                                />
                            </div>
                        )}

                        {effectiveMessage && (
                            <div
                                className={`p-3 rounded text-xs font-medium ${effectiveMessage.type === "success"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                    }`}
                            >
                                {effectiveMessage.text}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-slate-200 hover:bg-white text-slate-900 font-bold py-6 rounded transition-all"
                        >
                            {isLoading
                                ? "Processing..."
                                : mode === "signin"
                                    ? "Sign In"
                                    : mode === "signup"
                                        ? "Sign Up"
                                        : mode === "forgot"
                                            ? "Send Reset Link"
                                            : "Update Password"}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-xs font-mono uppercase tracking-widest text-slate-500">
                        {mode === "signin" ? (
                            <>
                                Need an account?{" "}
                                <button
                                    onClick={() => {
                                        setMode("signup");
                                        setMessage(null);
                                    }}
                                    className="text-slate-200 hover:text-white transition-colors"
                                >
                                    Sign Up
                                </button>
                            </>
                        ) : mode === "signup" ? (
                            <>
                                Already have an account?{" "}
                                <button
                                    onClick={() => {
                                        setMode("signin");
                                        setMessage(null);
                                    }}
                                    className="text-slate-200 hover:text-white transition-colors"
                                >
                                    Sign In
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    setMode("signin");
                                    setMessage(null);
                                }}
                                className="text-slate-200 hover:text-white transition-colors"
                            >
                                Back to Sign In
                            </button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-xs uppercase tracking-widest">Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}
