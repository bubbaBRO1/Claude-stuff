import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

const products = [
  // Skincare
  { name: 'Gentle Foaming Cleanser', description: 'Daily face wash for all skin types. Removes oil and dirt without stripping skin.', category: 'skincare', priceMin: 8, priceMax: 20, imageEmoji: '🧼', tags: JSON.stringify(['skincare', 'beginner', 'cleanser']), buyUrl: '#' },
  { name: 'Daily Moisturizer SPF 30', description: 'Lightweight hydration + sun protection in one step. A morning essential.', category: 'skincare', priceMin: 15, priceMax: 35, imageEmoji: '☀️', tags: JSON.stringify(['skincare', 'spf', 'beginner']), buyUrl: '#' },
  { name: 'Vitamin C Brightening Serum', description: 'Fades dark spots, evens skin tone, and boosts collagen production.', category: 'skincare', priceMin: 20, priceMax: 60, imageEmoji: '✨', tags: JSON.stringify(['skincare', 'serum', 'brightening']), buyUrl: '#' },
  { name: 'Retinol Night Serum', description: 'Reduces fine lines and boosts cell turnover overnight. Use 2-3x per week.', category: 'skincare', priceMin: 25, priceMax: 70, imageEmoji: '🌙', tags: JSON.stringify(['skincare', 'serum', 'anti-aging']), buyUrl: '#' },
  { name: 'Salicylic Acid Spot Treatment', description: 'Targets and reduces blemishes. Great for oily and acne-prone skin.', category: 'skincare', priceMin: 8, priceMax: 20, imageEmoji: '🎯', tags: JSON.stringify(['skincare', 'oily-skin', 'acne']), buyUrl: '#' },
  { name: 'Eye Cream with Caffeine', description: 'Reduces dark circles and puffiness. Pat gently around the eye area.', category: 'skincare', priceMin: 15, priceMax: 45, imageEmoji: '👁️', tags: JSON.stringify(['skincare', 'eye-care', 'anti-puffiness']), buyUrl: '#' },
  { name: 'Hydrating Lip Balm SPF', description: 'Moisturizes and protects lips from sun damage. Wear daily.', category: 'skincare', priceMin: 4, priceMax: 15, imageEmoji: '💋', tags: JSON.stringify(['skincare', 'lips', 'beginner']), buyUrl: '#' },
  { name: 'Exfoliating Face Scrub', description: 'Removes dead skin cells for a smoother, brighter complexion. Use 2x/week.', category: 'skincare', priceMin: 10, priceMax: 30, imageEmoji: '🌿', tags: JSON.stringify(['skincare', 'exfoliant', 'brightening']), buyUrl: '#' },

  // Haircare
  { name: 'Strengthening Shampoo', description: 'Reduces breakage and adds volume. Sulfate-free formula.', category: 'haircare', priceMin: 12, priceMax: 30, imageEmoji: '🚿', tags: JSON.stringify(['haircare', 'beginner']), buyUrl: '#' },
  { name: 'Deep Conditioning Mask', description: 'Weekly treatment that restores moisture and shine to damaged hair.', category: 'haircare', priceMin: 15, priceMax: 40, imageEmoji: '💆', tags: JSON.stringify(['haircare', 'treatment']), buyUrl: '#' },
  { name: 'Hair Styling Clay', description: 'Medium hold with a natural matte finish. Perfect for textured styles.', category: 'haircare', priceMin: 15, priceMax: 35, imageEmoji: '💈', tags: JSON.stringify(['haircare', 'styling']), buyUrl: '#' },
  { name: 'Premium Hair Pomade', description: 'High shine, strong hold. Classic men\'s grooming product.', category: 'haircare', priceMin: 12, priceMax: 28, imageEmoji: '⭐', tags: JSON.stringify(['haircare', 'styling', 'premium']), buyUrl: '#' },
  { name: 'Argan Oil Hair Serum', description: 'Tames frizz and adds brilliant shine. A few drops is all you need.', category: 'haircare', priceMin: 15, priceMax: 35, imageEmoji: '💎', tags: JSON.stringify(['haircare', 'treatment', 'shine']), buyUrl: '#' },

  // Grooming
  { name: 'Electric Trimmer Pro', description: 'Precision trimmer for beard, sideburns, and body hair. A must-own.', category: 'grooming', priceMin: 30, priceMax: 80, imageEmoji: '✂️', tags: JSON.stringify(['grooming', 'beginner', 'beard']), buyUrl: '#' },
  { name: 'Safety Razor Kit', description: 'Closer, smoother shave than cartridge razors. Cost-effective long-term.', category: 'grooming', priceMin: 25, priceMax: 60, imageEmoji: '🪒', tags: JSON.stringify(['grooming', 'shaving']), buyUrl: '#' },
  { name: 'Beard Oil', description: 'Softens beard hair, moisturizes skin beneath, and reduces itch.', category: 'grooming', priceMin: 12, priceMax: 35, imageEmoji: '🌲', tags: JSON.stringify(['grooming', 'beard']), buyUrl: '#' },
  { name: 'Brow Grooming Kit', description: 'Precision scissors, spoolie, and tweezers for perfectly shaped brows.', category: 'grooming', priceMin: 10, priceMax: 25, imageEmoji: '🪮', tags: JSON.stringify(['grooming', 'brows']), buyUrl: '#' },
  { name: 'Teeth Whitening Strips', description: '7-day treatment that visibly whitens teeth and brightens your smile.', category: 'grooming', priceMin: 20, priceMax: 50, imageEmoji: '🦷', tags: JSON.stringify(['grooming', 'teeth']), buyUrl: '#' },
  { name: 'Premium Cologne', description: 'Signature scent that leaves a memorable first impression. Fresh, clean.', category: 'grooming', priceMin: 50, priceMax: 120, imageEmoji: '🌸', tags: JSON.stringify(['grooming', 'premium', 'fragrance']), buyUrl: '#' },
  { name: 'Gua Sha Facial Tool', description: 'Improves circulation, reduces puffiness, and sculpts facial contours.', category: 'grooming', priceMin: 10, priceMax: 30, imageEmoji: '💚', tags: JSON.stringify(['grooming', 'facial-tools']), buyUrl: '#' },

  // Fitness
  { name: 'Resistance Bands Set', description: 'Full body workout anywhere, anytime. Great for beginners and advanced.', category: 'fitness', priceMin: 15, priceMax: 40, imageEmoji: '💪', tags: JSON.stringify(['fitness', 'beginner', 'home-gym']), buyUrl: '#' },
  { name: 'Jump Rope (Speed)', description: 'Burns fat fast and improves conditioning. Elite athletes use this daily.', category: 'fitness', priceMin: 15, priceMax: 35, imageEmoji: '🪢', tags: JSON.stringify(['fitness', 'cardio', 'beginner']), buyUrl: '#' },
  { name: 'Protein Powder', description: 'High-quality whey protein for muscle recovery and growth.', category: 'fitness', priceMin: 30, priceMax: 70, imageEmoji: '🥤', tags: JSON.stringify(['fitness', 'nutrition', 'muscle']), buyUrl: '#' },
  { name: 'Adjustable Dumbbells', description: 'Replace an entire rack of weights. Perfect for home gyms.', category: 'fitness', priceMin: 100, priceMax: 300, imageEmoji: '🏋️', tags: JSON.stringify(['fitness', 'home-gym', 'premium']), buyUrl: '#' },

  // Style / Fashion
  { name: 'White T-Shirt (3-pack)', description: 'The foundation of every great wardrobe. High-quality cotton, perfect fit.', category: 'fashion', priceMin: 25, priceMax: 60, imageEmoji: '👕', tags: JSON.stringify(['fashion', 'basics', 'beginner']), buyUrl: '#' },
  { name: 'Dark Wash Slim Jeans', description: 'Versatile, timeless, and flattering. Dress up or down.', category: 'fashion', priceMin: 40, priceMax: 100, imageEmoji: '👖', tags: JSON.stringify(['fashion', 'basics']), buyUrl: '#' },
  { name: 'Minimalist Watch', description: 'Clean, classic timepiece that elevates any outfit instantly.', category: 'fashion', priceMin: 50, priceMax: 200, imageEmoji: '⌚', tags: JSON.stringify(['fashion', 'accessories', 'premium']), buyUrl: '#' },
  { name: 'White Sneakers', description: 'A clean pair of white sneakers works with almost every outfit.', category: 'fashion', priceMin: 60, priceMax: 150, imageEmoji: '👟', tags: JSON.stringify(['fashion', 'footwear']), buyUrl: '#' },
];

async function main() {
  console.log('Seeding products...');
  await prisma.product.deleteMany();
  await prisma.product.createMany({ data: products });
  console.log(`Seeded ${products.length} products.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
