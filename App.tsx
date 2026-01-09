
import React, { useState } from 'react';
import { AppStep, UserState, ProblemCategory, DecisionCard, DecisionResponse } from './types';
import BigButton from './components/BigButton';
import DecisionCardView from './components/DecisionCardView';

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
      // 还原原有逻辑：通过 Vercel Rewrite 访问后端
      const response = await fetch('/api/decision', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          text: problemText,
          context: {
            state: userState || '未知状态',
            category: category || '未分类',
            language: "zh",
            mode: "text"
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("服务器返回错误:", response.status, errorText);
        throw new Error(`服务器异常 (${response.status})`);
      }

      const data: DecisionResponse = await response.json();

      if (data?.cards && Array.isArray(data.cards)) {
        setResults(data.cards);
        setStep(AppStep.RESULT);
      } else {
        throw new Error("返回数据格式不兼容");
      }

    } catch (err: any) {
      console.error("请求失败详情:", err);
      setErrorMessage(err.message || "连接不到服务器");
      
      // 保持原有的离线降级逻辑，确保应用不卡死
      setResults([
        {
          title: '服务器暂时有点忙',
          content: '我们暂时没能从云端获取到详细建议，但您可以先尝试以下通用步骤：'
        },
        {
          title: '深呼吸 3 次',
          content: '这能帮您快速平复焦虑，看清眼前的第一步。'
        },
        {
          title: '写下最担心的 3 件事',
          content: '把混乱的思绪变成文字，往往就没那么可怕了。'
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
          <div className="flex flex-col items-center text-center space-y-10 animate-in">
            <div className="space-y-4">
              <h1 className="text-5xl font-extrabold text-slate-800">舒心助手</h1>
              <p className="text-2xl text-slate-500">不替你做决定，只陪你把事情捋清楚</p>
            </div>
            <div className="w-full max-w-sm">
              <BigButton onClick={() => setStep(AppStep.SELECT_STATE)}>开始捋一捋</BigButton>
            </div>
          </div>
        );

      case AppStep.SELECT_STATE:
        return (
          <div className="space-y-8 animate-in">
            <h2 className="text-3xl font-bold border-l-8 border-blue-500 pl-4">现在的状态</h2>
            <div className="grid gap-4">
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
          <div className="space-y-8 animate-in">
            <h2 className="text-3xl font-bold border-l-8 border-emerald-500 pl-4">事情分类</h2>
            <div className="grid gap-4">
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
          <div className="space-y-8 animate-in">
            <h2 className="text-3xl font-bold border-l-8 border-blue-500 pl-4">发生了什么事？</h2>
            <div className="space-y-6">
              <textarea
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder="在这里写下你担心的事情... 比如：'明天要交房租，但是还没发工资'"
                className="w-full h-56 p-6 text-xl bg-white border-2 border-slate-200 rounded-3xl focus:border-blue-500 focus:ring-0 transition-all shadow-inner"
              />
              <BigButton onClick={handleDecision} disabled={isLoading || !problemText.trim()}>
                帮我捋一捋
              </BigButton>
            </div>
          </div>
        );

      case AppStep.LOADING:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 animate-pulse">
            <div className="w-20 h-20 border-8 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-800">正在整理思绪...</h2>
              <p className="text-2xl text-slate-500 px-6">把乱糟糟的事情分开，其实没那么可怕</p>
            </div>
          </div>
        );

      case AppStep.RESULT:
        return (
          <div className="space-y-8 animate-in">
            {errorMessage && (
              <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl text-amber-800 text-center font-medium">
                提示：{errorMessage}。已为您展示临时建议。
              </div>
            )}
            <h2 className="text-3xl font-bold text-center text-slate-800">为您捋出的几条思路</h2>
            <div className="space-y-4">
              {results.map((card, i) => (
                <DecisionCardView key={i} card={card} />
              ))}
            </div>
            <div className="pt-6 space-y-4">
              <BigButton onClick={() => setStep(AppStep.INPUT_PROBLEM)}>换一种说法再说一次</BigButton>
              <BigButton variant="outline" onClick={resetAll}>从头开始</BigButton>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-lg">
        {step > 0 && step < 4 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="mb-6 text-blue-600 font-bold text-xl flex items-center gap-2"
          >
            ← 返回上一步
          </button>
        )}
        
        {renderStep()}

        <div className="mt-16 text-center">
          <button 
            onClick={() => setShowHelp(true)}
            className="text-slate-400 underline text-lg"
          >
            紧急帮助
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl max-w-sm w-full space-y-6">
            <h3 className="text-3xl font-bold text-red-600">温馨提示</h3>
            <p className="text-xl text-slate-700 leading-relaxed">
              如果您现在感到非常不安全，请立即联系当地的紧急求助电话（如 110、120）或身边最亲近的人。
              <br/><br/>
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
