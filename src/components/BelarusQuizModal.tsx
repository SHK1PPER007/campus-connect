import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  Flame,
  Gamepad2,
  Smile,
} from 'lucide-react';
import { INITIAL_QUIZ_QUESTIONS } from '../mock/mockData';
import { QuizQuestion } from '../types/schema';

interface BelarusQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLanguage?: 'ru' | 'zh';
}

export const BelarusQuizModal: React.FC<BelarusQuizModalProps> = ({
  isOpen,
  onClose,
  activeLanguage = 'ru',
}) => {
  const isZh = activeLanguage === 'zh';
  const questions: QuizQuestion[] = INITIAL_QUIZ_QUESTIONS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(index);
    setIsAnswerSubmitted(true);

    if (index === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-campus-surface border-2 border-campus-border shadow-brutal-lg w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Шапка модального окна */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-campus-border bg-campus-dark text-white flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-campus-action text-black">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-mono font-bold text-xs sm:text-sm uppercase tracking-tight text-white">
                {isZh ? '白俄罗斯生活减压知识问答 (Quiz)' : 'Викторина: Адаптация в Беларуси'}
              </h2>
              <span className="text-[10px] font-mono text-campus-action">
                {isZh ? '轻松掌握公共交通、宿舍与校园社交常识' : 'Снятие стресса • Полезные правила жизни в Минске'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 transition-colors cursor-pointer text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {!isFinished ? (
            <>
              {/* Прогресс-бар */}
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between text-campus-subtle">
                  <span>
                    {isZh
                      ? `题目 ${currentIndex + 1} / ${questions.length}`
                      : `Вопрос ${currentIndex + 1} из ${questions.length}`}
                  </span>
                  <span className="font-bold text-campus-action">
                    {isZh ? `当前积分: ${score}` : `Баллы: ${score}`}
                  </span>
                </div>
                <div className="w-full bg-campus-bg h-2 border border-campus-border overflow-hidden">
                  <div
                    className="bg-campus-action h-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Текст вопроса */}
              <div className="p-4 bg-white border-2 border-campus-border shadow-brutal-xs space-y-2">
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-campus-bg border border-campus-border text-campus-subtle">
                  {isZh ? '文化常识' : 'Беларусь & Кампус'}
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-campus-text font-sans leading-snug">
                  {isZh ? currentQ.questionZh : currentQ.questionRu}
                </h3>
                <p className="text-xs text-campus-subtle font-mono">
                  {isZh ? currentQ.questionRu : currentQ.questionZh}
                </p>
              </div>

              {/* Варианты ответов */}
              <div className="space-y-2 font-mono text-xs">
                {(isZh ? currentQ.optionsZh : currentQ.optionsRu).map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctIndex;

                  let btnStyle = 'bg-white border-campus-border hover:bg-campus-bg text-campus-text';
                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      btnStyle = 'bg-green-100 border-green-700 text-green-900 font-bold';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'bg-red-100 border-red-700 text-red-900 font-bold';
                    } else {
                      btnStyle = 'bg-gray-50 border-gray-200 text-gray-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswerSubmitted}
                      className={`w-full p-3 border-2 text-left flex items-center justify-between transition-all cursor-pointer shadow-brutal-xs ${btnStyle}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 flex items-center justify-center font-bold bg-campus-bg border border-campus-border text-[11px]">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="font-sans text-xs sm:text-sm">{option}</span>
                      </div>

                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-green-700 flex-shrink-0" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Пояснение после ответа */}
              {isAnswerSubmitted && (
                <div className="p-3.5 bg-blue-50 border-2 border-blue-400 shadow-brutal-xs space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-blue-900">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>{isZh ? '解析与生活建议：' : 'Объяснение и совет первокурснику:'}</span>
                  </div>
                  <p className="text-xs text-campus-text font-sans leading-relaxed">
                    {isZh ? currentQ.explanationZh : currentQ.explanationRu}
                  </p>
                  <div className="p-2 bg-white border border-blue-200 text-[11px] font-mono text-blue-950 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>{isZh ? currentQ.tipZh : currentQ.tipRu}</span>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="btn-action px-4 py-1.5 text-xs flex items-center gap-1.5 shadow-brutal-xs cursor-pointer font-bold"
                    >
                      <span>{currentIndex + 1 < questions.length ? (isZh ? '下一题' : 'Следующий вопрос') : (isZh ? '查看成绩' : 'Завершить викторину')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Экран результатов */
            <div className="p-6 text-center space-y-4 bg-white border-2 border-campus-border shadow-brutal-md">
              <div className="w-16 h-16 bg-amber-100 border-2 border-amber-500 mx-auto flex items-center justify-center shadow-brutal-xs">
                <Trophy className="w-8 h-8 text-amber-700" />
              </div>

              <div className="space-y-1">
                <h3 className="font-mono font-extrabold text-lg uppercase text-campus-text">
                  {isZh ? '恭喜完成白俄罗斯减压问答！' : 'Викторина успешно пройдена!'}
                </h3>
                <p className="font-mono text-sm text-campus-action font-bold">
                  {isZh
                    ? `答对 ${score} / ${questions.length} 题 • 白俄罗斯达人积分 +${score * 10}`
                    : `Результат: ${score} из ${questions.length} • Кампусные баллы +${score * 10}`}
                </p>
              </div>

              <p className="text-xs font-sans text-campus-text max-w-md mx-auto leading-relaxed bg-campus-bg p-3 border border-campus-border">
                {isZh
                  ? '生活在白俄罗斯并不复杂，多用「Оплати」扫码、23点后戴好耳机、进教学楼存好羽绒服，您就能轻松融入当地生活！有任何疑问随时在问答社区求助或查阅知识库。'
                  : 'Жизнь и учеба в Беларуси полны открытий: оплачивайте проезд через «Оплати», не шумите после 23:00, пришейте петельку на куртку — и первый курс пройдет отлично!'}
              </p>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="btn-outline px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer font-mono"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isZh ? '再测一次' : 'Пройти снова'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-action px-5 py-2 text-xs font-mono font-bold cursor-pointer shadow-brutal-xs"
                >
                  {isZh ? '返回知识平台' : 'Закрыть'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
