"use client";

import { useTransition } from "react";
import { FileText, Image as ImageIcon, Loader2, MapPin, Target } from "lucide-react";
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
import { editCampaign } from "@/app/dashboard/actions";

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

export function EditCampaignForm({ campaign }: { campaign: any }) {
  const [isSubmitting, startSubmit] = useTransition();

  const form = useForm<CampaignFormInput, unknown, CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: campaign.title || "",
      summary: campaign.summary || "",
      category: campaign.category || "medical",
      goalAmount: campaign.goal_amount || 0,
      location: campaign.location || "",
      coverImageUrl: campaign.cover_image_url || "",
      description: campaign.description || "",
      impactStatement: campaign.impact_statement || "",
    },
  });

  const onSubmit = (values: CampaignFormValues) => {
    startSubmit(async () => {
      try {
        const formData = new FormData();
        formData.append("campaignId", campaign.id);
        Object.entries(values).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        const result = await editCampaign(formData);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success("Campaign updated successfully.");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to edit campaign.");
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <p className="label-caps mb-3 text-slate-gray">EDIT CAMPAIGN</p>
        <h1 className="headline-xl text-primary">Edit {campaign.title}</h1>
        <p className="mt-2 max-w-2xl text-slate-gray">Update your campaign details. Note that saving changes will revert its status to pending verification.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-12">
          <section className="form-panel lg:col-span-8">
            <div className="form-section-heading">
              <div>
                <h2 className="headline-md text-primary">Campaign Details</h2>
                <p className="mt-1 text-sm text-slate-gray">Write the public record donors will see before they fund.</p>
              </div>
              <FileText className="size-6 text-primary" />
            </div>

            <div className="grid gap-7 mt-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 space-y-0">
                    <FormLabel className="field-label">Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Campaign title" className="py-6 px-4 text-base rounded-md" {...field} />
                    </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <aside className="space-y-8 lg:col-span-4">
            <div className="form-panel">
              <h3 className="font-semibold text-primary">Save Changes</h3>
              <p className="mt-2 text-sm leading-6 text-slate-gray">Updating these details will reset the campaign's verification status to pending review.</p>
              <Button type="submit" variant="secondary" className="mt-6 w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Save Campaign
              </Button>
            </div>
          </aside>
        </form>
      </Form>
    </div>
  );
}
