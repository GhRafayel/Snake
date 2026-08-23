import { useState }   from "react";
import { useRouter }  from "next/navigation";
import { Lib }        from "@/src/lib/lib";
import { useAuth }    from "@/src/components/Provider/UserProvider";

type PropsType = { state: { userId: number; Password: string; } };

export default function ResetCodePage( {state} :  PropsType) {
  const [code, setCode] = useState("");
  const [request, setRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const	router = useRouter();
  const { cntUser } = useAuth();

  return (
    <div className={`${cntUser?.theme ?? true ? "bg" : "bg-gray-200"} w-full h-screen flex items-center justify-center px-4`}>
        <div className="w-full max-w-md mx-auto p-6 glass rounded-2xl">

          <h1 className="text-2xl sm:text-3xl font-bold text-center"> Check your email </h1>

          <form className="mt-8 space-y-5" onSubmit={async(e) => {
              e.preventDefault();
              setLoading(true);
              const res = await Lib.postRequest("/api/edit?path=/auth/resetCode", {...state, code})
              if (res.ok) {
                router.push("/server/login");
              } else {
                setLoading(false);
                setRequest("Couldn't change password");
              }
          }} >
            <div>
              <label htmlFor="resetCode" className="block text-sm font-medium mb-2"> Reset Code </label>

              <input  id="resetCode" type="text" autoFocus value={code} placeholder="Enter 6-digit code" maxLength={6} className="restCodeInput"
                      onChange={(e) => setCode(e.target.value)} />
            </div>

            <button type="submit" disabled={loading || code.length < 6} className=" formBtnSubmit " >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-red-900">{request} </p>
          </div>

        </div>
    </div>
  );
}