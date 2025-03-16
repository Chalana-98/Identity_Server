"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus("error");
      setMessage("No verification token provided");
    }
  }, [token]);

  async function verifyEmail(token: string) {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Email verified successfully. You can now log in.");
      } else {
        setStatus("error");
        setMessage(data.message || "Verification failed");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred during verification");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <Card className="w-[400px] shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent>
          {status === "loading" ? (
            <Alert>
              <AlertDescription>Verifying your email...</AlertDescription>
            </Alert>
          ) : status === "success" ? (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          <div className="mt-4 text-center text-sm">
            <a href="/auth/login" className="text-primary hover:underline">
              Return to login
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}