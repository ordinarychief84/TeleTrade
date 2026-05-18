import { Inter } from 'next/font/google';
import { LandingNav } from '@/components/landing/sections/landing-nav';
import { Hero } from '@/components/landing/sections/hero';
import { Problem } from '@/components/landing/sections/problem';
import { Solution } from '@/components/landing/sections/solution';
import { HowItWorks } from '@/components/landing/sections/how-it-works';
import { UseCases } from '@/components/landing/sections/use-cases';
import { Reporting } from '@/components/landing/sections/reporting';
import { Integrations } from '@/components/landing/sections/integrations';
import { Audience } from '@/components/landing/sections/audience';
import { SocialProof } from '@/components/landing/sections/social-proof';
import { FinalCTA } from '@/components/landing/sections/final-cta';
import { LandingFooter } from '@/components/landing/sections/landing-footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'TeleTrade — Telesales infrastructure for traditional trade',
  description:
    'TeleTrade is the telesales operating system FMCG distributors use to call dormant outlets, lift coverage, and turn calls into route deliveries — at a fraction of field cost.',
};

export default function LandingPage() {
  return (
    <main
      className={inter.variable}
      style={{ fontFamily: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif' }}
    >
      <LandingNav />
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <UseCases />
      <Reporting />
      <Integrations />
      <Audience />
      <SocialProof />
      <FinalCTA />
      <LandingFooter />
    </main>
  );
}
