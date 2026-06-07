import { Navbar } from "@/components/navbar";
import { Reveal } from "@/components/reveal";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { ShieldCheck, Heart, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ImpactPage() {
  const supabase = await createClient();
  
  // Aggregate stats from DB
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("raised_amount, status")
    .eq("status", "active");
    
  const { count: recipientCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "recipient");

  const totalRaised = (campaigns ?? []).reduce((sum, campaign) => sum + Number(campaign.raised_amount ?? 0), 0);
  const livesHelped = recipientCount ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="container-page py-20 md:py-32">
        <Reveal>
          <div className="max-w-4xl mx-auto text-center mb-20">
            <h1 className="text-5xl md:text-7xl lg:text-[84px] font-bold tracking-tight text-deep-indigo mb-6 leading-[1.05]">Real Impact.</h1>
            <p className="text-xl md:text-2xl text-slate-gray leading-relaxed font-medium">See how your contributions are changing lives in real-time.</p>
          </div>
        </Reveal>
        
        <Reveal delay={0.2}>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
            <div className="bg-paper-white p-12 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 text-center flex flex-col items-center justify-center min-h-[300px]">
               <div className="bg-primary/10 p-4 rounded-full mb-6">
                 <Heart className="size-8 text-primary" />
               </div>
               <h2 className="text-6xl md:text-7xl font-bold text-primary mb-4 tracking-tight">{formatMoney(totalRaised)}</h2>
               <p className="text-xl text-slate-gray font-bold tracking-wider uppercase">Total Funds Delivered</p>
            </div>
            <div className="bg-paper-white p-12 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 text-center flex flex-col items-center justify-center min-h-[300px]">
               <div className="bg-primary/10 p-4 rounded-full mb-6">
                 <Sparkles className="size-8 text-primary" />
               </div>
               <h2 className="text-6xl md:text-7xl font-bold text-primary mb-4 tracking-tight">{livesHelped}</h2>
               <p className="text-xl text-slate-gray font-bold tracking-wider uppercase">Lives Changed</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="max-w-4xl mx-auto bg-surface-container-low rounded-[2.5rem] p-10 md:p-14 text-center border border-outline-variant/50">
             <ShieldCheck className="size-16 text-primary mx-auto mb-6" />
             <h3 className="text-3xl font-bold text-deep-indigo mb-4">Direct Delivery Guarantee</h3>
             <p className="text-lg text-slate-gray font-medium leading-relaxed max-w-2xl mx-auto">
               We don't hold the funds. Every rupee given through PureAID is transferred directly to the verified recipient's wallet or bank account, ensuring 100% of your impact reaches its destination immediately.
             </p>
          </div>
        </Reveal>
      </main>
    </div>
  );
}
