
import { useAuth } from "@/src/components/Provider/UserProvider";
import { OnlineUsersType } from "@/src/types/UserTypes/UserTypes";

type PropsType = {
  obj?: OnlineUsersType;
};

export default function OnlineUser({ obj }: PropsType) {
  const { cntUser, LENUAGE } = useAuth();
  const History = LENUAGE.History;
  if (!obj) return null;
  const isYou = cntUser?.id === obj.id;

  return (
    <div
      className={`
        group relative flex flex-col gap-1 rounded-xl border px-3 py-2.5
        transition-all duration-200 cursor-default border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20
        ${ cntUser?.theme
            ? "border-white/10 bg-white/3 hover:bg-white/8 hover:border-white/20"
            : "border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300"
        }
      `}
    >
      <div className="flex items-center gap-2.5">
        <div className="relative shrink-0">
          <span className="block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <span className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-emerald-500 opacity-40 animate-ping" />
        </div>

        <p className={`text-sm font-semibold truncate ${
          isYou
            ? cntUser?.theme ?? true ? "text-indigo-300" : "text-indigo-600"
            : cntUser?.theme ?? true ? "text-gray-200" : "text-gray-800"
        }`}>
          {isYou ? History.you : obj.Username}
        </p>

        {isYou &&
        ( <span className={`ml-auto rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cntUser?.theme ?? true ? "text-indigo-300" : "text-indigo-700"} ring-1 ring-indigo-500/30`}>
            {History.you}
          </span>
        )}
      </div>

        <p className={`text-[11px] pl-5 transition-colors ${cntUser?.theme ?? true ? "text-gray-500 group-hover:text-gray-400" : "text-gray-500 group-hover:text-gray-600"}`}>
            <span className={cntUser?.theme ?? true ? "text-emerald-400/80" : "text-emerald-600"}> {History.won} {obj.history?.gamesWon ?? 0}</span>
            <span className={`mx-1 ${cntUser?.theme ?? true ? "text-gray-600" : "text-gray-400"}`}>.</span>
            <span className={cntUser?.theme ?? true ? "text-rose-400/80" : "text-rose-600"}>{History.los} {obj.history?.gamesLost ?? 0}</span>
            <span className={`mx-1 ${cntUser?.theme ?? true ? "text-gray-600" : "text-gray-400"}`}>.</span>
            <span className={cntUser?.theme ?? true ? "text-gray-400" : "text-gray-600"}> {History.pts} {obj.history?.totalScore ?? 0} </span>
        </p>
    </div>
  );
}