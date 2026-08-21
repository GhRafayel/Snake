import { Geist, Geist_Mono} from "next/font/google";
import UserProvider  from "@/src/components/Provider/UserProvider";
import SocketProvider from "@/src/components/Provider/SocketProvider";
import Nav from "@/src/components/Nav/Nav"
import Contact from "@/src/components/Contact/Contact";
import RoomInviteToast from "@/src/components/Friends/RoomInviteToast";
import Music from "../components/Music/Music";
import "./globals.css";
import { cookies } from "next/headers";
import { UserType } from "../types/UserTypes/UserTypes";

const geistSans = Geist({
  variable: "--font-geist-sans", 
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout( { children } : Readonly< { children: React.ReactNode }> ) {

  const accessToken = (await cookies()).get("accessToken")?.value
  let user : UserType | null = null;
  if (accessToken)
  {
    try{
        user = await fetch(`${process.env.INTERNAL_API_URL}/users/me`,  {
              method: "GET",
              headers: { "Authorization": `Bearer ${accessToken}`, },
        }).then(r => r.json())
    }
    catch{new Error("not found ")}
  }
  return (
    <html lang="en" style={{ colorScheme: user?.theme ?? true ?  "dark" : "light" }} className={`no-scrollbar ${geistSans.variable} ${geistMono.variable} h-full antialiased`} >
      <body className={`no-scrollbar min-h-full flex flex-col min-w-100 ${user?.theme ?? true ?  "bg-black text-white" : "bg-gray-200 text-gray-700"}`}>
          <UserProvider initialUser={user}>
            <Nav />
            <SocketProvider>
              {children}
            </SocketProvider>
            <RoomInviteToast />
            <Contact />
            <Music musicName="snake_music_on"/>
          </UserProvider>
      </body>
    </html>
  );
}
