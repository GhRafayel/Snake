"use client";

import { useAuth } from "@/src/components/Provider/UserProvider";
import Cards from "./Cards";

export default function Room({choice} : {choice: string} ) {
    const {cntUser, LENUAGE} = useAuth();
    const data = LENUAGE.HomePage.cards;
    return (
       <div className="py-10 px-8 pb-15 text-center flex flex-col items-center ">

            <div className="match-card-descition "> 
                <span className="block text-neon-green text-sm sm:text-base md:text-xl lg:text-2xl ">
                    <span  className={`${cntUser?.theme ?? true ? "text-gray-300" : "text-gray-700"}  text-sm sm:text-base md:text-xl lg:text-2xl`}>{ choice} </span>
                </span>
            </div>

            <div className="max-w-6xl  w-full">
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {data.map((card) => {
                        return ( <Cards key={card.mode} card={card} /> );
                    })}
                </ul>
            </div>
        </div>
    );
}