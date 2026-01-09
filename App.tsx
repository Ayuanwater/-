import React, { useState } from 'react';
import { AppStep, UserState, ProblemCategory, DecisionCard, DecisionResponse } from './types';
import BigButton from './components/BigButton';
import DecisionCardView from './components/DecisionCardView';

// 健壮的环境变量读取逻辑
const getApiBase = () => {
  try {
    // 检查 import.meta.env 是否存在，避免浏览器报错
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) {
      return import.meta.env.VITE_API_BASE;
    }
  } catch (e) {
    console.warn("无法读取环境变量 VITE_API_BASE，使用默认值");
  }
  return "https://shu-xin-api-clean-laln.vercel.app";
};

const API_BASE = getApiBase();

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.WELCOME);
  const [userState, setUserState] = useState<UserState>('');
  const [category, setCategory] = useState<ProblemCategory>('');
  const [problemText, setProblemText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DecisionCard[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetAll = () => {
    setStep(AppStep.WELCOME);
    setUserState('');
    setCategory('');
    setProblemText('');
    setResults([]);
    setErrorMessage(null);
  };

  const handleDecision = async () => {
    if (!problemText.trim()) return;

    setStep(AppStep.LOADING);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 按照要求：前端直接请求已部署的后端 API 域名
      const requestUrl = `${API_BASE}/api/decision`;
      console.log(`📡 发起请求: ${requestUrl}`);

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: problemText,
          context: {
            state: userState || '未知',
            category: category || '未分类',
            language: "zh",
            mode: "text"
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`请求异常: ${response.status}`);
      }

      const data: DecisionResponse = await response.json();

      if (data?.cards && Array.isArray(data.cards)) {
        setResults(data.cards);
        setStep(AppStep.RESULT);
      } else {
        throw new Error("返回数据格式不正确");
      }

    } catch (err: any) {
      console.error("❌ 决策请求失败:", err);
      setErrorMessage(err.message || "连接失败");
      
      // 降级策略
      setResults([
        {
          title: '暂时无法连接云端',
          content: '抱歉，目前的网络状况不太理想，建议您先尝试以下操作：',
          items: [
            '深呼吸三次，把注意力放到呼吸上',
            '喝一点水，稍微休息一下',
            '等网络好一点了，再来找我聊聊'
          ]
        }
      ]);
      setStep(AppStep.RESULT);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case AppStep.WELCOME:
        return (
          <div className="flex flex-col items-center text-center space-y-12 animate-in pt-10 px-4">
            <div className="space-y-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl" role="img" aria-label="meditation">🧘</span>
              </div>
              <h1 className="text-5xl font-black text-slate-800 tracking-tight">舒心助手</h1>
              <p className="text-2xl text-slate-500 font-medium">不替你做决定，只陪你把事情理顺</p>
            </div>
            <div className="w-full max-w-sm">
              <BigButton onClick={() => setStep(AppStep.SELECT_STATE)}>开始捋一捋</BigButton>
            </div>
          </div>
        );

      case AppStep.SELECT_STATE:
        return (
          <div className="space-y-8 animate-in px-4">
            <h2 className="text-3xl font-bold border-l-8 border-blue-500 pl-4 text-slate-800">现在的状态</h2>
            <div className="grid gap-5">
              {(['我有点慌', '我不知道该怎么选', '钱的事让我压力很大', '我想慢慢想，不急'] as UserState[]).map(s => (
                <BigButton key={s} variant="outline" onClick={() => { setUserState(s); setStep(AppStep.SELECT_CATEGORY); }}>
                  {s}
                </BigButton>
              ))}
            </div>
          </div>
        );

      case AppStep.SELECT_CATEGORY:
        return (
          <div className="space-y-8 animate-in px-4">
            <h2 className="text-3xl font-bold border-l-8 border-emerald-500 pl-4 text-slate-800">事情分类</h2>
            <div className="grid gap-5">
              {(['账单/欠费', '吃饭/出行/日常花销', '工作/时间安排', '其他/说不清'] as ProblemCategory[]).map(c => (
                <BigButton key={c} variant="outline" onClick={() => { setCategory(c); setStep(AppStep.INPUT_PROBLEM); }}>
                  {c}
                </BigButton>
              ))}
            </div>
          </div>
        );

      case AppStep.INPUT_PROBLEM:
        return (
          <div className="space-y-8 animate-in px-4">
            <h2 className="text-3xl font-bold border-l-8 border-blue-500 pl-4 text-slate-800">发生了什么事？</h2>
            <div className="space-y-6">
              <textarea
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder="在这里随便写写，比如：'明天要交房租，但是还没发工资'"
                className="w-full h-64 p-8 text-2xl bg-white border-4 border-slate-100 rounded-[40px] focus:border-blue-500 shadow-inner leading-relaxed"
              />
              <BigButton onClick={handleDecision} disabled={isLoading || !problemText.trim()}>
                帮我捋一捋
              </BigButton>
            </div>
          </div>
        );

      case AppStep.LOADING:
        return (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-10 animate-in">
            <div className="w-24 h-24 border-8 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-800">正在帮您整理思绪...</h2>
              <p className="text-2xl text-slate-500 px-10">理清思路通常只需要不到一分钟的时间</p>
            </div>
          </div>
        );

      case AppStep.RESULT:
        return (
          <div className="space-y-8 animate-in px-4 w-full">
            {errorMessage && (
              <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl text-amber-900 text-center font-bold">
                提示：{errorMessage}。已为您展示舒心基础建议
              </div>
            )}
            <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">为您捋出的几条思路</h2>
            <div className="space-y-6">
              {results.map((card, i) => (
                <DecisionCardView key={i} card={card} />
              ))}
            </div>
            <div className="pt-10 space-y-5">
              <BigButton onClick={() => setStep(AppStep.INPUT_PROBLEM)}>换一种说法再说一次</BigButton>
              <BigButton variant="outline" onClick={resetAll}>全部重来</BigButton>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center pb-20">
      <div className="w-full max-w-2xl">
        {step > 0 && step < 4 && (
          <nav className="p-6">
            <button 
              onClick={() => setStep(step - 1)}
              className="text-blue-600 font-bold text-2xl flex items-center gap-2 py-2 px-4 rounded-2xl active:bg-blue-50"
            >
              ← 返回
            </button>
          </nav>
        )}
        
        {renderStep()}

        <div className="mt-20 text-center px-4">
          <button 
            onClick={() => setShowHelp(true)}
            className="text-slate-400 underline text-xl py-4 px-6 block mx-auto"
          >
            我遇到了紧急困难
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50 backdrop-blur-md">
          <div className="bg-white p-10 rounded-[48px] shadow-2xl max-w-sm w-full space-y-8 text-center">
            <h3 className="text-4xl font-black text-red-600">温馨提示</h3>
            <p className="text-2xl text-slate-700 leading-relaxed font-medium">
              如果您现在感到非常不安全，请立即拨打：
              <br/>
              <span className="text-3xl font-bold text-blue-600 block mt-4">110 或 120</span>
              <br/>
              记住：无论发生什么，您都不孤单。
            </p>
            <BigButton onClick={() => setShowHelp(false)}>我知道了</BigButton>
          </div>
        </div>
      )}
    </main>
  );
};

export default App;