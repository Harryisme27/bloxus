import { PageContainer } from "@/components/PageContainer";
import { TrustBar } from "@/components/TrustBar";
import { SetupNotice } from "@/components/SetupNotice";
import { HeroSection } from "@/components/storefront/HeroSection";
import { HomeStats } from "@/components/storefront/HomeStats";
import { FeaturedGames } from "@/components/storefront/FeaturedGames";
import { TrendingItems } from "@/components/storefront/TrendingItems";
import { ProofTicker } from "@/components/storefront/ProofTicker";
import { ReviewsPreview } from "@/components/storefront/ReviewsPreview";
import { DiscordCTA } from "@/components/storefront/DiscordCTA";
import { isSupabaseConfigured } from "@/lib/supabase";

/** Storefront landing page — the full marketing/browse experience. */
export function Home() {
  return (
    <div>
      {/* (a) Hero */}
      <HeroSection />

      {/* (b) Trust bar */}
      <PageContainer className="-mt-8 pb-2">
        <TrustBar className="relative z-10" />
      </PageContainer>

      {/* (c) Animated stat counters */}
      <PageContainer className="py-10">
        <HomeStats />
      </PageContainer>

      {isSupabaseConfigured ? (
        <>
          {/* (d) Featured games */}
          <FeaturedGames />

          {/* (e) Trending / best-selling items */}
          <TrendingItems />

          {/* (f) Recently delivered proofs ticker */}
          <ProofTicker />

          {/* (g) Reviews preview */}
          <ReviewsPreview />
        </>
      ) : (
        <PageContainer className="py-10">
          <SetupNotice />
        </PageContainer>
      )}

      {/* (h) Discord community band */}
      <DiscordCTA />
    </div>
  );
}
