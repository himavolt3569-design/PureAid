import { Navbar } from "@/components/navbar";
import { Reveal } from "@/components/reveal";
import Link from "next/link";
import { ArrowRight, HeartPulse, GraduationCap, BriefcaseBusiness } from "lucide-react";

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="container-page py-20 md:py-32">
        <Reveal>
          <div className="max-w-3xl mb-16">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-deep-indigo mb-6 leading-[1.05]">Discover Causes.</h1>
            <p className="text-xl text-slate-gray leading-relaxed font-medium">Explore verified campaigns and find someone to help today.</p>
          </div>
        </Reveal>
        
        <Reveal delay={0.2}>
          <div className="grid md:grid-cols-3 gap-6 mb-16">
             {/* Category Cards */}
             <div className="bg-surface-container-low p-10 rounded-[2.5rem] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-outline-variant/50 group">
               <HeartPulse className="size-12 text-primary mb-6" />
               <h3 className="text-3xl font-bold mb-3 text-deep-indigo">Medical</h3>
               <p className="text-slate-gray mb-8 text-lg font-medium">Help cover urgent health bills and treatments.</p>
               <Link href="/campaigns" className="font-bold text-primary inline-flex items-center group-hover:text-vibrant-coral transition-colors">Browse <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1"/></Link>
             </div>
             
             <div className="bg-surface-container-low p-10 rounded-[2.5rem] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-outline-variant/50 group">
               <GraduationCap className="size-12 text-primary mb-6" />
               <h3 className="text-3xl font-bold mb-3 text-deep-indigo">Education</h3>
               <p className="text-slate-gray mb-8 text-lg font-medium">Support students, teachers, and schools.</p>
               <Link href="/campaigns" className="font-bold text-primary inline-flex items-center group-hover:text-vibrant-coral transition-colors">Browse <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1"/></Link>
             </div>
             
             <div className="bg-surface-container-low p-10 rounded-[2.5rem] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-outline-variant/50 group">
               <BriefcaseBusiness className="size-12 text-primary mb-6" />
               <h3 className="text-3xl font-bold mb-3 text-deep-indigo">Startups</h3>
               <p className="text-slate-gray mb-8 text-lg font-medium">Fund local small businesses and founders.</p>
               <Link href="/campaigns" className="font-bold text-primary inline-flex items-center group-hover:text-vibrant-coral transition-colors">Browse <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1"/></Link>
             </div>
          </div>
        </Reveal>

        <Reveal delay={0.4}>
           <div className="flex justify-center mt-12">
             <Link href="/campaigns" className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-10 text-paper-white font-semibold text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(28,84,56,0.25)]">
                View All Campaigns
             </Link>
           </div>
        </Reveal>
      </main>
    </div>
  );
}
