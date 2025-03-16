"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string>("");
  
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message);
        return;
      }

      router.push("/auth/login");
    } catch (error) {
      setError("An unexpected error occurred");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <Card className="w-[400px] shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Invalid Reset Link</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                This password reset link is invalid or has expired.
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <a href="/auth/login" className="text-primary hover:underline">
                Return to login
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <Card className="w-[400px] shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input {...field} type="password" className="pl-9" placeholder="Enter new password" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input {...field} type="password" className="pl-9" placeholder="Confirm new password" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">Reset Password</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}