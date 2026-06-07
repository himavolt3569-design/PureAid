"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, HandHeart, Loader2, Mail, Phone, ShieldCheck, User, LockKeyhole, UserIcon } from "lucide-react";
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
import { signup } from "../actions";
import { toast } from "sonner";

const signupSchema = z.object({
  role: z.enum(["donor", "recipient"]),
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  phone: z.string().min(1, "Phone number is required."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Minimum 8 characters."),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: "donor",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key !== "confirmPassword") formData.append(key, value);
    });
    
    const result = await signup(formData);

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
          <p className="label-caps mb-4 text-primary-fixed-dim">JOIN THE IMPACT</p>
          <h1 className="font-display text-[72px] leading-[78px]">Build a transparent funding record.</h1>
          <p className="mt-8 max-w-md text-lg leading-8 text-primary-fixed-dim">Create donor access or publish verified recipient campaigns with direct payment methods.</p>
        </div>
        <div className="grid gap-3 text-sm text-primary-fixed-dim border border-primary-fixed-dim/30 p-5">
          <p className="flex items-center gap-3"><CheckCircle2 className="size-5" /> Recipient profiles can configure QR payment methods.</p>
          <p className="flex items-center gap-3"><CheckCircle2 className="size-5" /> Donor profiles can create donation records.</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12 lg:col-span-7">
        <div className="w-full max-w-2xl">
          <Link href="/" className="mb-12 block font-display text-5xl text-primary lg:hidden">PureAID</Link>
          <p className="label-caps mb-3 text-slate-gray">ACCOUNT TYPE</p>
          <h2 className="headline-xl text-primary">Create an account</h2>
          <p className="mt-3 text-slate-gray">Choose how you will use PureAID. You can update profile details later in settings.</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="form-panel mt-10 space-y-8">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <div className="form-section-heading mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-primary">Role</h3>
                        <p className="mt-1 text-sm text-slate-gray">Select the workspace you want to start with.</p>
                      </div>
                    </div>
                    <FormControl>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => field.onChange("donor")}
                          aria-pressed={field.value === "donor"}
                          className={`choice-card min-h-32 ${field.value === "donor" ? "choice-card-active" : "text-slate-gray"}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <HandHeart className="size-6" />
                            {field.value === "donor" ? <CheckCircle2 className="size-5 text-forest-green" /> : null}
                          </div>
                          <p className="mt-6 font-semibold">Donate Funds</p>
                          <p className="mt-2 text-sm leading-6 text-slate-gray">Find verified campaigns and create donation records.</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange("recipient")}
                          aria-pressed={field.value === "recipient"}
                          className={`choice-card min-h-32 ${field.value === "recipient" ? "choice-card-active" : "text-slate-gray"}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <ArrowRight className="size-6" />
                            {field.value === "recipient" ? <CheckCircle2 className="size-5 text-forest-green" /> : null}
                          </div>
                          <p className="mt-6 font-semibold">Raise Funds</p>
                          <p className="mt-2 text-sm leading-6 text-slate-gray">Submit campaigns, evidence, and payment QR methods.</p>
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <section>
                <div className="form-section-heading mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">Identity</h3>
                    <p className="mt-1 text-sm text-slate-gray">Use your legal name or primary organization contact.</p>
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2 space-y-0">
                        <FormLabel className="field-label">First name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-gray" />
                            <Input autoComplete="given-name" className="pl-12 py-6 text-base rounded-md" placeholder="First Name" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2 space-y-0">
                        <FormLabel className="field-label">Last name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-gray" />
                            <Input autoComplete="family-name" className="pl-12 py-6 text-base rounded-md" placeholder="Last Name" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2 space-y-0">
                        <FormLabel className="field-label">Phone number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-gray" />
                            <Input autoComplete="tel" placeholder="+977 98XXXXXXXX" className="pl-12 py-6 text-base rounded-md" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription className="field-help">Use the +977 country code.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2 space-y-0">
                        <FormLabel className="field-label">Email address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-gray" />
                            <Input type="email" autoComplete="email" className="pl-12 py-6 text-base rounded-md" placeholder="name@example.com" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section>
                <div className="form-section-heading mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">Security</h3>
                    <p className="mt-1 text-sm text-slate-gray">Set a password for dashboard access.</p>
                  </div>
                  <ShieldCheck className="size-5 text-forest-green" />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2 space-y-0">
                        <FormLabel className="field-label">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-gray" />
                            <Input type="password" autoComplete="new-password" className="pl-12 py-6 text-base rounded-md" placeholder="Enter password" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription className="field-help">Minimum 8 characters.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2 space-y-0">
                        <FormLabel className="field-label">Confirm password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-gray" />
                            <Input type="password" autoComplete="new-password" className="pl-12 py-6 text-base rounded-md" placeholder="Confirm password" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Create Account
                {!isLoading ? <User className="ml-2 size-4" /> : null}
              </Button>
            </form>
          </Form>

          <p className="mt-8 text-sm text-slate-gray">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-vibrant-coral">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
