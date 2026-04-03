import SavedPageClient from './SavedPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Saved Schemes | SchemeAtlas',
  description: 'View your bookmarked government schemes and welfare benefits for 2026. Keep track of specific programs you are interested in.',
};

export default function SavedPage() {
  return <SavedPageClient />;
}
