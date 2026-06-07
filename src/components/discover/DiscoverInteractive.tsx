"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CheckCircle2, Search, MapPin, Filter, AlertCircle, LayoutList, Map as MapIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { formatMoney, progressPercent } from "@/lib/format";

const CampaignMap = dynamic(() => import("./CampaignMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-surface-container animate-pulse rounded-2xl" />
});

type Campaign = {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  goal_amount: number;
  raised_amount: number;
  cover_image_url: string | null;
  location: string | null;
  verification_status: string;
  recipient?: any;
};

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Medical", value: "medical" },
  { label: "Education", value: "education" },
  { label: "Startup", value: "startup" },
  { label: "Relief", value: "relief" },
  { label: "Disaster", value: "disaster" },
];

const URGENCY_FILTERS = [
  { label: "Any Urgency", value: "" },
  { label: "High Urgency (<30% funded)", value: "high" },
  { label: "Close to Goal (>80% funded)", value: "close" },
];

export function DiscoverInteractive({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const [category, setCategory] = useState("");
  const [urgency, setUrgency] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  const filteredCampaigns = useMemo(() => {
    return initialCampaigns.filter((camp) => {
      // Category filter
      if (category && camp.category !== category) return false;
      
      // Urgency filter
      const percent = camp.raised_amount / camp.goal_amount;
      if (urgency === "high" && percent >= 0.3) return false;
      if (urgency === "close" && percent < 0.8) return false;

      return true;
    });
  }, [initialCampaigns, category, urgency]);

  function recipientName(recipient: any) {
    const profile = Array.isArray(recipient) ? recipient[0] : recipient;
    return profile?.organization_name || profile?.full_name || "Recipient";
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8 max-w-[1440px] mx-auto w-full">
      {/* Filters Header */}
      <div className="form-panel flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="headline-md text-primary flex items-center gap-2">
            <Filter className="w-5 h-5 text-vibrant-coral" />
            Discover & Filter
          </h2>
          <p className="text-sm text-slate-gray mt-1">Found {filteredCampaigns.length} campaigns matching your criteria</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="bg-paper-white border border-outline-variant rounded-lg px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none premium-shadow min-w-[140px]"
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select 
            value={urgency} 
            onChange={(e) => setUrgency(e.target.value)}
            className="bg-paper-white border border-outline-variant rounded-lg px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none premium-shadow min-w-[200px]"
          >
            {URGENCY_FILTERS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
      </div>

      {/* Mobile Toggle */}
      <div className="lg:hidden flex bg-surface-container rounded-lg p-1 premium-shadow">
        <button 
          onClick={() => setMobileView("list")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-colors ${mobileView === "list" ? "bg-paper-white text-primary shadow-sm" : "text-slate-gray"}`}
        >
          <LayoutList className="w-4 h-4" /> List
        </button>
        <button 
          onClick={() => setMobileView("map")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-colors ${mobileView === "map" ? "bg-paper-white text-primary shadow-sm" : "text-slate-gray"}`}
        >
          <MapIcon className="w-4 h-4" /> Map
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* List View */}
        <div className={`w-full lg:w-3/5 ${mobileView === "map" ? "hidden lg:block" : "block"}`}>
          {filteredCampaigns.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {filteredCampaigns.map((campaign) => {
                const percent = progressPercent(campaign.raised_amount, campaign.goal_amount);
                const isUrgent = percent < 30 && campaign.goal_amount > campaign.raised_amount;
                
                return (
                  <Link 
                    key={campaign.id} 
                    href={`/dashboard/discover/${campaign.id}`} 
                    className="group flex flex-col overflow-hidden border border-surface-container bg-paper-white premium-shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30"
                    onMouseEnter={() => setHoveredId(campaign.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="relative h-48 overflow-hidden bg-surface-container-low">
                      {campaign.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={campaign.cover_image_url} alt={campaign.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-surface-container-low text-center">
                          <Search className="size-8 text-slate-gray/50" />
                        </div>
                      )}
                      <div className="absolute left-3 top-3 flex items-center gap-2 bg-paper-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                        <CheckCircle2 className="size-3.5 text-forest-green" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{campaign.verification_status}</span>
                      </div>
                      {isUrgent && (
                        <div className="absolute right-3 top-3 flex items-center gap-1.5 bg-vibrant-coral/90 text-paper-white px-3 py-1.5 rounded-full shadow-sm">
                          <AlertCircle className="size-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Urgent</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="label-caps text-slate-gray">{campaign.category}</p>
                      <h2 className="text-lg font-bold mt-2 text-deep-indigo leading-tight line-clamp-2 group-hover:text-primary transition-colors">{campaign.title}</h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-gray">{campaign.summary ?? "No summary provided."}</p>
                      
                      <div className="mt-4 flex items-center gap-2 text-sm text-slate-gray border-t border-surface-container pt-4">
                        <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-primary">
                          {recipientName(campaign.recipient).charAt(0)}
                        </div>
                        <span className="font-medium text-deep-indigo truncate">{recipientName(campaign.recipient)}</span>
                      </div>

                      <div className="mt-auto pt-4">
                        <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                          <div className="h-full bg-forest-green transition-all duration-1000 ease-out" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="mt-2.5 flex justify-between items-end">
                          <div>
                            <p className="text-lg font-bold text-primary leading-none">{formatMoney(campaign.raised_amount)}</p>
                            <p className="text-[11px] font-medium text-slate-gray uppercase tracking-wider mt-1">raised</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-gray leading-none">{percent}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-outline-variant bg-paper-white rounded-xl p-16 text-center">
              <MapPin className="w-12 h-12 text-slate-gray/30 mx-auto mb-4" />
              <h2 className="headline-md text-primary">No campaigns found</h2>
              <p className="mt-2 text-slate-gray">Try adjusting your filters to discover more campaigns.</p>
              <button 
                onClick={() => { setCategory(""); setUrgency(""); }}
                className="mt-6 px-6 py-2 bg-surface-container text-primary font-medium rounded-full hover:bg-outline-variant transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Map View */}
        <div className={`w-full lg:w-2/5 relative ${mobileView === "list" ? "hidden lg:block" : "block h-[600px]"}`}>
          <div className="lg:sticky lg:top-24 h-full lg:h-[calc(100vh-140px)] min-h-[400px]">
             <CampaignMap campaigns={filteredCampaigns} hoveredId={hoveredId} />
          </div>
        </div>
      </div>
    </div>
  );
}
