import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function VerifiedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-200 shadow-xl">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-6 h-6 text-green-500"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                        </svg>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Email Verified!</CardTitle>
                    <CardDescription className="text-slate-400">
                        Your account has been successfully verified.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p className="text-center text-sm text-slate-400">
                        You can now sign in to access your dashboard.
                    </p>
                    <Button asChild className="w-full bg-slate-100 text-slate-900 hover:bg-slate-200 font-medium">
                        <Link href="/login">Sign In</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
