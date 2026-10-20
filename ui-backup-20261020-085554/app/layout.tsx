import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {title:"GDG Backend Lab",description:"Team-based backend engineering learning lab"};
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="en"><body><header className="header"><strong>GDG ON CAMPUS · MOUNT KENYA UNIVERSITY</strong><h1>Backend Engineering Lab</h1><p>Build real backends. Test failures. Defend your design.</p></header>{children}</body></html>;
}
