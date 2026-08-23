"use client"
import { useRouter } from "next/navigation";
import { useState} from "react"
import { Lib } from "@/src/lib/lib"
import { useAuth } from "@/src/components/Provider/UserProvider";
import FormInputs from "./FormInputs";
export default function Login() {

	const	{ChangingCallback, cntUser} = useAuth();
	const	router = useRouter();
	const 	loginData = Lib.data.slice(1, 3)
	const	[login, setLogin] = useState("");

return (

	<div  className={`${cntUser?.theme ?? true ?  "bg text-gray-900" : "bg-gray-200"} w-full h-screen flex items-center justify-center px-4`} >

		<div className="w-full max-w-md mx-auto p-6 glass rounded-2xl">

			<div className="w-full text-center my-3">
				<h2 className="text-4xl font-bold"> Login </h2>
			</div>
			
			<form onSubmit={ async (e) => { 
				e.preventDefault();
				const form = Object.fromEntries(new FormData(e.currentTarget));
			 	await Lib.postRequest("/api/auth?path=/auth/login", {...form} )
				.then( async (res) => res.ok ? (ChangingCallback(undefined, "me"), router.push("/")) : (console.log(res), setLogin("Wrong Email or Password")))
			}}
            >
				{loginData.map((item, i) => ( <FormInputs key={i} item={item}/>) )}
				
				<div className="m-5 text-center">
					<div >
						{login.length > 0 && (
							<div className="text-red-800 mt-2 mb-2">
								{login}
							</div>
						)

						}
						<button className="formBtnSubmit" type="submit" > 
                            Login
						</button>
					</div>
					<div className="p-4 text-lg font-bold flex justify-between">
						<p>
							Don&apos;t have an account ? /
							<button  className="formBtnLog" type="button"  onClick={() => router.push("/server/register") } >
								Sign Up
							</button>
						</p>
					</div>
				</div>

			</form>
			<div className="text-center">
				<button type="button" className="bg-transparent hover:border-b hover:border-blue-400 transform-y cursor-pointer"
					onClick={() =>  router.push('/server/reset') } >
					Forgot your password 
				</button>
			</div>
		</div>
	</div>
)}