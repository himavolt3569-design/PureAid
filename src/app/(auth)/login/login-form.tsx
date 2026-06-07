"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { ArrowRight, LockKeyhole, Loader2, Mail, ShieldCheck } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { login } from "../actions";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<HCaptcha>(null);
  const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    if (!hcaptchaSiteKey) {
      toast.error("CAPTCHA is not configured.");
      return;
    }

    if (!captchaToken) {
      toast.error("Please complete the CAPTCHA.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("email", values.email);
    formData.append("password", values.password);
    formData.append("captchaToken", captchaToken);
    formData.append("next", nextPath);

    const result = await login(formData);
    captchaRef.current?.resetCaptcha();
    setCaptchaToken("");

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-12">
      <section className="hidden bg-primary p-12 text-paper-white lg:col-span-5 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="font-display text-5xl">PureAID</Link>
        <div>
          <p className="label-caps mb-4 text-primary-fixed-dim">VERIFIED ACCESS</p>
          <h1 className="font-display text-[72px] leading-[78px]">Return to your impact desk.</h1>
          <p className="mt-8 max-w-md text-lg leading-8 text-primary-fixed-dim">Manage campaigns, payment methods, and donation records from one authoritative workspace.</p>
        </div>
        <div className="border border-primary-fixed-dim/30 p-5">
          <ShieldCheck className="mb-4 size-6 text-primary-fixed-dim" />
          <p className="text-sm leading-6 text-primary-fixed-dim">Dashboard routes require an authenticated Supabase session.</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12 lg:col-span-7">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-12 block font-display text-5xl text-primary lg:hidden">PureAID</Link>
          <p className="label-caps mb-3 text-slate-gray">LOGIN</p>
          <h2 className="headline-xl text-primary">Welcome back</h2>
          <p className="mt-3 text-slate-gray">Sign in to continue managing verified funding.</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="form-panel mt-10 space-y-7">
              <div className="form-section-heading">
                <div>
                  <h3 className="text-lg font-semibold text-primary">Account credentials</h3>
                  <p className="mt-1 text-sm text-slate-gray">Use the email and password connected to your PureAID profile.</p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 space-y-0">
                    <FormLabel className="field-label">Email address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-gray" />
                        <Input type="email" autoComplete="email" placeholder="Enter your email" className="pl-12 py-6 text-base rounded-md" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 space-y-0">
                    <FormLabel className="field-label">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-gray" />
                        <Input type="password" autoComplete="current-password" placeholder="Enter your password" className="pl-12 py-6 text-base rounded-md" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription className="field-help">Passwords are case-sensitive.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {hcaptchaSiteKey ? (
                <div className="flex justify-center">
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={hcaptchaSiteKey}
                    onVerify={setCaptchaToken}
                    onExpire={() => setCaptchaToken("")}
                    onError={() => {
                      setCaptchaToken("");
                      toast.error("CAPTCHA failed to load. Please try again.");
                    }}
                  />
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Sign In
                {!isLoading ? <ArrowRight className="ml-2 size-4" /> : null}
              </Button>
            </form>
          </Form>

          <p className="mt-8 text-sm text-slate-gray">
            New to PureAID?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:text-vibrant-coral">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
