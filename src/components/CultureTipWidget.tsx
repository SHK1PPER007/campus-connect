import React, { useState } from 'react';
import { SURVIVAL_TIPS } from '../mock/mockData';
import { Lightbulb, ChevronLeft, ChevronRight, Globe, Sparkles, Compass } from 'lucide-react';

interface CultureTipWidgetProps {
  activeLanguage?: 'ru' | 'zh';
}

export const CultureTipWidget: React.FC<CultureTipWidgetProps> = ({
  activeLanguage = 'ru',
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showRussian, setShowRussian] = useState(activeLanguage === 'ru');

  const tip = SURVIVAL_TIPS[currentIdx];
  const isZh = activeLanguage === 'zh';

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % SURVIVAL_TIPS.length);
  };

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + SURVIVAL_TIPS.length) % SURVIVAL_TIPS.length);
  };

  return (
    <div className="bg-white border border-campus-border shadow-brutal p-4 sm:p-5 mb-5 relative overflow-hidden">
      
      {/* Шапка виджета */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 bg-campus-dark text-white flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-3.5 h-3.5 text-campus-action" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-mono font-bold text-xs uppercase text-campus-text tracking-tight">
                {isZh ? '校园适应常识贴士' : 'Памятка первокурснику'}
              </h4>
              <span className="badge-sticker text-[9px] py-0 px-1 font-mono">
                {tip.tag}
              </span>
            </div>
            <p className="text-[10px] font-mono text-campus-subtle">
              {isZh ? '初到大学校园生活与学业指引' : 'Правила кампуса и адаптация к учебе'}
            </p>
          </div>
        </div>

        {/* Навигация */}
        <div className="flex items-center space-x-1 font-mono">
          <button
            onClick={handlePrev}
            className="w-6 h-6 border border-campus-border text-campus-text flex items-center justify-center hover:bg-campus-bg transition-colors cursor-pointer"
            title="Назад"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-campus-subtle px-1.5">
            {currentIdx + 1}/{SURVIVAL_TIPS.length}
          </span>
          <button
            onClick={handleNext}
            className="w-6 h-6 border border-campus-border text-campus-text flex items-center justify-center hover:bg-campus-bg transition-colors cursor-pointer"
            title="Вперед"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Тело совета */}
      <div className="bg-campus-bg border border-campus-border/60 p-3 sm:p-3.5">
        <div className="flex items-start space-x-3">
          <Compass className="w-5 h-5 text-campus-action flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs sm:text-sm text-campus-text mb-1 font-sans">
              {showRussian ? tip.titleRu : tip.titleZh}
            </div>
            <p className="text-xs text-campus-muted leading-relaxed font-sans">
              {showRussian ? tip.contentRu : tip.contentZh}
            </p>
          </div>
        </div>
      </div>

      {/* Футер */}
      <div className="flex items-center justify-between mt-2.5 pt-1 text-[11px] font-mono">
        <span className="text-campus-subtle flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-campus-action" />
          <span>{isZh ? '消除跨文化隔阂' : 'Снимаем культурный барьер'}</span>
        </span>
        <button
          onClick={() => setShowRussian(!showRussian)}
          className="text-campus-action hover:underline font-bold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Globe className="w-3 h-3" />
          <span>{showRussian ? '查看中文版本' : 'Пояснение на русском'}</span>
        </button>
      </div>

    </div>
  );
};
