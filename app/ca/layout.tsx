import { Navbar } from '@/components/Navbar';

export default function CALayout({ children }: { children: React.ReactNode }) {
  return (<><Navbar /><main>{children}</main></>);
}
