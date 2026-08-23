"use client"

import Room from "./Room"
import { useAuth } from "@/src/components/Provider/UserProvider";

export default  function  Hero() {

    const { cntUser, LENUAGE } = useAuth();
    const HomePage = LENUAGE.HomePage;

    return (
        <div className={`  py-20 px-8 pb-30 text-center relative ${cntUser?.theme ?? true ? "bg" : "bg-gray-200 "} `}>

            <div className="match-card-descition"> 
                <span className="block text-neon-green text-sm sm:text-base md:text-xl lg:text-2xl ">
                    <span className={`${cntUser?.theme ?? true ? "text-gray-300" : "text-gray-700"}  text-sm sm:text-base md:text-xl lg:text-2xl`}> {HomePage.title} </span>
                </span>
            </div>
            <h1 className={`font-bungee text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl ${cntUser?.theme ?? true ? "text-text-bright" : "text-black"}`}> {HomePage.motoFirst}
                <span className={` ${cntUser?.theme ?? true ? "text-neon-green" : "text-green-600" } block drop-shadow-[0_0_40px_var(--neon-green-glow)] `}> {HomePage.motoSecond} </span>
            </h1>

            <p className={`text-base sm:text-xl md:text-2xl lg:text-3xl  max-w-150 mx-auto mb-12 mt-5 ${cntUser?.theme ?? true ? "text-text-base" : "text-gray-500"}`}>{HomePage.description}</p>

            <Room choice={HomePage.choice}/>
        </div>
    )
}

