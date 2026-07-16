// Thin data-access layer.
//
// Today every function here just reads from the local seed data in
// `src/data/*`. When this project eventually gets a real backend (e.g.
// Supabase), swap the BODIES of these functions for real queries/fetches —
// the function signatures (and therefore every component that calls them)
// should never need to change. Prefer keeping these functions async-shaped
// friendly to call from components that may later `await` them, but for now
// they resolve synchronously since everything is local.
import { GAMES } from "@/data/games";
import { ITEMS } from "@/data/items";
import { REVIEWS } from "@/data/reviews";
import { PROOFS } from "@/data/proofs";
import type { Game, Item, Review, Proof } from "@/types";

export function getGames(): Game[] {
  return GAMES;
}

export function getGameBySlug(slug: string): Game | undefined {
  return GAMES.find((game) => game.id === slug);
}

export function getFeaturedGames(): Game[] {
  return GAMES.filter((game) => game.isFeatured);
}

export function getItems(): Item[] {
  return ITEMS;
}

export function getItemsByGame(slug: string): Item[] {
  return ITEMS.filter((item) => item.gameId === slug);
}

export function getItemById(id: string): Item | undefined {
  return ITEMS.find((item) => item.id === id);
}

export function getFeaturedItems(): Item[] {
  return ITEMS.filter((item) => item.isFeatured);
}

export function getReviews(): Review[] {
  return REVIEWS;
}

export function getProofs(): Proof[] {
  return PROOFS;
}
