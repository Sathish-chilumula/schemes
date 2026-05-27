import { Navbar } from '@/components/Navbar';


export default function GBLayout({ children }: { children: React.ReactNode }) {
  return (<><Navbar /><main>{children}</main></>);
}
