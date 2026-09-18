import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Sparkles,
  Bus,
  Home,
  Utensils,
  ShieldCheck,
  GraduationCap,
  Award,
  Layers,
  ClipboardCopy,
  Check,
  Volume2,
  Filter,
} from 'lucide-react';
import { useWikiArticlesQuery } from '../services/postsApi';
import { WikiArticle, PostCategory } from '../types/schema';
import { speakCampusText } from '../utils/speechUtils';
import { useToast } from './Toast';

interface WikiKnowledgeBaseProps {
  activeLanguage?: 'ru' | 'zh';
  onNavigateToCommunity?: (category?: string) => void;
  onAskQuestion?: () => void;
}

const CATEGORY_TABS: Array<{
  id: string;
  labelRu: string;
  labelZh: string;
  icon: React.ReactNode;
}> = [
  { id: 'all', labelRu: 'Все категории', labelZh: '全部分类', icon: <Layers className="w-4 h-4" /> },
  { id: 'transport', labelRu: 'Городской транспорт', labelZh: '城市交通与Оплати', icon: <Bus className="w-4 h-4" /> },
  { id: 'dormitory', labelRu: 'Общежитие и белье', labelZh: '宿舍生活与换洗', icon: <Home className="w-4 h-4" /> },
  { id: 'cuisine', labelRu: 'Кухня и продукты', labelZh: '餐饮美食与调料', icon: <Utensils className="w-4 h-4" /> },
  { id: 'etiquette', labelRu: 'Этикет и тишина', labelZh: '社交礼仪与静音', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'studies', labelRu: 'Обучение и сессия', labelZh: '学业考试与系办', icon: <GraduationCap className="w-4 h-4" /> },
];

