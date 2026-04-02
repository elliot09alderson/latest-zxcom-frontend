import { Sparkles, Trophy } from 'lucide-react';
import PublicLayout from '../components/layout/PublicLayout';
import HeroBanner from '../components/landing/HeroBanner';
import CampaignSection from '../components/landing/CampaignSection';
import WinnerGallery from '../components/landing/WinnerGallery';

function SectionHeading({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="p-2.5 rounded-xl bg-[#e94560]/10 border border-[#e94560]/20">
        <Icon className="w-5 h-5 text-[#e94560]" />
      </div>
      <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
        {children}
      </h2>
    </div>
  );
}

export default function HomePage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <HeroBanner />

      {/* Active Campaigns */}
      <section id="campaigns" className="px-6 md:px-16 py-16 scroll-mt-20">
        <SectionHeading icon={Sparkles}>Active Campaigns</SectionHeading>
        <CampaignSection />
      </section>

      {/* Winners */}
      <section id="winners" className="px-6 md:px-16 py-16 scroll-mt-20">
        <SectionHeading icon={Trophy}>Recent Winners</SectionHeading>
        <WinnerGallery />
      </section>
    </PublicLayout>
  );
}
