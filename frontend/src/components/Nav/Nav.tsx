"use client"

import Link from "next/link";
import Avatar from "@/src/components/Nav/Avatar"
import { useAuth } from "@/src/components/Provider/UserProvider"
import NavSearch from "./NavSearch";

export default function Navbar() {

  const { cntUser, LENUAGE } = useAuth()
  const NavHeader = LENUAGE.Header;

  return (
    <nav className={`nav ${cntUser?.theme ?? true ? "bg-black" : "bg-gray-100 "}`}>
      <div className="nav-logo">
        {cntUser?.role === "ADMIN" ? 
          ( <Link className="btn nav-btn " href="/server/admin">Admin</Link> ) : 
          ( <Link href="/" className="nav-logoMark" >  </Link>) 
        }
  
        <Link href="/" className={cntUser?.theme ?? true ? "text-white" : "text-black"}>Snake</Link>

      </div>
      
      {cntUser && <NavSearch /> }
  
      <div className="navLink">

        {cntUser?.id ? <Avatar /> :
          <div>
            <Link className="btn  nav-btn" href="/server/login"> {NavHeader.si}</Link>
            <Link className="btn  nav-btn" href="/server/register"> {NavHeader.su}</Link>
          </div>
        }
      </div>
    </nav>
  );
}