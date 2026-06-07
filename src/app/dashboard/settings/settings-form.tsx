"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, ChevronDown, Loader2, Mail, MapPin, Phone, ShieldCheck, UploadCloud, User } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Path } from "react-hook-form";
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
import { saveSettings } from "@/app/dashboard/actions";
import { createClient } from "@/lib/supabase";

type Profile = {
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  organization_name: string | null;
  location: string | null;
  bio: string | null;
  verification_status: string | null;
};

type PaymentMethod = {
  provider: string;
  display_name: string | null;
  qr_image_url: string | null;
  account_reference: string | null;
  is_active: boolean;
};

type PaymentProvider = {
  provider: "esewa" | "khalti" | "imepay" | "bank";
  label: string;
};

const paymentProviders: PaymentProvider[] = [
  { provider: "esewa", label: "eSewa" },
  { provider: "khalti", label: "Khalti" },
  { provider: "imepay", label: "IME Pay" },
  { provider: "bank", label: "Bank / Fonepay" },
];

const paymentTone: Record<PaymentProvider["provider"], string> = {
  esewa: "payment-esewa",
  khalti: "payment-khalti",
  imepay: "payment-imepay",
  bank: "payment-bank",
};

const settingsSchema = z.object({
  fullName: z.string().optional(),
  organizationName: z.string().optional(),
  phoneNumber: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  esewaName: z.string().optional(),
  esewaReference: z.string().optional(),
  esewaQrUrl: z.string().optional(),
  khaltiName: z.string().optional(),
  khaltiReference: z.string().optional(),
  khaltiQrUrl: z.string().optional(),
  imepayName: z.string().optional(),
  imepayReference: z.string().optional(),
  imepayQrUrl: z.string().optional(),
  bankName: z.string().optional(),
  bankReference: z.string().optional(),
  bankQrUrl: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm({
  userId,
  userEmail,
  role,
  profile,
  paymentMethods,
}: {
  userId: string;
  userEmail: string | null;
  role: string;
  profile: Profile | null;
  paymentMethods: PaymentMethod[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showPayments, setShowPayments] = useState(false);
  const [activeProvider, setActiveProvider] = useState<PaymentProvider["provider"]>("esewa");
  const [uploadingProvider, setUploadingProvider] = useState<string | null>(null);

  const canManagePayments = role === "recipient";
  const methodByProvider = useMemo(
    () => new Map(paymentMethods.map((method) => [method.provider, method])),
    [paymentMethods]
  );

  const defaultValues: SettingsFormValues = {
    fullName: profile?.full_name ?? "",
    organizationName: profile?.organization_name ?? "",
    phoneNumber: profile?.phone_number ?? "",
    location: profile?.location ?? "",
    bio: profile?.bio ?? "",
    esewaName: methodByProvider.get("esewa")?.display_name ?? "eSewa",
    esewaReference: methodByProvider.get("esewa")?.account_reference ?? "",
    esewaQrUrl: methodByProvider.get("esewa")?.qr_image_url ?? "",
    khaltiName: methodByProvider.get("khalti")?.display_name ?? "Khalti",
    khaltiReference: methodByProvider.get("khalti")?.account_reference ?? "",
    khaltiQrUrl: methodByProvider.get("khalti")?.qr_image_url ?? "",
    imepayName: methodByProvider.get("imepay")?.display_name ?? "IME Pay",
    imepayReference: methodByProvider.get("imepay")?.account_reference ?? "",
    imepayQrUrl: methodByProvider.get("imepay")?.qr_image_url ?? "",
    bankName: methodByProvider.get("bank")?.display_name ?? "Bank / Fonepay",
    bankReference: methodByProvider.get("bank")?.account_reference ?? "",
    bankQrUrl: methodByProvider.get("bank")?.qr_image_url ?? "",
  };

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  const qrUrls = {
    esewa: useWatch({ control: form.control, name: "esewaQrUrl" }),
    khalti: useWatch({ control: form.control, name: "khaltiQrUrl" }),
    imepay: useWatch({ control: form.control, name: "imepayQrUrl" }),
    bank: useWatch({ control: form.control, name: "bankQrUrl" }),
  } as Record<string, string | undefined>;
  const accountReferences = {
    esewa: useWatch({ control: form.control, name: "esewaReference" }),
    khalti: useWatch({ control: form.control, name: "khaltiReference" }),
    imepay: useWatch({ control: form.control, name: "imepayReference" }),
    bank: useWatch({ control: form.control, name: "bankReference" }),
  } as Record<string, string | undefined>;

  const configuredCount = paymentProviders.filter((provider) => {
    const method = methodByProvider.get(provider.provider);
    return Boolean(qrUrls[provider.provider] || method?.account_reference);
  }).length;
  
  const selectedProvider = paymentProviders.find((provider) => provider.provider === activeProvider) ?? paymentProviders[0];

  async function uploadQr(provider: string, file: File | null) {
    if (!file) return;

    setUploadingProvider(provider);
    const supabase = createClient();
    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${userId}/${provider}.${extension}`;

    const { error } = await supabase.storage.from("payment-qrs").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      toast.error(error.message);
      setUploadingProvider(null);
      return;
    }

    const { data } = supabase.storage.from("payment-qrs").getPublicUrl(path);
    form.setValue(`${provider}QrUrl` as Path<SettingsFormValues>, data.publicUrl);
    toast.success("QR image uploaded.");
    setUploadingProvider(null);
  }

  const onSubmit = (values: SettingsFormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        Object.entries(values).forEach(([key, val]) => {
          if (val) formData.append(key, val);
        });
        await saveSettings(formData);
        toast.success("Settings saved.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save settings.");
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <p className="label-caps mb-3 text-slate-gray">ACCOUNT SETTINGS</p>
        <h1 className="headline-xl text-primary">Settings</h1>
        <p className="mt-2 max-w-2xl text-slate-gray">
          Manage your profile{canManagePayments ? " and direct payment readiness." : "."}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-12">
          <section className="form-panel lg:col-span-7">
            <div className="form-section-heading">
              <div>
                <h2 className="headline-md text-primary">Profile Details</h2>
                <p className="mt-1 text-sm text-slate-gray">Keep this short, accurate, and ready for public campaign pages.</p>
              </div>
              <User className="size-6 text-primary" />
            </div>

            <div className="grid gap-7">
              <div className="grid gap-7 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 space-y-0">
                      <FormLabel className="field-label">Full name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" className="py-6 px-4 text-base rounded-md" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 space-y-0">
                      <FormLabel className="field-label">Organization</FormLabel>
                      <FormControl>
                        <Input placeholder="Organization name" className="py-6 px-4 text-base rounded-md" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-7 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="field-label">Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-gray" />
                    <Input value={profile?.email ?? userEmail ?? ""} disabled className="pl-12 py-6 text-base rounded-md" />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 space-y-0">
                      <FormLabel className="field-label">Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-gray" />
                          <Input placeholder="Phone number" className="pl-12 py-6 text-base rounded-md" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 space-y-0">
                    <FormLabel className="field-label">Location</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-gray" />
                        <Input placeholder="City, district, or region" className="pl-12 py-6 text-base rounded-md" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 space-y-0">
                    <FormLabel className="field-label">Bio</FormLabel>
                    <FormControl>
                      <textarea rows={7} className="textarea-field p-4 text-base rounded-md" {...field} />
                    </FormControl>
                    <FormDescription className="field-help">For recipients, describe who receives funds and how campaign money is handled.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <aside className="space-y-8 lg:col-span-5">
            <section className="form-panel">
              <div className="form-section-heading">
                <div>
                  <h2 className="headline-md text-primary">Account State</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-gray">Verification and role determine which tools are available.</p>
                </div>
                <ShieldCheck className="size-6 text-forest-green" />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="border border-surface-container p-4">
                  <p className="label-caps text-slate-gray">Role</p>
                  <p className="mt-2 font-semibold capitalize text-primary">{role}</p>
                </div>
                <div className="border border-surface-container p-4">
                  <p className="label-caps text-slate-gray">Verification</p>
                  <p className="mt-2 font-semibold capitalize text-primary">{profile?.verification_status ?? "unsubmitted"}</p>
                </div>
              </div>
            </section>

            {canManagePayments ? (
              <section className="form-panel">
                <button
                  type="button"
                  onClick={() => setShowPayments((value) => !value)}
                  className="flex w-full items-start justify-between gap-4 text-left"
                >
                  <div>
                    <h2 className="headline-md text-primary">Payment Methods</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-gray">Show only when updating QR and wallet details.</p>
                    <p className="mt-4 font-semibold text-primary">{configuredCount}/4 ready</p>
                  </div>
                  <ChevronDown className={`mt-2 size-5 text-primary transition-transform ${showPayments ? "rotate-180" : ""}`} />
                </button>

                {showPayments ? (
                  <div className="mt-6 space-y-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {paymentProviders.map((provider) => {
                        const active = Boolean(qrUrls[provider.provider] || accountReferences[provider.provider]);
                        const selected = activeProvider === provider.provider;

                        return (
                          <button
                            key={provider.provider}
                            type="button"
                            onClick={() => setActiveProvider(provider.provider)}
                            className={`payment-card ${paymentTone[provider.provider]} ${selected ? "payment-card-open" : ""} flex items-center justify-between gap-3 p-4 text-left`}
                          >
                            <div>
                              <p className="font-semibold payment-accent-text">{provider.label}</p>
                              <p className="mt-1 text-xs text-slate-gray">{active ? "Ready" : "Not configured"}</p>
                            </div>
                            {active ? <CheckCircle2 className="size-5 text-forest-green" /> : null}
                          </button>
                        );
                      })}
                    </div>

                    <div key={selectedProvider.provider} className={`payment-card ${paymentTone[selectedProvider.provider]} payment-card-open p-5`}>
                      <div className="grid gap-7">
                        <FormField
                          control={form.control}
                          name={`${selectedProvider.provider}Name` as Path<SettingsFormValues>}
                          render={({ field }) => (
                            <FormItem className="flex flex-col gap-2 space-y-0">
                              <FormLabel className="field-label">Display name</FormLabel>
                              <FormControl>
                                <Input className="py-6 px-4 text-base rounded-md" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`${selectedProvider.provider}Reference` as Path<SettingsFormValues>}
                          render={({ field }) => (
                            <FormItem className="flex flex-col gap-2 space-y-0">
                              <FormLabel className="field-label">Account reference</FormLabel>
                              <FormControl>
                                <Input placeholder="Wallet ID, account name, or note" className="py-6 px-4 text-base rounded-md" {...field} />
                              </FormControl>
                              <FormDescription className="field-help">Wallet ID, account name, or donor-facing transfer note.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex flex-col gap-2">
                          <span className="field-label">QR image</span>
                          <label className="relative flex min-h-48 cursor-pointer flex-col items-center justify-center border border-dashed border-outline-variant p-8 text-center hover:border-deep-indigo">
                            <UploadCloud className="mb-4 size-10 text-slate-gray" />
                            <span className="font-semibold payment-accent-text">
                              {uploadingProvider === selectedProvider.provider ? "Uploading..." : `Upload ${selectedProvider.label} QR`}
                            </span>
                            <span className="mt-1 text-xs text-slate-gray">PNG, JPG, or WEBP</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                              disabled={uploadingProvider === selectedProvider.provider}
                              onChange={(event) => uploadQr(selectedProvider.provider, event.target.files?.[0] ?? null)}
                            />
                          </label>
                        </div>

                        {qrUrls[selectedProvider.provider] ? (
                          <div className="border border-surface-container bg-paper-white p-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrUrls[selectedProvider.provider]} alt={`${selectedProvider.label} QR preview`} className="h-40 w-full object-contain" />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : (
              <section className="form-panel">
                <h2 className="headline-md text-primary">Profile Only</h2>
                <p className="mt-2 text-sm leading-6 text-slate-gray">Payment QR controls are only shown for recipient accounts.</p>
              </section>
            )}

            <div className="form-panel">
              <h3 className="font-semibold text-primary">Submission</h3>
              <p className="mt-2 text-sm leading-6 text-slate-gray">Save profile changes before publishing campaigns or updating payment details.</p>
              <Button type="submit" variant="secondary" className="mt-6 w-full" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Save Settings
              </Button>
            </div>
          </aside>
        </form>
      </Form>
    </div>
  );
}
