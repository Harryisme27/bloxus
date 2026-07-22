import { PageContainer } from "@/components/PageContainer";
import { Reveal } from "@/components/Reveal";
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
      {/* (a) Hero — có animation vào trang riêng bên trong */}
      <HeroSection />

      {/* (b) Trust bar */}
      <PageContainer className="-mt-8 pb-2">
        <Reveal>
          <TrustBar className="relative z-10" />
        </Reveal>
      </PageContainer>

      {/* (c) Animated stat counters */}
      <PageContainer className="py-10">
        <Reveal>
          <HomeStats />
        </Reveal>
      </PageContainer>

      {isSupabaseConfigured ? (
        <>
          {/* (d) Featured games */}
          <Reveal>
            <FeaturedGames />
          </Reveal>

          {/* (e) Trending / best-selling items */}
          <Reveal>
            <TrendingItems />
          </Reveal>

          {/* (f) Recently delivered proofs ticker */}
          <Reveal>
            <ProofTicker />
          </Reveal>

          {/* (g) Reviews preview — TẠM ẨN theo yêu cầu; bỏ `false &&` để hiện lại. */}
          {false && (
            <Reveal>
              <ReviewsPreview />
            </Reveal>
          )}
        </>
      ) : (
        <PageContainer className="py-10">
          <SetupNotice />
        </PageContainer>
      )}

      {/* (h) Discord community band */}
      <Reveal>
        <DiscordCTA />
      </Reveal>
    </div>
  );
}
