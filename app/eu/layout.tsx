import { Navbar } from '@/components/Navbar';

export default function EULayout({ children }: { children: React.ReactNode }) {
  return (<><Navbar /><main>{children}</main></>);
}
