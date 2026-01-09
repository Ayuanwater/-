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
      // 访问代理后的 /api/decision
      const response = await fetch('/api/decision', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: problemText,
          // 极简 Payload，防止后端 500
          user_state: userState || '未知',
          category: category || '未分类'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("服务器响应异常:", response.status, errorText);
        throw new Error(`连接不稳定 (${response.status})`);
      }

      const data = await response.json();
      
      // 容错处理：兼容多种后端返回格式
      const cards = data.cards || data.data?.cards || (Array.isArray(data) ? data : null);

      if (cards && Array.isArray(cards)) {
        setResults(cards);
        setStep(AppStep.RESULT);
      } else {
        throw new Error("格式不兼容");
      }

    } catch (err: any) {
      console.error("前端捕获到异常:", err);
      setErrorMessage(err.message || "请求失败");
      
      // 离线/报错兜底逻辑
      setResults([
        {
          title: '既然云端在忙，咱们先手动捋一下',
          content: '别担心，咱们先把乱糟糟的线头理顺：',
          items: [
            '先深呼吸 3 次，感受空气进出身体',
            '拿起手边的杯子喝口水，慢慢喝',
            '在心里（或纸上）写下现在最让你担心的三个字'
          ]
        },
        {
          title: '小提醒',
          content: '无论事情多大，只要把它拆成一分钟能做完的小事，它就没那么可怕了。'
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
          <div className="space-y-8 animate-in w-full">
            {errorMessage && (
              <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-2xl text-amber-900 text-center font-bold text-xl leading-snug shadow-sm">
                ⚠️ 云端连接有点忙，为您展示舒心离线建议
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
      <div className="w-full max-lg lg:max-w-lg">
        {step > 0 && step < 4 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="mb-6 text-blue-600 font-bold text-2xl flex items-center gap-2 active:bg-blue-50 p-2 rounded-xl"
          >
            ← 返回
          </button>
        )}
        
        {renderStep()}

        <div className="mt-20 text-center">
          <button 
            onClick={() => setShowHelp(true)}
            className="text-slate-400 underline text-xl py-4 px-6"
          >
            紧急求助
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50 backdrop-blur-md" role="dialog" aria-modal="true">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl max-w-sm w-full space-y-6">
            <h3 className="text-3xl font-bold text-red-600">温馨提示</h3>
            <p className="text-xl text-slate-700 leading-relaxed font-medium">
              如果您现在感到非常不安全，请立即联系当地的紧急求助电话（如 110、120）或身边最亲近的人。
              <br/><br/>
              记住：无论何时，您都不孤单。
            </p>
            <BigButton onClick={() => setShowHelp(false)}>我知道了</BigButton>
          </div>
        </div>
      )}
    </main>
  );
};

export default App;