import React, { useMemo, useState } from "react";
import {
  AppStep,
  UserState,
  ProblemCategory,
  DecisionCard,
  DecisionResponse,
} from "./types";
import BigButton from "./components/BigButton";
import DecisionCardView from "./components/DecisionCardView";

/**
 * 舒心助手 - 前端 UI 层
 * 原则：
 * 1) 前端不直接调用任何大模型 SDK，不暴露 Key
 * 2) 只通过 fetch 调用已部署的后端 API
 * 3) 失败时给出温和兜底卡片，不显示技术报错
 */

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.WELCOME);
  const [userState, setUserState] = useState<UserState>("");
  const [category, setCategory] = useState<ProblemCategory>("");
  const [problemText, setProblemText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DecisionCard[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  // ✅ 永远指向后端（不再用 /api/decision 相对路径）
  const API_BASE = useMemo(() => {
    const envBase = (import.meta as any)?.env?.VITE_API_BASE as
      | string
      | undefined;
    return (
      (envBase && envBase.trim()) ||
      "https://shu-xin-api-clean-laln.vercel.app"
    );
  }, []);

  const resetAll = () => {
    setStep(AppStep.WELCOME);
    setUserState("");
    setCategory("");
    setProblemText("");
    setResults([]);
  };

  const localFallbackCards = (): DecisionCard[] => [
    {
      title: "我听到的是",
      content: `您刚才说：“${problemText}”。我明白您现在感觉 ${userState || "有点复杂"}。`,
    },
    {
      title: "先做一件最小的事",
      content:
        "先别急着做决定。现在只需要做一件最小的、能推进一点点的事：确认这件事最晚什么时候必须处理完。",
      items: ["写下最晚截止时间", "把要做的动作拆成 1–2 个最小步骤", "先完成其中一个"],
    },
    {
      title: "把压力分成两类",
      content:
        "我们先把“必须马上处理的”与“可以稍后再想的”分开，这会让大脑压力立刻下降一点。",
      items: ["现在必须做：___", "今天之内再做：___", "本周再做：___"],
    },
  ];

  const handleDecision = async () => {
    if (!problemText.trim()) return;

    setStep(AppStep.LOADING);
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const url = `${API_BASE.replace(/\/$/, "")}/api/decision`;

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          text: problemText,
          context: {
            state: userState,
            category: category,
            language: "zh",
            mode: "text",
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        // 读一下返回体，方便定位（但不展示给用户）
        const errText = await resp.text().catch(() => "");
        console.error("API error:", resp.status, errText);
        throw new Error(`Request failed: ${resp.status}`);
      }

      const data = (await resp.json()) as DecisionResponse;

      if (data && Array.isArray(data.cards)) {
        setResults(data.cards);
        setStep(AppStep.RESULT);
      } else {
        console.error("Invalid response:", data);
        throw new Error("Invalid response structure");
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Request failed:", err);
      setResults(localFallbackCards());
      setStep(AppStep.RESULT);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case AppStep.WELCOME:
        return (
          <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
                舒心助手
              </h1>
              <p className="text-xl text-slate-500 px-4">
                不替你做决定，只陪你把事情捋清楚
              </p>
            </div>
            <div className="w-full pt-12">
              <BigButton onClick={() => setStep(AppStep.SELECT_STATE)}>
                开始捋一捋
              </BigButton>
            </div>
          </div>
        );

      case AppStep.SELECT_STATE:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-3xl font-bold text-slate-800">第 1/3 步</h2>
              <span className="text-slate-400">现在的状态</span>
            </div>
            <p className="text-2xl font-medium text-slate-700 mb-6">
              您现在感觉怎么样？
            </p>
            <div className="grid gap-4">
              {(
                [
                  "我有点慌",
                  "我不知道该怎么选",
                  "钱的事让我压力很大",
                  "我想慢慢想，不急",
                ] as UserState[]
              ).map((s) => (
                <BigButton
                  key={s}
                  variant="outline"
                  onClick={() => {
                    setUserState(s);
                    setStep(AppStep.SELECT_CATEGORY);
                  }}
                >
                  {s}
                </BigButton>
              ))}
            </div>
          </div>
        );

      case AppStep.SELECT_CATEGORY:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-3xl font-bold text-slate-800">第 2/3 步</h2>
              <span className="text-slate-400">事情分类</span>
            </div>
            <p className="text-2xl font-medium text-slate-700 mb-6">
              是什么样的事情？
            </p>
            <div className="grid gap-4">
              {(
                [
                  "账单/欠费",
                  "吃饭/出行/日常花销",
                  "工作/时间安排",
                  "其他/说不清",
                ] as ProblemCategory[]
              ).map((c) => (
                <BigButton
                  key={c}
                  variant="outline"
                  onClick={() => {
                    setCategory(c);
                    setStep(AppStep.INPUT_PROBLEM);
                  }}
                >
                  {c}
                </BigButton>
              ))}
            </div>
          </div>
        );

      case AppStep.INPUT_PROBLEM:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-3xl font-bold text-slate-800">第 3/3 步</h2>
              <span className="text-slate-400">具体情况</span>
            </div>
            <p className="text-2xl font-medium text-slate-700 mb-4">
              发生了什么事？
            </p>

            <div className="space-y-6">
              <textarea
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder="在这里写下您担心的事情...（比如：电费单找不到了、明天要面试很紧张）"
                className="w-full h-48 p-6 text-xl bg-white border-2 border-slate-200 rounded-3xl focus:border-blue-500 focus:ring-0 transition-colors shadow-inner"
              />

              <div className="grid grid-cols-1 gap-4">
                <BigButton
                  onClick={handleDecision}
                  disabled={!problemText.trim() || isLoading}
                >
                  帮我捋一捋
                </BigButton>

                <BigButton
                  variant="outline"
                  className="flex gap-2"
                  onClick={() => alert("语音功能正在开发中，很快就会和大家见面！")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  点这里用嘴说
                </BigButton>
              </div>
            </div>
          </div>
        );

      case AppStep.LOADING:
        return (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse text-center">
            <div className="w-24 h-24 border-8 border-blue-500 border-t-transparent rounded-full animate-spin mb-12" />
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              我在整理...很快
            </h2>
            <p className="text-xl text-slate-500 italic px-6">
              我正在帮你把事情理顺，先把最急的和不急的分开
            </p>
          </div>
        );

      case AppStep.RESULT:
        return (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <h2 className="text-3xl font-bold text-slate-800 text-center mb-8">
              为您捋出了几条思路
            </h2>

            <div className="space-y-4">
              {results.map((card, idx) => (
                <DecisionCardView key={idx} card={card} />
              ))}
            </div>

            <div className="pt-8 space-y-4 sticky bottom-4">
              <BigButton onClick={() => setStep(AppStep.INPUT_PROBLEM)}>
                换一种说法再问一次
              </BigButton>
              <BigButton variant="outline" onClick={resetAll}>
                从头开始
              </BigButton>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen max-w-lg mx-auto bg-slate-50 relative flex flex-col p-6 pb-24">
      {/* 顶部返回 */}
      {step > AppStep.WELCOME && step < AppStep.RESULT && (
        <button
          onClick={() => setStep(step - 1)}
          className="self-start p-2 mb-4 text-blue-600 font-bold flex items-center gap-1 text-lg"
          aria-label="返回上一页"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          返回上一页
        </button>
      )}

      <div className="flex-grow flex flex-col justify-center">{renderStep()}</div>

      {/* 底部帮助入口 */}
      <div className="mt-12 text-center">
        <button
          onClick={() => setShowHelp(true)}
          className="text-slate-400 underline text-lg p-2"
        >
          紧急帮助
        </button>
      </div>

      {/* 帮助弹窗 */}
      {showHelp && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
          role="dialog"
          aria-labelledby="help-title"
        >
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3
              id="help-title"
              className="text-2xl font-bold text-red-600 mb-4"
            >
              温馨提示
            </h3>
            <p className="text-xl text-slate-700 leading-relaxed mb-8">
              如果您现在感觉非常不安全，或者有伤害自己或他人的想法，请立刻放下手机，联系您当地的紧急求助电话（如：110、120）或寻找身边最亲近的人。
              <br />
              <br />
              记住：您并不孤单，总会有人愿意听您说话。
            </p>
            <BigButton onClick={() => setShowHelp(false)}>我知道了</BigButton>
          </div>
        </div>
      )}
    </main>
  );
};

export default App;
