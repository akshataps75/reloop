import { BookOpen, Smartphone, Laptop, Home, Bike, Shirt, Dumbbell, Plug, Music, MoreHorizontal, type LucideIcon } from 'lucide-react'

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Books & Stationery': BookOpen,
  'Mobile & Accessories': Smartphone,
  'Electronics & Gadgets': Laptop,
  'Furniture & Home': Home,
  'Vehicles': Bike,
  'Fashion & Accessories': Shirt,
  'Sports & Fitness': Dumbbell,
  'Appliances': Plug,
  'Musical Instruments': Music,
  'Other': MoreHorizontal,
}

export const CATEGORY_NAMES = Object.keys(CATEGORY_ICONS)

// Category → price threshold at which a listing becomes Cluster B (requires
// ownership document + condition notes). Must stay in sync with
// CLUSTER_THRESHOLDS in backend/routes/listings.js — the backend is the
// source of truth; this copy only drives the frontend's live "you're about
// to cross into Cluster B" hint before submission. Backend re-validates
// independently via assignCluster() on POST /listings.
export const CLUSTER_THRESHOLDS: Record<string, number> = {
  'Books & Stationery': 1500,
  'Mobile & Accessories': 10000,
  'Electronics & Gadgets': 8000,
  'Furniture & Home': 5000,
  'Vehicles': 6000,
  'Fashion & Accessories': 2500,
  'Sports & Fitness': 4000,
  Appliances: 6000,
  'Musical Instruments': 5000,
}