"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function JoinPage() {
    const { code } = useParams<{ code: string }>();
    const router = useRouter();
    const join = useMutation(api.functions.groups.joinByCode);

    const [status, setStatus] = useState<"idle" | "joining" | "success" | "error">("idle");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function doJoin() {
            if (!code) return;
            setStatus("joining");
            setError(null);
            try {
                const res = await join({ code: String(code) });
                if (cancelled) return;
                setStatus("success");
                router.replace(`/g/${res.groupId}`);
            } catch (e: any) {
                if (cancelled) return;
                setStatus("error");
                setError(e?.message ?? "Failed to join");
            }
        }
        doJoin();
        return () => {
            cancelled = true;
        };
    }, [code, join, router]);

    return (
        <main className="max-w-md mx-auto p-6">
            <SignedOut>
                <Card className="p-5 space-y-4">
                    <h1 className="text-xl font-semibold">Join group</h1>
                    <p>
                        You were invited with code:{" "}
                        <span className="font-mono">{String(code)}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Please sign in to accept the invite.
                    </p>
                    <SignInButton
                        mode="modal"
                        fallbackRedirectUrl={`/join/${code}`}
                        signUpFallbackRedirectUrl={`/join/${code}`}
                    ><Button>Sign in to continue</Button>
                    </SignInButton>
                </Card>
            </SignedOut>

            <SignedIn>
                <Card className="p-5 space-y-3">
                    <h1 className="text-xl font-semibold">Joining group…</h1>
                    {status === "joining" && (
                        <p>
                            Accepting invite <span className="font-mono">{String(code)}</span>…
                        </p>
                    )}
                    {status === "error" && (
                        <div className="space-y-3">
                            <p className="text-red-600">Couldn’t join: {error}</p>
                            <div className="flex gap-2">
                                <Button onClick={() => location.reload()}>Try again</Button>
                                <Button variant="outline" onClick={() => router.replace("/dashboard")}>
                                    Go to dashboard
                                </Button>
                            </div>
                        </div>
                    )}
                    {status === "success" && <p>Redirecting…</p>}
                </Card>
            </SignedIn>
        </main>
    );
}
