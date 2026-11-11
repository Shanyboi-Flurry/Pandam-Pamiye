import { BookOpen, Calculator, Pencil, Dumbbell, Palette, Mic2, Sprout, Handshake, Gift, Clock, Repeat, Leaf, Users } from 'lucide-react'

export const CATEGORIES = [
  { id: 'books', label: 'Books & Reviewers', short: 'Books', icon: BookOpen, tint: 'bg-sky-100 text-sky-800', hex: '#3b82c4', weight: 0.5 },
  { id: 'gadgets', label: 'Calculators & Gadgets', short: 'Gadgets', icon: Calculator, tint: 'bg-violet-100 text-violet-800', hex: '#7c6bc4', weight: 0.4 },
  { id: 'supplies', label: 'School Supplies', short: 'Supplies', icon: Pencil, tint: 'bg-amber-100 text-amber-800', hex: '#d49a1c', weight: 0.2 },
  { id: 'sports', label: 'Sports Equipment', short: 'Sports', icon: Dumbbell, tint: 'bg-orange-100 text-orange-800', hex: '#e07a3a', weight: 1.0 },
  { id: 'art', label: 'Art Materials', short: 'Art', icon: Palette, tint: 'bg-pink-100 text-pink-800', hex: '#d1578a', weight: 0.4 },
  { id: 'event', label: 'Event Equipment', short: 'Events', icon: Mic2, tint: 'bg-teal-100 text-teal-800', hex: '#2f9a8c', weight: 4.0 },
]
export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

export const CONDITIONS = ['New', 'Like new', 'Good', 'Fair']

export const TYPES = {
  lend: { label: 'Lend', tag: 'Borrow', icon: Clock, cls: 'bg-sky-100 text-sky-800', desc: 'Lend it for a set period and get it back.' },
  donate: { label: 'Donate', tag: 'Free', icon: Gift, cls: 'bg-emerald-100 text-emerald-800', desc: 'Give it away to someone who needs it.' },
  exchange: { label: 'Exchange', tag: 'Swap', icon: Repeat, cls: 'bg-violet-100 text-violet-800', desc: 'Trade it for something you need.' },
}

export const ROLES = {
  student: { label: 'Student', blurb: 'Browse, borrow, lend, donate, and exchange.' },
  teacher: { label: 'Teacher', blurb: 'Share educational resources and equipment.' },
  staff: { label: 'Staff', blurb: 'Share and manage school resources.' },
  admin: { label: 'Administrator', blurb: 'Reviews and approves new resource listings.' },
}

export const POINTS = {
  list: 5,
  lend: 15,
  donate: 25,
  return_on_time: 10,
  return_late: 2,
  receive: 3,
  exchange: 20,
}

export const POINT_RULES = [
  { type: 'list', label: 'Publish a listing', points: POINTS.list },
  { type: 'lend', label: 'Complete a loan (item returned)', points: POINTS.lend },
  { type: 'donate', label: 'Complete a donation', points: POINTS.donate },
  { type: 'exchange', label: 'Complete an exchange', points: POINTS.exchange },
  { type: 'return_on_time', label: 'Return a borrowed item on time', points: POINTS.return_on_time },
  { type: 'receive', label: 'Receive a donated item', points: POINTS.receive },
  { type: 'return_late', label: 'Return a borrowed item late', points: POINTS.return_late },
]

export const LEVELS = [
  { name: 'Seed', min: 0 },
  { name: 'Sprout', min: 50 },
  { name: 'Sapling', min: 150 },
  { name: 'Tree', min: 300 },
  { name: 'Forest', min: 600 },
]

export const BADGES = [
  { id: 'first_seed', name: 'First Seed', desc: 'Publish your first listing.', icon: Sprout, goal: 1, value: (s) => s.listings },
  { id: 'trusted_lender', name: 'Trusted Lender', desc: 'Complete 3 loans.', icon: Handshake, goal: 3, value: (s) => s.lends },
  { id: 'generous', name: 'Generous Giver', desc: 'Complete 2 donations.', icon: Gift, goal: 2, value: (s) => s.donations },
  { id: 'on_time', name: 'On-Time Returner', desc: 'Return 3 items on time.', icon: Clock, goal: 3, value: (s) => s.onTime },
  { id: 'swap_star', name: 'Swap Star', desc: 'Complete 2 exchanges.', icon: Repeat, goal: 2, value: (s) => s.swaps },
  { id: 'helper', name: 'Community Helper', desc: 'Help 10 people through loans, gifts, or swaps.', icon: Users, goal: 10, value: (s) => s.lends + s.donations + s.swaps },
  { id: 'champion', name: 'Eco Champion', desc: 'Reach 300 EcoPoints.', icon: Leaf, goal: 300, value: (s) => s.points },
]

// Rough demo model: kilograms of CO2e avoided per kilogram of goods kept in use.
export const CO2_PER_KG = 2.0
