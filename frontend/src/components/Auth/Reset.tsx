"use client"

import { useState }		from "react"
import { Lib }			from "@/src/lib/lib"
import { useAuth }		from "@/src/components/Provider/UserProvider";
import FormInputs		from "./FormInputs";
import ResetCodePage	from "./ResetCodePage";

export default function Reset() {

	const	resetData = Lib.data.slice(1, 4);
	const	[text, setText] = useState("");
	const	[code, setCode] = useState(true);
	const	[state, setState] = useState({userId: 0, Password: ""});
	const	{ cntUser } = useAuth();

	return ( code ?
		(
			<div  className={`${cntUser?.theme ?? true ?  "bg text-gray-900" : "bg-gray-200"} w-full h-screen flex items-center justify-center px-4`} >

				<div className="w-full max-w-md mx-auto p-6 glass rounded-2xl">
					<div className="w-full text-center my-3">
						<h2 className="text-4xl font-bold"> Reset password</h2>
					</div>

					<form onSubmit={ async (e) => { 
						e.preventDefault();
						const form = Object.fromEntries(new FormData(e.currentTarget));
						if (form.Password != form.ConfirmPassword)
							return alert("Passwords do not match");
						const data = {...form};
						delete data.ConfirmPassword;
						const res = await Lib.postRequest("/api/edit?path=/auth/reset", {...data}).then(strim => strim.json());
						
						if (!res.userId) return  setText("something was wrong");
						setState({userId: res.userId, Password : String(form.Password)});
						setCode(false);
					}}>
						{resetData.map((item, i) => (<FormInputs key={i} item={item} />))}
						<div className="m-5 text-center">
							<div>
								{text.length > 1 && (
									<div className="text-red-900 mt-2 mb-2">
										{text}
									</div>
								)}
								<button className="formBtnSubmit" type="submit"> 
									Reset password
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		) : 
		( <ResetCodePage state={state} />)
	)
}
