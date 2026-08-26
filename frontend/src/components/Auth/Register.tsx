"use client"

import { useRouter } from "next/navigation";
import { useState } from "react"
import { Lib } from "@/src/lib/lib";
import { useAuth } from "@/src/components/Provider/UserProvider";
import FormInputs from "./FormInputs";

export default function Register() {

	const router = useRouter();
	const registrData = Lib.data;
    const [password, setPassword] = useState("");
	const {ChangingCallback, cntUser} = useAuth();

return (

	<div  className={`${cntUser?.theme ?? true ?  "bg text-gray-900" : "bg-gray-200"} w-full h-screen flex items-center justify-center px-4`} >

		<div className="w-full max-w-md mx-auto p-6 glass rounded-2xl">

			<div className="w-full text-center my-3">
				<h2 className="text-4xl font-bold"> Sign Up
				</h2>
			</div>
			<form onSubmit={ async (e) => { 
					e.preventDefault();
					const form = Object.fromEntries(new FormData(e.currentTarget));
					if (form.Password != form.ConfirmPassword)
                        return setPassword("Wrong password try again");
					const data = {...form};
					delete data.ConfirmPassword;
					await Lib.postRequest("/api/auth?path=/auth/register", {...data})
					.then(res => res.ok ? (ChangingCallback(undefined, "me") , router.push("/")) : console.log(res));
				 }}
			>
				{registrData.map((item, i) => (<FormInputs key={i} item={item} />))}
				
				<div className="m-5 text-center">
                    { password.length > 1 && (
                            <div className="text-red-700 m-2">
                                {password}
                            </div>
                        )
                    }
					<div>
						<button className="formBtnSubmit" type="submit" >
							Sign Up
						</button>
					</div>
				</div>

			</form>
		</div>
	</div>
)}
