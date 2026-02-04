"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Info, ZoomIn } from "lucide-react";

type ClassType = "P" | "NP" | "NP_Complete" | "NP_Hard" | "L" | "PSPACE" | "EXP";

const DEFINITIONS: Record<string, { title: string; desc: string; color: string; border: string; bg: string }> = {
  P: {
    title: "P (Polynomial Time)",
    desc: "決定性チューリング機械により多項式時間 O(n^k) で解ける問題の集合。現実に「効率的に解ける」とされる問題のクラス。",
    color: "text-emerald-700",
    border: "border-emerald-400",
    bg: "bg-emerald-100/80"
  },
  NP: {
    title: "NP (Nondeterministic Polynomial Time)",
    desc: "非決定性チューリング機械により多項式時間で解ける問題の集合。YESの証拠（証人）があれば、それを多項式時間で検証できる問題。",
    color: "text-blue-700",
    border: "border-blue-400",
    bg: "bg-blue-100/50"
  },
  NP_Complete: {
    title: "NP-Complete (NP完全)",
    desc: "NPの中で「最も難しい」問題群。1) NPに属し、かつ 2) NP困難である問題。これが解ければ全NP問題が解ける。",
    color: "text-purple-700",
    border: "border-purple-400",
    bg: "bg-purple-100/90"
  },
  NP_Hard: {
    title: "NP-Hard (NP困難)",
    desc: "任意のNP問題から多項式時間で帰着可能な問題。NPに属する必要はなく、判定不能問題も含まれる。",
    color: "text-rose-700",
    border: "border-rose-400",
    bg: "bg-rose-100/50"
  },
  L: {
    title: "L (Logarithmic Space)",
    desc: "決定性チューリング機械により対数領域 O(log n) で解ける問題。入力サイズに対してごくわずかなメモリしか使わない。",
    color: "text-cyan-700",
    border: "border-cyan-400",
    bg: "bg-cyan-100/80"
  },
  PSPACE: {
    title: "PSPACE (Polynomial Space)",
    desc: "多項式領域 O(n^k) で解ける問題。時間はいくらかかっても良い（指数時間など）。NPを含む巨大なクラス。",
    color: "text-amber-700",
    border: "border-amber-400",
    bg: "bg-amber-100/80"
  },
  EXP: {
    title: "EXPTIME (Exponential Time)",
    desc: "指数時間 O(2^{n^k}) で解ける問題。PSPACEを包含するさらに大きなクラス。",
    color: "text-slate-700",
    border: "border-slate-400",
    bg: "bg-slate-100/80"
  }
};

export function ComplexityEuler() {
  const [hovered, setHovered] = useState<ClassType | null>(null);

  const InfoCard = ({ type }: { type: string }) => {
    const def = DEFINITIONS[type];
    if (!def) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`absolute bottom-4 left-4 right-4 p-4 rounded-xl border backdrop-blur-md shadow-lg z-20 ${def.bg} ${def.border}`}
      >
        <h4 className={`font-bold flex items-center gap-2 ${def.color}`}>
          <Info className="w-4 h-4" />
          {def.title}
        </h4>
        <p className="text-sm mt-1 text-gray-800 leading-relaxed">{def.desc}</p>
      </motion.div>
    );
  };

  return (
    <div className="relative w-full aspect-square max-w-[500px] mx-auto bg-white rounded-3xl shadow-inner border border-gray-200 overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

        <div className="absolute inset-0 flex items-center justify-center">
            {/* NP-Hard Circle (Large, mostly outside) */}
            <motion.div
                className={`absolute w-[90%] h-[90%] rounded-full border-2 border-dashed border-rose-300 flex items-start justify-center pt-8 cursor-pointer transition-colors ${hovered === "NP_Hard" ? "bg-rose-50 border-rose-500" : "bg-transparent"}`}
                onMouseEnter={() => setHovered("NP_Hard")}
                onMouseLeave={() => setHovered(null)}
                style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }} // Clip nothing actually, just to set context
            >
                <span className="text-rose-400 font-bold tracking-wider mt-4">NP-Hard</span>
            </motion.div>

            {/* NP Circle (Left side intersection) */}
            <motion.div
                className={`absolute left-[10%] w-[60%] h-[60%] rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300
                    ${hovered === "NP" ? "bg-blue-100 border-blue-500 z-10 scale-105" : "bg-blue-50/80 border-blue-300 z-0"}
                `}
                onMouseEnter={() => setHovered("NP")}
                onMouseLeave={() => setHovered(null)}
            >
                 <span className={`absolute top-1/4 left-1/4 font-bold ${hovered === "NP" ? "text-blue-700" : "text-blue-400"}`}>NP</span>
            </motion.div>

            {/* P Circle (Inside NP) */}
            <motion.div
                className={`absolute left-[20%] w-[25%] h-[25%] rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300
                    ${hovered === "P" ? "bg-emerald-100 border-emerald-500 z-20 scale-110" : "bg-emerald-50/90 border-emerald-300 z-10"}
                `}
                onMouseEnter={() => setHovered("P")}
                onMouseLeave={() => setHovered(null)}
            >
                <span className={`font-bold text-sm ${hovered === "P" ? "text-emerald-700" : "text-emerald-500"}`}>P</span>
            </motion.div>

            {/* NP-Complete (Intersection of NP and NP-Hard) */}
            <motion.div
                className={`absolute right-[30%] w-[20%] h-[40%] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300
                    ${hovered === "NP_Complete" ? "bg-purple-200 border-2 border-purple-500 z-20 scale-110" : "bg-purple-100/50 border border-purple-300 border-dashed z-10"}
                `}
                style={{ borderRadius: "50% 30% 30% 50%" }} // Not quite a circle, but close enough for diagram
                onMouseEnter={() => setHovered("NP_Complete")}
                onMouseLeave={() => setHovered(null)}
            >
                 <span className={`font-bold text-xs text-center ${hovered === "NP_Complete" ? "text-purple-800" : "text-purple-500"}`}>NP<br/>Complete</span>
            </motion.div>
        </div>

        {/* Dynamic Legend/Card */}
        {hovered && <InfoCard type={hovered} />}
        {!hovered && (
            <div className="absolute bottom-4 left-0 right-0 text-center text-gray-400 text-sm">
                各領域にマウスを乗せると詳細が表示されます
            </div>
        )}
    </div>
  );
}

