import { Geist_Mono} from "next/font/google";
import UserProvider  from "@/src/components/Provider/UserProvider";
import SocketProvider from "@/src/components/Provider/SocketProvider";
import Nav from "@/src/components/Nav/Nav"
import Contact from "@/src/components/Contact/Contact";
import Footer from "@/src/components/Footer/Footer";
import RoomInviteToast from "@/src/components/Friends/RoomInviteToast";
import LegalModal from "@/src/components/Legal/LegalModal";
import Music from "../components/Music/Music";
import "./globals.css";
import { cookies } from "next/headers";
import { Lib } from "../lib/lib";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout( { children } : Readonly< { children: React.ReactNode }> ) {

  const accessToken = (await cookies()).get("accessToken")?.value
  const user = await Lib.getUser(accessToken);
  const language  = await Lib.getLanguage(user ? user.language : null);
  const theme  = user ? user.theme : true;
 
  
  return (
    <html lang="en" style={{ colorScheme: theme ?  "dark" : "light" }} className={`no-scrollbar ${geistMono.variable} h-full antialiased`} suppressHydrationWarning >
      <body className={`no-scrollbar min-h-full flex flex-col min-w-100 ${theme ?? true ?  "bg-black text-white" : "bg-gray-200 text-gray-700"}`}>
          <UserProvider initialUser={user} initialTranslations={language}>
            <LegalModal />
            <Nav />
            <SocketProvider>
              {children}
            </SocketProvider>
            <RoomInviteToast />
            <Contact />
            <Music musicName="snake_music_on"/>
            <Footer />
          </UserProvider>
      </body>
    </html>
  );
}
