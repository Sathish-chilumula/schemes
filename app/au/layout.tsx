import { Navbar } from '@/components/Navbar';

export default function AULayout({ children }: { children: React.ReactNode }) {
  return (<><Navbar /><main>{children}</main></>);
}
