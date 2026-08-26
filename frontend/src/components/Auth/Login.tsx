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
				</div>

			</form>

			<div className="flex items-center gap-3 px-6 my-2">
				<div className="flex-1 h-px bg-gray-700/40" />
				<span className="text-xl">or continue with</span>
				<div className="flex-1 h-px bg-gray-700/40" />
			</div>

			<div className="flex flex-col gap-3 px-6 mb-4">
				<a href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`} className="formBtnGoogle">
					<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
						<path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
						<path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
						<path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
						<path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
					</svg>
					Continue with Google
				</a>
				<a href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/github`} className="formBtnGithub">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.207 11.387.6.113.793-.26.793-.577v-2.017c-3.338.726-4.033-1.611-4.033-1.611-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.303-5.467-1.333-5.467-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.51 11.51 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
					</svg>
					Continue with GitHub
				</a>
			</div>

			<div className="text-center">
				<button type="button" className="bg-transparent hover:border-b hover:border-blue-400 transform-y cursor-grab"
					onClick={() =>  router.push('/server/reset') } >
					Forgot your password
				</button>
			</div>
		</div>
	</div>
)}