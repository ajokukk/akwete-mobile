import type { ImageSourcePropType } from 'react-native';
import { supabase } from './supabase';
import { CONFIGURED } from '../config';

export type Product = { slug: string; name: string; kind: string; price: number; sizes: string[] };

// Same catalogue, names and sizes as the website. Prices are read from the database when possible.
export const FALLBACK: Product[] = [
  { slug: 'moss-cloth', name: 'The Moss Stripe Wrapper', kind: 'Wrapper', price: 85000, sizes: ['One cloth'] },
  { slug: 'cream-cloth', name: 'The Cream Diamond Wrapper', kind: 'Wrapper', price: 95000, sizes: ['One cloth'] },
  { slug: 'ember-cloth', name: 'The Ember Wrapper', kind: 'Wrapper', price: 110000, sizes: ['One cloth'] },
  { slug: 'plum-cloth', name: 'The Plum Border Wrapper', kind: 'Wrapper', price: 90000, sizes: ['One cloth'] },
  { slug: 'wrap', name: 'The Pattern Wrap', kind: 'Textile wrap', price: 68000, sizes: ['1.8 \u00D7 1.2 m', '2.2 \u00D7 1.5 m'] },
  { slug: 'runner', name: 'The Woven Runner', kind: 'Table textile', price: 45000, sizes: ['1.5 \u00D7 0.4 m', '2 \u00D7 0.4 m'] },
  { slug: 'cushion', name: 'The Studio Cushion', kind: 'Cushion cover', price: 32000, sizes: ['40 \u00D7 40 cm', '50 \u00D7 50 cm'] },
];

export const IMAGES: Record<string, ImageSourcePropType> = {
  'moss-cloth': require('../../assets/products/moss-cloth.jpg'),
  'cream-cloth': require('../../assets/products/cream-cloth.jpg'),
  'ember-cloth': require('../../assets/products/ember-cloth.jpg'),
  'plum-cloth': require('../../assets/products/plum-cloth.jpg'),
  wrap: require('../../assets/products/wrap.jpg'),
  runner: require('../../assets/products/runner.jpg'),
  cushion: require('../../assets/products/cushion.jpg'),
};

export async function loadProducts(): Promise<Product[]> {
  if (!CONFIGURED) return FALLBACK;
  const { data, error } = await supabase.from('products').select('slug, name, kind, price_ngn').eq('active', true);
  if (error || !data?.length) return FALLBACK;
  const bySlug = new Map(data.map((r: any) => [r.slug as string, r]));
  return FALLBACK.filter((p) => bySlug.has(p.slug)).map((p) => {
    const r: any = bySlug.get(p.slug);
    return { ...p, name: r.name ?? p.name, kind: r.kind ?? p.kind, price: Number(r.price_ngn) || p.price };
  });
}
