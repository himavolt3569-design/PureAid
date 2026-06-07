"use client";

import { useState, useTransition } from "react";
import { AlertCircle, FileText, Image as ImageIcon, Loader2, MapPin, ShieldCheck, Target, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(
  () => import("@/components/location-picker").then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400">
        Loading map...
      </div>
    ),
  }
);

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
import { createCampaign } from "@/app/dashboard/actions";
import { createClient } from "@/lib/supabase";

const campaignSchema = z.object({
  title: z.string().min(1, "Campaign title is required."),
  summary: z.string().optional(),
  category: z.string(),
  goalAmount: z.coerce.number().min(1, "Goal amount must be greater than zero."),
  location: z.string().optional(),
  coverImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().min(10, "Please provide more details in the full story."),
  impactStatement: z.string().optional(),
});

type CampaignFormInput = z.input<typeof campaignSchema>;
type CampaignFormValues = z.output<typeof campaignSchema>;

type VerificationResult = {
  isVerified: boolean;
  confidence: number;
  text?: string;
};

function FileDropzone({
  file,
  setFile,
  label,
  description,
}: {
  file: File | null;
  setFile: (file: File | null) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-outline-variant hover:border-primary transition-all duration-300 rounded-2xl p-6 text-center cursor-pointer group bg-surface/50">
      <input
        type="file"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
        accept="image/*,.pdf"
      />
      <div className="flex flex-col items-center space-y-3 group-hover:scale-105 transition-transform duration-300">
        <div className="p-3 bg-background rounded-full shadow-sm border border-outline-variant group-hover:border-primary/50">
          <UploadCloud className="size-6 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-on-surface">
            {file ? file.name : label}
          </p>
          <p className="text-xs text-slate-gray mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

const categoryRequirements: Record<string, { label: string, description: string }> = {
  medical: { label: "Hospital Verification", description: "Official hospital letter or report" },
  education: { label: "School ID", description: "Valid student ID or acceptance letter" },
  startup: { label: "Business Registration", description: "Company registration or proposal" },
  relief: { label: "Disaster Evidence", description: "Photos or official reports" },
  other: { label: "Primary Report", description: "Main supporting evidence" }
};

export function CreateCampaignForm() {
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, startSubmit] = useTransition();
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [citizenshipFile, setCitizenshipFile] = useState<File | null>(null);
  const [panVatFile, setPanVatFile] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const form = useForm<CampaignFormInput, unknown, CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: "",
      summary: "",
      category: "medical",
      goalAmount: 0,
      location: "",
      coverImageUrl: "",
      description: "",
      impactStatement: "",
    },
  });

  const handleVerify = async () => {
    if (!primaryFile) {
      toast.error("Please upload a Primary Report document first.");
      return;
    }

    setIsScanning(true);
    const formData = new FormData();
    formData.append("file", primaryFile);
    formData.append("documentType", form.getValues("category"));

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Verification failed");

      setVerificationResult(data.data);
      toast.success("Primary document scanned successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsScanning(false);
    }
  };

  const currentCategory = form.watch("category");
  const primaryDocConfig = categoryRequirements[currentCategory] || categoryRequirements.other;

  const onSubmit = (values: CampaignFormValues) => {
    startSubmit(async () => {
      try {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => formData.append(key, String(value)));

        if (primaryFile) formData.set("primaryDocument", primaryFile);
        if (citizenshipFile) formData.set("citizenshipDocument", citizenshipFile);
        if (panVatFile) formData.set("panVatDocument", panVatFile);

        if (verificationResult) {
          formData.set("verificationPassed", String(verificationResult.isVerified));
          formData.set("verificationConfidence", String(verificationResult.confidence));
          formData.set("ocrExcerpt", verificationResult.text?.slice(0, 500) ?? "");
        }

        const result = await createCampaign(formData);
        if (result?.error) {
          toast.error(result.error);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not upload supporting document.");
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <p className="label-caps mb-3 text-slate-gray">VERIFICATION PORTAL</p>
        <h1 className="headline-xl text-primary">Create a Campaign</h1>
        <p className="mt-2 max-w-2xl text-slate-gray">Submit the public story, funding target, and verification evidence for review.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-12">
          <section className="form-panel lg:col-span-7">
            <div className="form-section-heading">
              <div>
                <h2 className="headline-md text-primary">Campaign Details</h2>
                <p className="mt-1 text-sm text-slate-gray">Write the public record donors will see before they fund.</p>
              </div>
              <FileText className="size-6 text-primary" />
            </div>

            <div className="grid gap-7">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 space-y-0">
                    <FormLabel className="field-label">Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Campaign title" className="py-6 px-4 text-base rounded-md" {...field} />
                    </FormControl>
                    <FormDescription className="field-help">Use a specific, outcome-focused title.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 space-y-0">
                    <FormLabel className="field-label">Short summary</FormLabel>
                    <FormControl>
                      <Input placeholder="One-line campaign summary" className="py-6 px-4 text-base rounded-md" {...field} />
                    </FormControl>
                    <FormDescription className="field-help">A concise sentence for campaign cards and previews.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-7 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 space-y-0">
                      <FormLabel className="field-label">Category</FormLabel>
                      <FormControl>
                        <select className="ghost-field w-full py-4 px-4 text-base rounded-md" {...field}>
                          <option value="medical">Medical</option>
                          <option value="education">Education</option>
                          <option value="startup">Startup Boost</option>
                          <option value="relief">Relief</option>
                          <option value="other">Other</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goalAmount"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 space-y-0">
                      <FormLabel className="field-label">Goal amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Target className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-gray" />
                          <Input
                            type="number"
                            min="1"
                            placeholder="NPR"
                            className="pl-12 py-6 text-base rounded-md"
                            {...field}
                            value={typeof field.value === "number" || typeof field.value === "string" ? field.value : ""}
                          />
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
                      <div>
                        <LocationPicker value={field.value} onChange={field.onChange} />
                        <input type="hidden" name={field.name} value={field.value || ""} />
                      </div>
                    </FormControl>
                    <FormDescription className="field-help">Click on the map to drop a pin and select the location.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coverImageUrl"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 space-y-0">
                    <FormLabel className="field-label">Cover image URL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <ImageIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-gray" />
                        <Input type="url" placeholder="https://..." className="pl-12 py-6 text-base rounded-md" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription className="field-help">Use a clear, inspection-friendly image. Avoid dark or abstract visuals.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 space-y-0">
                    <FormLabel className="field-label">Full story</FormLabel>
                    <FormControl>
                      <textarea rows={8} className="textarea-field p-4 text-base rounded-md" {...field} />
                    </FormControl>
                    <FormDescription className="field-help">Explain the need, timeline, evidence, and expected outcome.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="impactStatement"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 space-y-0">
                    <FormLabel className="field-label">Impact statement</FormLabel>
                    <FormControl>
                      <textarea rows={3} className="textarea-field p-4 text-base rounded-md" {...field} />
                    </FormControl>
                    <FormDescription className="field-help">Optional pull quote for the campaign page.</FormDescription>
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
                  <h2 className="headline-md text-primary">Campaign Documents</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-gray">Upload necessary supporting documents. The Primary Report will be scanned by our AI.</p>
                </div>
                <ShieldCheck className="size-6 text-forest-green" />
              </div>

              <div className="mt-6 space-y-4">
                <FileDropzone
                  file={primaryFile}
                  setFile={setPrimaryFile}
                  label={primaryDocConfig.label}
                  description={primaryDocConfig.description}
                />
                <FileDropzone
                  file={citizenshipFile}
                  setFile={setCitizenshipFile}
                  label="Citizenship Certificate"
                  description="Front & Back (JPG, PNG, PDF)"
                />
                <FileDropzone
                  file={panVatFile}
                  setFile={setPanVatFile}
                  label="PAN/VAT Document"
                  description="Official Tax Registration"
                />
              </div>

              {verificationResult ? (
                <div className={`mt-5 flex gap-3 rounded border p-4 ${verificationResult.isVerified ? "border-forest-green bg-[#b1f0ce]/20 text-forest-green" : "border-destructive text-destructive"}`}>
                  {verificationResult.isVerified ? <ShieldCheck className="mt-0.5 size-5" /> : <AlertCircle className="mt-0.5 size-5" />}
                  <div>
                    <p className="font-semibold">{verificationResult.isVerified ? "Verification successful" : "Needs manual review"}</p>
                    <p className="mt-1 text-sm">Confidence: {verificationResult.confidence.toFixed(2)}%</p>
                  </div>
                </div>
              ) : null}

              <Button type="button" variant="outline" onClick={handleVerify} disabled={!primaryFile || isScanning} className="mt-6 w-full">
                {isScanning ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ShieldCheck className="mr-2 size-4" />}
                Scan Primary Document
              </Button>
            </section>

            <div className="form-panel">
              <h3 className="font-semibold text-primary">Submission</h3>
              <p className="mt-2 text-sm leading-6 text-slate-gray">Verified campaigns publish immediately. Campaigns that need manual review stay pending.</p>
              <Button type="submit" variant="secondary" className="mt-6 w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Submit Campaign
              </Button>
            </div>
          </aside>
        </form>
      </Form>
    </div>
  );
}
