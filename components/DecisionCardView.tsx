
import React from 'react';
import { DecisionCard } from '../types';

interface DecisionCardViewProps {
  card: DecisionCard;
}

const DecisionCardView: React.FC<DecisionCardViewProps> = ({ card }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 mb-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-2xl font-bold text-slate-800 mb-4 border-l-4 border-blue-500 pl-3">
        {card.title}
      </h3>
      
      {card.content && (
        <p className="text-lg text-slate-600 leading-relaxed mb-4">
          {card.content}
        </p>
      )}

      {card.items && card.items.length > 0 && (
        <ul className="space-y-3">
          {card.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </span>
              <span className="text-lg text-slate-700 font-medium">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DecisionCardView;