export function ComplexityHierarchy() {
    const classes: ClassType[] = ["L", "P", "NP", "PSPACE", "EXP"];
    const [selected, setSelected] = useState<ClassType | null>(null);

    return (
        <div className="flex flex-col gap-2 max-w-[500px] mx-auto">
             {/* Wrapper to reverse visual order for inclusion (Largest outside) - Actually ladder stack is better */}
             {/* Let's do a nested box approach */}

             <div className="relative p-8 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="text-center font-bold text-gray-500 mb-4">包含関係の階層 (Hierarchy)</h3>

                {/* EXP */}
                <motion.div
                    className={`p-4 rounded-xl border-2 transition-colors cursor-pointer ${selected === "EXP" ? "bg-slate-100 border-slate-500" : "bg-white border-slate-200"}`}
                    onClick={() => setSelected(selected === "EXP" ? null : "EXP")}
                >
                    <div className="text-right text-xs font-bold text-slate-400 mb-1">EXPTIME</div>

                    {/* PSPACE */}
                    <motion.div
                        className={`p-4 rounded-xl border-2 transition-colors cursor-pointer ${selected === "PSPACE" ? "bg-amber-100 border-amber-500" : "bg-amber-50/50 border-amber-200"}`}
                        onClick={(e) => { e.stopPropagation(); setSelected(selected === "PSPACE" ? null : "PSPACE"); }}
                    >
                         <div className="text-right text-xs font-bold text-amber-400 mb-1">PSPACE</div>

                         {/* NP */}
                         <motion.div
                             className={`p-4 rounded-xl border-2 transition-colors cursor-pointer ${selected === "NP" ? "bg-blue-100 border-blue-500" : "bg-blue-50/50 border-blue-200"}`}
                             onClick={(e) => { e.stopPropagation(); setSelected(selected === "NP" ? null : "NP"); }}
                         >
                            <div className="text-right text-xs font-bold text-blue-400 mb-1">NP</div>

                            {/* P */}
                            <motion.div
                                className={`p-4 rounded-xl border-2 transition-colors cursor-pointer ${selected === "P" ? "bg-emerald-100 border-emerald-500" : "bg-emerald-50/50 border-emerald-200"}`}
                                onClick={(e) => { e.stopPropagation(); setSelected(selected === "P" ? null : "P"); }}
                            >
                                <div className="text-right text-xs font-bold text-emerald-400 mb-1">P</div>

                                {/* L */}
                                <motion.div
                                    className={`p-3 rounded-lg border-2 text-center font-bold transition-colors cursor-pointer ${selected === "L" ? "bg-cyan-100 border-cyan-500 text-cyan-800" : "bg-white border-cyan-200 text-cyan-500"}`}
                                    onClick={(e) => { e.stopPropagation(); setSelected(selected === "L" ? null : "L"); }}
                                >
                                    L (Log Space)
                                </motion.div>
                            </motion.div>
                         </motion.div>
                    </motion.div>
                </motion.div>

                {/* Description Box */}
                <div className="h-32 mt-4 relative">
                    {selected ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={selected}
                            className={`p-4 rounded-lg border ${DEFINITIONS[selected].bg} ${DEFINITIONS[selected].border}`}
                        >
                            <h4 className={`font-bold ${DEFINITIONS[selected].color}`}>{DEFINITIONS[selected].title}</h4>
                            <p className="text-sm mt-2 text-gray-800">{DEFINITIONS[selected].desc}</p>
                        </motion.div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-lg">
                            クラスをクリックして詳細を表示
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
}