export const WikiKnowledgeBase: React.FC<WikiKnowledgeBaseProps> = ({
  activeLanguage = 'ru',
  onNavigateToCommunity,
  onAskQuestion,
}) => {
  const isZh = activeLanguage === 'zh';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { showToast } = useToast();

  const { data: articles = [], isLoading } = useWikiArticlesQuery({
    category: selectedCategory,
    searchQuery,
  });

  const handleCopySteps = (article: WikiArticle) => {
    const title = isZh ? article.titleZh : article.titleRu;
    const steps = isZh ? (article.keyStepsZh || article.keyStepsRu) : (article.keyStepsRu || article.keyStepsZh);
    const content = isZh ? article.contentZh : article.contentRu;

    const formatted = `[Campus.Connect 百科知识库 // База Знаний]\n${title}\n\n${content}\n\nШаги / 办理步骤:\n` +
      (steps?.map((s, i) => `${i + 1}. ${s}`).join('\n') || '') +
      `\n\n---\n来源: 校园双语自进化知识库平台`;

    navigator.clipboard.writeText(formatted);
    setCopiedId(article.id);
    setTimeout(() => setCopiedId(null), 2500);

    showToast({
      message: isZh ? '知识库办事步骤已复制！' : 'Инструкция успешно скопирована!',
      type: 'success',
    });
  };

  const selectedArticle = articles.find((a) => a.id === selectedArticleId) || articles[0];

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* Приветственный баннер Базы Знаний */}
      <div className="p-4 sm:p-5 bg-campus-dark text-white border-2 border-campus-border shadow-brutal-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="p-1 bg-campus-action text-black font-mono font-bold text-[10px] uppercase">
              Wiki & Handbook
            </span>
            <span className="text-xs font-mono text-campus-action font-bold">
              {isZh ? '自进化知识库体系' : 'Живая База Знаний Беларуси'}
            </span>
          </div>
          <h1 className="font-mono font-extrabold text-base sm:text-xl tracking-tight">
            {isZh
              ? '白俄罗斯中国留学生生活与学业百科全书'
              : 'Энциклопедия адаптации студентов в Беларуси'}
          </h1>
          <p className="text-xs font-sans text-gray-300 max-w-2xl leading-relaxed">
            {isZh
              ? '汇集官方权威校规、公共交通支付、宿舍被褥换洗、考马罗夫卡中餐调料等高频痛点。每当社区互助提问累计达 3-5 票赞同，AI 将自动归纳收录入库！'
              : 'Готовые решения для первокурсников: оплата через «Оплати», еженедельная смена постельного белья, драники, китайские приправы на Комаровке и закон о тишине с 23:00. Темы с 3+ голосами студентов попадают сюда автоматически!'}
          </p>
        </div>
      </div>

      {/* Поиск и категории */}
      <div className="bg-white border-2 border-campus-border shadow-brutal-xs p-3.5 space-y-3">
        {/* Поисковая строка */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isZh
                ? '搜索知识库：例如“Оплати 扫码乘车”、“被褥换洗时间”、“考马罗夫卡调料”...'
                : 'Поиск по Базе Знаний: «Оплати», «смена белья», «драники», «тишина 23:00»...'
            }
            className="w-full pl-9 pr-3 py-2 text-xs border border-campus-border bg-campus-bg/40 text-campus-text font-mono focus:ring-1 focus:ring-campus-action shadow-inner"
          />
          <Search className="w-4 h-4 text-campus-subtle absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-campus-subtle hover:text-campus-text"
            >
              ✕
            </button>
          )}
        </div>

        {/* Табы категорий Беларуси */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(tab.id);
                  setSelectedArticleId(null);
                }}
                className={`px-3 py-1.5 border flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer font-bold ${
                  isSelected
                    ? 'bg-campus-dark text-white border-campus-dark shadow-brutal-xs ring-1 ring-campus-action'
                    : 'bg-white text-campus-text border-campus-border hover:bg-campus-bg'
                }`}
              >
                {tab.icon}
                <span>{isZh ? tab.labelZh : tab.labelRu}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Сетка статей и детального просмотра */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Список статей (слева) */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-campus-subtle px-1">
            <span>{isZh ? `收录条目 (${articles.length})` : `Статьи Википедии (${articles.length})`}</span>
            <span>{isZh ? '点击查看双语正文' : 'Выберите статью'}</span>
          </div>

          {articles.length === 0 ? (
            <div className="p-8 text-center bg-white border border-campus-border font-mono text-xs text-campus-subtle space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-campus-subtle/60" />
              <div>{isZh ? '未找到相关知识库条目' : 'Ничего не найдено по вашему запросу'}</div>
              {onAskQuestion && (
                <button
                  type="button"
                  onClick={onAskQuestion}
                  className="btn-action text-xs px-3 py-1 mt-2 cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isZh ? '提交该问题并交由 AI 预处理' : 'Задать этот вопрос сообществу'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {articles.map((art) => {
                const isActive = selectedArticle?.id === art.id;
                const isCommunity = art.badge === 'community_promoted';

                return (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticleId(art.id)}
                    className={`p-3.5 border-2 transition-all cursor-pointer text-left space-y-1.5 ${
                      isActive
                        ? 'bg-white border-campus-action shadow-brutal-md ring-2 ring-campus-action/30'
                        : 'bg-white border-campus-border hover:border-campus-dark shadow-brutal-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      {isCommunity ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-500">
                          <Award className="w-3 h-3 text-amber-700" />
                          <span>{isZh ? '社区精选入库' : 'Выбрано сообществом'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-green-100 text-green-900 border border-green-500">
                          <CheckCircle2 className="w-3 h-3 text-green-700" />
                          <span>{isZh ? '官方指南' : 'Официальный стандарт'}</span>
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-campus-subtle">
                        {art.updatedAt}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs sm:text-sm text-campus-text font-sans leading-snug">
                      {isZh ? art.titleZh : art.titleRu}
                    </h3>

                    <p className="text-[11px] text-campus-subtle font-sans line-clamp-2 leading-relaxed">
                      {isZh ? art.contentZh : art.contentRu}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-campus-border/40 text-[10px] font-mono text-campus-subtle">
                      <div className="flex items-center gap-1">
                        {art.tags.slice(0, 3).map((t, idx) => (
                          <span key={idx} className="bg-campus-bg px-1 py-0.2">#{t}</span>
                        ))}
                      </div>
                      <span>{art.viewsCount} {isZh ? '次查阅' : 'просмотров'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Детальный просмотр выбранной статьи (справа) */}
        <div className="lg:col-span-7">
          {selectedArticle ? (
            <div className="p-4 sm:p-5 bg-white border-2 border-campus-border shadow-brutal-md space-y-4">
              
              {/* Бейдж и дата */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-campus-border">
                <div className="flex items-center gap-2">
                  {selectedArticle.badge === 'community_promoted' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-600 shadow-brutal-xs">
                      <Award className="w-3.5 h-3.5 text-amber-700" />
                      <span>{isZh ? '社区 3+ 票赞同推荐入库' : 'Выбрано сообществом (3+ голоса)'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-bold bg-green-100 text-green-900 border border-green-700 shadow-brutal-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
                      <span>{isZh ? '白俄罗斯官方校园权威备忘' : 'Официальный стандарт Беларуси'}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => speakCampusText(isZh ? selectedArticle.titleZh : selectedArticle.titleRu, isZh ? 'zh' : 'ru')}
                    className="p-1 border border-campus-border hover:bg-campus-bg text-campus-action shadow-brutal-xs cursor-pointer"
                    title={isZh ? '朗读标题' : 'Озвучить'}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopySteps(selectedArticle)}
                    className="p-1 border border-campus-border hover:bg-campus-bg text-campus-subtle hover:text-campus-text shadow-brutal-xs cursor-pointer flex items-center gap-1 text-[11px] font-mono px-2"
                    title={isZh ? '复制全文步骤' : 'Скопировать инструкцию'}
                  >
                    {copiedId === selectedArticle.id ? (
                      <>
                        <Check className="w-3 h-3 text-green-600 stroke-[3]" />
                        <span className="text-green-700 font-bold">{isZh ? '已复制！' : 'Скопировано!'}</span>
                      </>
                    ) : (
                      <>
                        <ClipboardCopy className="w-3 h-3 text-campus-action" />
                        <span>{isZh ? '复制备忘' : 'Копировать'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Заголовки на обоих языках */}
              <div className="space-y-1">
                <h2 className="font-extrabold text-base sm:text-lg text-campus-text font-sans leading-snug">
                  {isZh ? selectedArticle.titleZh : selectedArticle.titleRu}
                </h2>
                <div className="text-xs font-mono text-campus-subtle">
                  {isZh ? selectedArticle.titleRu : selectedArticle.titleZh}
                </div>
              </div>

              {/* Основной текст на языке пользователя */}
              <div className="p-3 bg-campus-bg/40 border border-campus-border text-xs sm:text-sm text-campus-text leading-relaxed font-sans whitespace-pre-line">
                {isZh ? selectedArticle.contentZh : selectedArticle.contentRu}
              </div>

              {/* Параллельный перевод для языковой поддержки */}
              <details className="border border-campus-border bg-white text-xs font-mono">
                <summary className="p-2 cursor-pointer text-campus-action font-bold hover:bg-campus-bg flex items-center justify-between">
                  <span>{isZh ? '查看俄语权威对照文本 (RU)' : 'Показать китайский текст статьи (ZH)'}</span>
                  <span className="text-[10px]">▼</span>
                </summary>
                <div className="p-3 border-t border-campus-border font-sans text-xs text-campus-text/90 leading-relaxed whitespace-pre-line bg-gray-50">
                  {isZh ? selectedArticle.contentRu : selectedArticle.contentZh}
                </div>
              </details>

              {/* Пошаговый алгоритм действий (Step-by-step) */}
              {((isZh ? selectedArticle.keyStepsZh : selectedArticle.keyStepsRu) || selectedArticle.keyStepsRu) && (
                <div className="p-3.5 bg-amber-50/60 border-2 border-amber-400 space-y-2.5">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-amber-950 uppercase">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    <span>{isZh ? '标准办事与行动流程：' : 'Пошаговый алгоритм действий:'}</span>
                  </div>

                  <div className="space-y-2">
                    {((isZh ? selectedArticle.keyStepsZh : selectedArticle.keyStepsRu) || selectedArticle.keyStepsRu)!.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs font-sans text-campus-text bg-white p-2 border border-amber-200">
                        <span className="font-mono font-extrabold text-amber-900 bg-amber-200 px-1.5 py-0.2 border border-amber-400 text-[10px] flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="leading-snug">{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Нижняя панель действий */}
              <div className="flex items-center justify-between pt-3 border-t border-campus-border flex-wrap gap-2 text-xs font-mono">
                <div className="flex items-center gap-1">
                  {selectedArticle.tags.map((t, idx) => (
                    <span key={idx} className="bg-campus-tag px-1.5 py-0.5 border border-campus-border text-[10px]">
                      #{t}
                    </span>
                  ))}
                </div>

                {onNavigateToCommunity && (
                  <button
                    type="button"
                    onClick={() => onNavigateToCommunity(selectedArticle.category)}
                    className="text-campus-action hover:underline cursor-pointer flex items-center gap-1 font-bold"
                  >
                    <span>{isZh ? '前往讨论广场交流' : 'Обсудить в сообществе'}</span>
                    <span>→</span>
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-campus-border text-xs font-mono text-campus-subtle">
              {isZh ? '请从左侧列表中选择条目查看' : 'Выберите статью из списка'}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
