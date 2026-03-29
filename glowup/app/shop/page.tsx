'use client';
import { useEffect, useState } from 'react';
import PageHeader from '../components/layout/PageHeader';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  priceMin: number;
  priceMax: number;
  imageEmoji: string;
  tags: string;
  buyUrl: string;
}

const CATEGORIES = ['all', 'skincare', 'haircare', 'grooming', 'fitness', 'fashion'];
const BUDGETS = [
  { key: 'all', label: 'Any' },
  { key: 'under-25', label: 'Under $25' },
  { key: '25-50', label: '$25–$50' },
  { key: '50-100', label: '$50–$100' },
  { key: '100+', label: '$100+' },
];

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState('all');
  const [budget, setBudget] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (budget !== 'all') params.set('budget', budget);
    fetch(`/api/products?${params}`).then(r => r.json()).then(data => {
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, [category, budget]);

  return (
    <div className="space-y-5">
      <PageHeader title="Product Shop" subtitle="AI-recommended products for your goals" />

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className="text-xs px-3 py-1.5 rounded-full flex-shrink-0 capitalize transition-all"
            style={{
              background: category === c ? 'var(--accent)' : 'var(--bg-card)',
              color: category === c ? 'white' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: category === c ? 'var(--accent)' : 'var(--border)',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Budget filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {BUDGETS.map(b => (
          <button
            key={b.key}
            onClick={() => setBudget(b.key)}
            className="text-xs px-3 py-1.5 rounded-full flex-shrink-0 transition-all"
            style={{
              background: budget === b.key ? 'rgba(245,158,11,0.15)' : 'var(--bg-card)',
              color: budget === b.key ? '#f59e0b' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: budget === b.key ? '#f59e0b' : 'var(--border)',
            }}
          >
            {b.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-48 animate-pulse" style={{ background: 'var(--bg-card)' }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <p style={{ color: 'var(--text-secondary)' }}>No products found for this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map(p => {
            const tags = JSON.parse(p.tags) as string[];
            const isRecommended = tags.some(t => ['beginner', 'skincare', 'grooming'].includes(t));
            return (
              <a
                key={p.id}
                href={p.buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-4 space-y-2 block transition-all"
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{p.imageEmoji}</span>
                  {isRecommended && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--accent)' }}
                    >
                      ✨ Top Pick
                    </span>
                  )}
                </div>
                <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold gradient-text-gold">
                    ${p.priceMin}–${p.priceMax}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{ background: 'var(--bg-card-hover)', color: 'var(--text-muted)' }}
                  >
                    {p.category}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
