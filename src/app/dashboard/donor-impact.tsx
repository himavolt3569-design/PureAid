"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award, Share2, Star, TrendingUp, Trophy } from "lucide-react";
import { formatMoney } from "@/lib/format";

type DonorDonation = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  campaigns: any;
};

export function DonorImpact({ donations, donorName }: { donations: DonorDonation[], donorName: string }) {
  const [showShareSummary, setShowShareSummary] = useState(false);

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
  const campaignsHelped = new Set(donations.map(d => d.campaigns?.id).filter(Boolean)).size;

  const chartData = useMemo(() => {
    if (donations.length === 0) return [];
    
    // Group by month
    const grouped = donations.reduce((acc, d) => {
      const date = new Date(d.created_at);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      if (!acc[monthYear]) {
        acc[monthYear] = 0;
      }
      acc[monthYear] += d.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([date, amount]) => ({
      date,
      amount,
    }));
  }, [donations]);

  // Determine Badges
  const badges = [];
  if (donations.length > 0) badges.push({ name: "Seed Planter", icon: Star, color: "text-amber-500", bg: "bg-amber-100" });
  if (totalDonated >= 500 || campaignsHelped >= 5) badges.push({ name: "Community Hero", icon: Award, color: "text-blue-500", bg: "bg-blue-100" });
  if (totalDonated >= 1000 || campaignsHelped >= 10) badges.push({ name: "Lifesaver", icon: Trophy, color: "text-rose-500", bg: "bg-rose-100" });

  const handleShare = async () => {
    const text = `I've donated ${formatMoney(totalDonated)} across ${campaignsHelped} campaigns on PureAid! Join me in making an impact.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My PureAid Impact',
          text: text,
          url: window.location.origin,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      setShowShareSummary(true);
    }
  };

  return (
    <div className="space-y-8">
      {/* Impact Profile Overview */}
      <section className="grid gap-5 md:grid-cols-3">
        <div className="bg-gradient-to-br from-primary to-slate-800 p-8 rounded-xl text-paper-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
          <p className="label-caps opacity-80">Total Impact</p>
          <h2 className="text-5xl font-display mt-2">{formatMoney(totalDonated)}</h2>
          <p className="mt-4 text-sm opacity-90 flex items-center gap-2">
            <TrendingUp className="size-4" /> You're making a difference!
          </p>
        </div>

        <div className="bg-paper-white border border-surface-container p-8 rounded-xl shadow-sm relative overflow-hidden group hover:border-primary transition-colors">
          <p className="label-caps text-slate-gray">Campaigns Supported</p>
          <h2 className="text-5xl font-display mt-2 text-primary">{campaignsHelped}</h2>
          <p className="mt-4 text-sm text-slate-gray">
            Lives touched by your generosity.
          </p>
        </div>

        <div className="bg-paper-white border border-surface-container p-8 rounded-xl shadow-sm">
          <p className="label-caps text-slate-gray mb-4">Your Badges</p>
          <div className="flex flex-wrap gap-3">
            {badges.length > 0 ? badges.map(b => (
              <div key={b.name} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${b.bg} ${b.color} font-medium text-sm transition-transform hover:scale-105`}>
                <b.icon className="size-4" />
                {b.name}
              </div>
            )) : (
              <p className="text-sm text-slate-gray">Make a donation to earn badges!</p>
            )}
          </div>
        </div>
      </section>

      {/* Donation History Chart */}
      <section className="bg-paper-white p-6 rounded-xl border border-surface-container shadow-sm">
        <div className="mb-6">
          <h3 className="headline-md text-primary">Donation Journey</h3>
          <p className="text-slate-gray text-sm mt-1">Your philanthropic footprint over time.</p>
        </div>
        <div className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2F4F4F" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2F4F4F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `$${value}`} dx={-10} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [formatMoney(value), "Donated"]}
                />
                <Area type="monotone" dataKey="amount" stroke="#2F4F4F" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-surface-container rounded-lg">
              <p className="text-slate-gray">No donation history available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Share Impact */}
      <section className="bg-gradient-to-r from-surface-container-low to-paper-white border border-surface-container p-8 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="headline-md text-primary">Inspire Others</h3>
          <p className="text-slate-gray mt-2 max-w-lg">Share your philanthropic journey. Your leadership can inspire friends and family to join the cause and multiply your impact.</p>
        </div>
        <button 
          onClick={handleShare}
          className="shrink-0 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-medium text-paper-white transition-all hover:bg-vibrant-coral hover:shadow-lg hover:-translate-y-0.5"
        >
          <Share2 className="size-4" />
          Share My Impact
        </button>
      </section>

      {showShareSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4" onClick={() => setShowShareSummary(false)}>
          <div className="bg-paper-white p-8 rounded-2xl max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-surface-container flex items-center justify-center rounded-full mb-4">
                <Star className="size-8 text-vibrant-coral" />
              </div>
              <h2 className="text-2xl font-display text-primary mb-2">My PureAid Impact</h2>
              <p className="text-slate-gray mb-6">Screenshot this card to share with your network!</p>
              
              <div className="bg-surface-container-low p-6 rounded-xl border border-surface-container mb-6 text-left space-y-4">
                <div>
                  <p className="text-xs text-slate-gray uppercase tracking-wider font-semibold">Hero</p>
                  <p className="text-lg font-medium text-primary">{donorName || 'Generous Donor'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-gray uppercase tracking-wider font-semibold">Total Given</p>
                  <p className="text-2xl font-display text-primary">{formatMoney(totalDonated)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-gray uppercase tracking-wider font-semibold">Campaigns</p>
                  <p className="text-lg font-medium text-primary">{campaignsHelped} supported</p>
                </div>
              </div>

              <button 
                onClick={() => setShowShareSummary(false)}
                className="w-full inline-flex h-12 items-center justify-center rounded bg-surface-container font-medium text-primary hover:bg-outline-variant"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
