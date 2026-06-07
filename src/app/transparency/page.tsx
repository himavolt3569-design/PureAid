import { Navbar } from "@/components/navbar";
import { Reveal } from "@/components/reveal";
import { Search, Eye, FileCheck2, Fingerprint } from "lucide-react";

export default function TransparencyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="container-page py-20 md:py-32">
        <Reveal>
          <div className="max-w-4xl mb-16">
            <h1 className="text-5xl md:text-7xl lg:text-[84px] font-bold tracking-tight text-deep-indigo mb-6 leading-[1.05]">100% Transparency.</h1>
            <p className="text-xl md:text-2xl text-slate-gray leading-relaxed font-medium">We believe you should know exactly where your money goes. Every rupee is tracked and publicly verified.</p>
          </div>
        </Reveal>
        
        <Reveal delay={0.2}>
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-surface-container-low p-10 rounded-[2.5rem] border border-outline-variant/50">
              <FileCheck2 className="size-10 text-primary mb-6" />
              <h3 className="text-2xl font-bold text-deep-indigo mb-3">Verified Documents</h3>
              <p className="text-slate-gray font-medium">Every campaign requires strict uploading of official medical bills, school fees, or business registrations before publishing.</p>
            </div>
            <div className="bg-surface-container-low p-10 rounded-[2.5rem] border border-outline-variant/50">
              <Fingerprint className="size-10 text-primary mb-6" />
              <h3 className="text-2xl font-bold text-deep-indigo mb-3">Identity Checked</h3>
              <p className="text-slate-gray font-medium">Recipients must verify their exact identity matching their bank accounts. No anonymous fundraising allowed.</p>
            </div>
            <div className="bg-surface-container-low p-10 rounded-[2.5rem] border border-outline-variant/50">
              <Eye className="size-10 text-primary mb-6" />
              <h3 className="text-2xl font-bold text-deep-indigo mb-3">Open Ledger</h3>
              <p className="text-slate-gray font-medium">All completed donations are tracked publicly so you can verify that the recipient successfully got the funds.</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="bg-paper-white rounded-[3rem] p-10 md:p-14 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <div>
                <h3 className="text-3xl font-bold text-deep-indigo">Public Ledger</h3>
                <p className="text-lg text-slate-gray font-medium mt-2">Real-time donation tracking</p>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-gray" />
                <input 
                  type="text" 
                  placeholder="Search transaction ID..." 
                  className="pl-12 pr-4 py-3 rounded-full bg-surface-container-low border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-container text-slate-gray text-sm font-bold uppercase tracking-wider">
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-4">Campaign</th>
                    <th className="py-4 px-4">Amount</th>
                    <th className="py-4 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="font-medium">
                  <tr className="border-b border-surface-container/50 hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-4 text-slate-gray">Today</td>
                    <td className="py-4 px-4 text-deep-indigo">Awaiting first transactions</td>
                    <td className="py-4 px-4 text-deep-indigo">--</td>
                    <td className="py-4 px-4"><span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase">Pending</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </main>
    </div>
  );
}
