import SignupPageClient from './SignupPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | SchemeAtlas Government Benefit Alerts',
  description: 'Create a free account on SchemeAtlas to save schemes, get personalized eligibility alerts, and track new government benefits in your region for 2026.',
};

export default function SignupPage() {
  return <SignupPageClient />;
}
