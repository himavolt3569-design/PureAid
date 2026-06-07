"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, HeartHandshake, Loader2, Mail, QrCode, User } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createDonationIntent } from "@/app/dashboard/actions";

type PaymentMethod = {
  id: string;
  provider: string;
  display_name: string | null;
  qr_image_url: string | null;
  account_reference: string | null;
};

const suggestedAmounts = [1000, 2500, 5000, 10000];

const paymentTone: Record<string, string> = {
  esewa: "payment-esewa",
  khalti: "payment-khalti",
  imepay: "payment-imepay",
  bank: "payment-bank",
};

const donationSchema = z.object({
  amount: z.coerce.number().min(1, "Please enter a valid amount."),
  donorName: z.string().optional(),
  donorEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  isAnonymous: z.boolean().default(false),
});

type DonationFormInput = z.input<typeof donationSchema>;
type DonationFormValues = z.output<typeof donationSchema>;

export function DonationPanel({
  campaignId,
  paymentMethods,
}: {
  campaignId: string;
  paymentMethods: PaymentMethod[];
}) {
  const [selectedProvider, setSelectedProvider] = useState(paymentMethods[0]?.provider ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedMethod = paymentMethods.find((method) => method.provider === selectedProvider);

  const form = useForm<DonationFormInput, unknown, DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: "",
      donorName: "",
      donorEmail: "",
      isAnonymous: false,
    },
  });
  const watchedAmount = useWatch({ control: form.control, name: "amount" });

  function onSubmit(values: DonationFormValues) {
    setMessage(null);
    const formData = new FormData();
    formData.append("campaignId", campaignId);
    formData.append("paymentMethod", selectedProvider);
    formData.append("amount", String(values.amount));
    if (values.donorName) formData.append("donorName", values.donorName);
    if (values.donorEmail) formData.append("donorEmail", values.donorEmail);
    if (values.isAnonymous) formData.append("isAnonymous", "on");

    startTransition(async () => {
      const result = await createDonationIntent(formData);
      if (result?.error) {
        setMessage(result.error);
        return;
      }
      setMessage("Donation intent saved. Complete the transfer using the selected recipient QR.");
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="form-panel">
        <div className="form-section-heading">
          <div>
            <p className="label-caps mb-2 text-slate-gray">DIRECT DONATION</p>
            <h2 className="headline-md text-primary">Fund this cause</h2>
          </div>
          <HeartHandshake className="size-6 text-vibrant-coral" />
        </div>

        <section className="space-y-5">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2 space-y-0">
                <FormLabel className="field-label">Donation amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary">NPR</span>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      className="pl-14 py-6 text-base rounded-md"
                      {...field}
                      value={typeof field.value === "number" || typeof field.value === "string" ? field.value : ""}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {suggestedAmounts.map((suggestedAmount) => (
              <button
                key={suggestedAmount}
                type="button"
                onClick={() => form.setValue("amount", suggestedAmount)}
                className={`label-caps h-11 rounded border ${
                  Number(watchedAmount) === suggestedAmount
                    ? "border-primary bg-surface-container-low text-primary"
                    : "border-outline-variant text-slate-gray hover:border-primary hover:text-primary"
                }`}
              >
                {suggestedAmount.toLocaleString("en-NP")}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 space-y-5">
          <div>
            <h3 className="font-semibold text-primary">Donor details</h3>
            <p className="mt-1 text-sm text-slate-gray">Optional, but useful for receipts and reconciliation.</p>
          </div>
          
          <FormField
            control={form.control}
            name="donorName"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2 space-y-0">
                <FormLabel className="field-label">Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-gray" />
                    <Input className="pl-12 py-6 text-base rounded-md" placeholder="Full name" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="donorEmail"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2 space-y-0">
                <FormLabel className="field-label">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-gray" />
                    <Input type="email" autoComplete="email" className="pl-12 py-6 text-base rounded-md" placeholder="Email address" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isAnonymous"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 border border-surface-container p-4 text-sm text-slate-gray space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    className="size-4 rounded border-outline-variant text-primary focus:ring-primary"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0 cursor-pointer text-slate-gray">Show this donation publicly as anonymous</FormLabel>
              </FormItem>
            )}
          />
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <QrCode className="size-5" />
            <span className="label-caps">Payment method</span>
          </div>

          {paymentMethods.length > 0 ? (
            <div className="grid gap-3">
              {paymentMethods.map((method) => {
                const selected = selectedProvider === method.provider;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedProvider(method.provider)}
                    aria-pressed={selected}
                    className={`payment-card ${paymentTone[method.provider] ?? "payment-bank"} ${selected ? "payment-card-open" : ""} flex min-h-14 items-center justify-between px-4 text-left font-semibold`}
                  >
                    <span className="payment-accent-text">{method.display_name || method.provider}</span>
                    {selected ? <CheckCircle2 className="size-5 text-forest-green" /> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-outline-variant p-5 text-sm leading-6 text-slate-gray">
              This recipient has not published a payment QR yet.
            </div>
          )}
        </section>

        {selectedMethod ? (
          <div className="mt-6 border border-surface-container-high bg-surface-container-low p-5 text-center">
            {selectedMethod.qr_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedMethod.qr_image_url} alt={`${selectedMethod.provider} QR`} className="mx-auto size-56 object-contain" />
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-slate-gray">QR image URL not provided</div>
            )}
            {selectedMethod.account_reference ? (
              <p className="mt-4 text-sm font-semibold text-primary">{selectedMethod.account_reference}</p>
            ) : null}
          </div>
        ) : null}

        <Button type="submit" variant="secondary" className="mt-8 w-full" disabled={isPending || paymentMethods.length === 0}>
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Save Donation Intent
        </Button>

        {message ? <p className={`mt-4 text-sm leading-6 ${message.includes("saved") ? "text-forest-green" : "text-destructive"}`}>{message}</p> : null}
      </form>
    </Form>
  );
}
