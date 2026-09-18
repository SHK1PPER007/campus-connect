import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  Globe,
  Check,
  Mic,
  MicOff,
  AlertCircle,
  GitMerge,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Wand2,
} from 'lucide-react';
import { CURRENT_USER } from '../mock/mockData';
import { Language, PostCategory, User, Post } from '../types/schema';
import { useCreatePostMutation, useMergeQuestionMutation, usePostsQuery } from '../services/postsApi';
import { useToast } from './Toast';
import { startVoiceRecognition, stopVoiceRecognition, isVoiceInputSupported } from '../utils/voiceRecognition';
import {
  checkCensorship,
  checkGrammarAndEnhance,
  findSimilarQuestions,
  GrammarCheckResult,
  SimilarPostMatch,
} from '../services/moderationService';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
  activeLanguage?: Language;
}

const CATEGORY_OPTIONS: Record<Language, { value: PostCategory; label: string }[]> = {
  zh: [
    { value: 'transport', label: '城市交通与 Оплати (白俄罗斯公交/地铁/车票)' },
    { value: 'dormitory', label: '宿舍生活与后勤 (被褥定期换洗/宿管/报修)' },
    { value: 'cuisine', label: '餐饮美食与采购 (土豆饼/食堂/中国调料)' },
    { value: 'etiquette', label: '公共社交礼仪 (23点静音规则/衣帽间存衣)' },
    { value: 'studies', label: '学业考试与考核 (成绩册提交/210系办)' },
    { value: 'visa', label: '签证居留与注册 (104外事处/落地签)' },
    { value: 'curator', label: '辅导员综合咨询 (108办公室)' },
  ],
  ru: [
    { value: 'transport', label: 'Городской транспорт (Приложение «Оплати», талоны, метро)' },
    { value: 'dormitory', label: 'Быт общежития (Смена постельного белья, комендант)' },
    { value: 'cuisine', label: 'Белорусская кухня (Драники, китайские приправы)' },
    { value: 'etiquette', label: 'Правила этикета (Закон о тишине с 23:00, гардероб)' },
    { value: 'studies', label: 'Учеба и сессия (Зачетки, деканат 210, отработки)' },
    { value: 'visa', label: 'Визы и регистрация в ОГИМ (Каб. 104)' },
    { value: 'curator', label: 'Вопросы кураторам (Каб. 108)' },
  ],
};

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  currentUser = CURRENT_USER,
  activeLanguage,
}) => {
  const [lang, setLang] = useState<Language>(activeLanguage || currentUser.nativeLang);
  const [category, setCategory] = useState<PostCategory>('transport');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [listeningField, setListeningField] = useState<'title' | 'content' | null>(null);

  // Семантический радар и модерация
  const { data: existingPosts = [] } = usePostsQuery();
  const createPostMutation = useCreatePostMutation();
  const mergeQuestionMutation = useMergeQuestionMutation();
  const { showToast } = useToast();

  const [similarMatches, setSimilarMatches] = useState<SimilarPostMatch[]>([]);
  const [previewSimilarPost, setPreviewSimilarPost] = useState<Post | null>(null);
  const [censorshipResult, setCensorshipResult] = useState<{
    isFlagged: boolean;
    reasonRu?: string;
    reasonZh?: string;
    flaggedWords: string[];
  }>({ isFlagged: false, flaggedWords: [] });
  const [grammarResult, setGrammarResult] = useState<GrammarCheckResult | null>(null);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);

  const isZh = lang === 'zh';

  useEffect(() => {
    if (isOpen) {
      setLang(activeLanguage || currentUser.nativeLang);
    }
  }, [isOpen, activeLanguage, currentUser.nativeLang]);

  useEffect(() => {
    if (!isOpen) {
      stopVoiceRecognition();
      setListeningField(null);
      setSimilarMatches([]);
      setPreviewSimilarPost(null);
      setCensorshipResult({ isFlagged: false, flaggedWords: [] });
      setGrammarResult(null);
    }
  }, [isOpen]);

  // Радар схожих вопросов и авто-проверка цензуры в реальном времени
  useEffect(() => {
    const timer = setTimeout(() => {
      const fullText = `${title} ${content}`.trim();
      if (!fullText) {
        setSimilarMatches([]);
        setCensorshipResult({ isFlagged: false, flaggedWords: [] });
        return;
      }

      // 1. Проверка цензуры
      const cCheck = checkCensorship(fullText);
      setCensorshipResult(cCheck);

      // 2. Поиск похожих тем в кампусе
      const matches = findSimilarQuestions({
        title,
        content,
        existingPosts,
      });
      setSimilarMatches(matches);
    }, 350);

    return () => clearTimeout(timer);
  }, [title, content, existingPosts]);

  const autoDetectLanguage = (text: string) => {
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);
    const hasCyrillic = /[а-яА-ЯёЁ]/.test(text);
    if (hasChinese && !hasCyrillic && lang !== 'zh') {
      setLang('zh');
    } else if (hasCyrillic && !hasChinese && lang !== 'ru') {
      setLang('ru');
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    autoDetectLanguage(val);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    autoDetectLanguage(val);
  };

  // Проверка грамматики и орфографии по кнопке
  const handleCheckGrammar = async () => {
    if (!title.trim() && !content.trim()) return;
    setIsCheckingGrammar(true);
    try {
      const result = await checkGrammarAndEnhance({ title, content, lang });
      setGrammarResult(result);
      if (!result.hasSuggestions) {
        showToast({
          message: isZh ? '语法与拼写检查通过，未发现问题！' : 'Ошибок не обнаружено! Текст корректен.',
          type: 'success',
        });
      }
    } catch (e) {
      console.warn('Grammar check failed', e);
    } finally {
      setIsCheckingGrammar(false);
    }
  };

  // Применить предложенные исправления
  const handleApplyGrammarFixes = () => {
    if (!grammarResult) return;
    setTitle(grammarResult.suggestedTitle);
    setContent(grammarResult.suggestedContent);
    setGrammarResult(null);
    showToast({
      message: isZh ? '已应用 AI 纠错与润色！' : 'Исправления успешно применены!',
      type: 'success',
    });
  };

  // Объединить вопрос с найденным похожим постом
  const handleMergeWithSimilar = async (targetPost: Post) => {
    if (!title.trim() || !content.trim() || mergeQuestionMutation.isPending) return;

    // Проверка цензуры перед объединением
    const cCheck = checkCensorship(`${title} ${content}`);
    if (cCheck.isFlagged) {
      setCensorshipResult(cCheck);
      showToast({
        message: isZh ? '内容含有违规词汇，无法合并' : 'Текст содержит недопустимые выражения',
        type: 'error',
      });
      return;
    }

    try {
      await mergeQuestionMutation.mutateAsync({
        targetPostId: targetPost.id,
        title: title.trim(),
        content: content.trim(),
        author: currentUser,
        lang,
      });

      showToast({
        message: isZh ? '已成功合并至已有话题！' : 'Вопрос успешно присоединен к теме!',
        subMessage: isZh
          ? '您的疑问已作为补充关联至该讨论，避免重复提问。'
          : 'Ваше обращение прикреплено к существующему обсуждению.',
        type: 'success',
      });

      onClose();
      setTitle('');
      setContent('');
      setTagInput('');
      setSimilarMatches([]);
      setPreviewSimilarPost(null);
    } catch (e: any) {
      showToast({
        message: e.message || 'Ошибка объединения',
        type: 'error',
      });
    }
  };

  const handleToggleVoice = (field: 'title' | 'content') => {
    if (!isVoiceInputSupported()) {
      showToast({
        message: isZh
          ? '当前浏览器不支持语音输入'
          : 'Голосовой ввод не поддерживается в этом браузере',
        subMessage: isZh
          ? '建议使用 Google Chrome、Microsoft Edge 或 Safari 浏览器'
          : 'Попробуйте в Google Chrome, Microsoft Edge или Safari',
        type: 'info',
      });
      return;
    }

    if (listeningField === field) {
      stopVoiceRecognition();
      setListeningField(null);
      return;
    }

    startVoiceRecognition({
      lang,
      onStart: () => setListeningField(field),
      onResult: (transcript) => {
        if (field === 'title') {
          setTitle((prev) => (prev ? `${prev} ${transcript}` : transcript));
        } else {
          setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      },
      onError: (err) => {
        showToast({
          message: err,
          type: 'error',
        });
        setListeningField(null);
      },
      onEnd: () => {
        setListeningField(null);
      },
    });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || createPostMutation.isPending) return;

    // Строгая проверка цензуры перед публикацией
    const cCheck = checkCensorship(`${title} ${content}`);
    if (cCheck.isFlagged) {
      setCensorshipResult(cCheck);
      showToast({
        message: isZh ? '内容包含违规词汇，请修改后重试' : 'Публикация заблокирована цензурой!',
        subMessage: isZh ? cCheck.reasonZh : cCheck.reasonRu,
        type: 'error',
      });
      return;
    }

    const combined = `${title} ${content}`;
    const zhCount = (combined.match(/[\u4e00-\u9fa5]/g) || []).length;
    const ruCount = (combined.match(/[а-яА-ЯёЁ]/g) || []).length;
    let finalLang = lang;
    if (zhCount > ruCount && zhCount >= 2) {
      finalLang = 'zh';
    } else if (ruCount > zhCount && ruCount >= 2) {
      finalLang = 'ru';
    }

    const tags = tagInput
      .split(/[,，]/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    await createPostMutation.mutateAsync({
      title: title.trim(),
      content: content.trim(),
      category,
      tags: tags.length > 0 ? tags : (finalLang === 'zh' ? ['校园生活', '咨询'] : ['Кампус', 'Вопрос']),
      authorId: currentUser.id,
      lang: finalLang,
      author: currentUser,
    });

    showToast({
      message: finalLang === 'zh' ? '提问已提交至审核队列！' : 'Вопрос отправлен на модерацию!',
      subMessage: finalLang === 'zh'
        ? 'AI 已完成核心要点提炼，审核通过后将在社区展示。获得 3 票赞同将自动收录进知识库！'
        : 'ИИ выделил суть вопроса. После одобрения куратором вопрос появится в ленте (при 3+ голосах войдет в Базу Знаний)!',
      type: 'success',
    });

    onClose();
    setTitle('');
    setContent('');
    setTagInput('');
    setSimilarMatches([]);
    setPreviewSimilarPost(null);
  };

  const categories = CATEGORY_OPTIONS[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-campus-surface border-2 border-campus-border shadow-brutal-lg w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Шапка модального окна */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-campus-border bg-campus-bg flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-campus-action"></div>
            <h2 className="font-mono font-bold text-xs sm:text-sm uppercase tracking-tight text-campus-text">
              {isZh ? '新建校园提问' : 'Новый вопрос в кампусе'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-campus-surface border border-transparent hover:border-campus-border transition-colors cursor-pointer"
            title={isZh ? '关闭' : 'Закрыть'}
          >
            <X className="w-4 h-4 text-campus-text" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Выбор языка написания вопроса */}
          <div className="p-3 bg-campus-bg border border-campus-border space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-campus-text">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-campus-action" />
                <span>
                  {isZh ? '发帖语言：' : 'Язык написания вопроса:'}
                </span>
              </span>
              <span className="text-[10px] font-mono text-campus-ai uppercase font-bold tracking-wider">
                DeepSeek-V4 Sync
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Кнопка 中文 */}
              <button
                type="button"
                onClick={() => setLang('zh')}
                className={`py-2 px-2.5 text-xs font-mono font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  lang === 'zh'
                    ? 'bg-campus-dark text-white border-campus-dark shadow-brutal-xs ring-2 ring-campus-action'
                    : 'bg-white text-campus-text border-campus-border hover:bg-campus-bg'
                }`}
              >
                <span>中文 (ZH)</span>
                {lang === 'zh' && <Check className="w-3.5 h-3.5 text-campus-action stroke-[3]" />}
              </button>

              {/* Кнопка Русский */}
              <button
                type="button"
                onClick={() => setLang('ru')}
                className={`py-2 px-2.5 text-xs font-mono font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  lang === 'ru'
                    ? 'bg-campus-dark text-white border-campus-dark shadow-brutal-xs ring-2 ring-campus-action'
                    : 'bg-white text-campus-text border-campus-border hover:bg-campus-bg'
                }`}
              >
                <span>Русский (RU)</span>
                {lang === 'ru' && <Check className="w-3.5 h-3.5 text-campus-action stroke-[3]" />}
              </button>
            </div>

            <p className="text-[11px] font-mono text-campus-subtle leading-tight pt-0.5">
              {isZh
                ? '提问将经过 AI 语义提炼、安全审查及编辑部审核。社区累计 3 票赞同将直接生成百科条目！'
                : 'Вопрос пройдет сжатие сути нейросетью, проверку этики и модератора. При 3+ голосах сообщества войдет в Базу Знаний!'}
            </p>
          </div>

          {/* Предупреждение цензуры и этики */}
          {censorshipResult.isFlagged && (
            <div className="p-3 bg-red-50 border-2 border-red-500 text-red-900 shadow-brutal-xs space-y-1 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-red-700">
                <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{isZh ? '安全审核拦截：内容包含不当词汇' : 'Блокировка модерации: ненормативная лексика'}</span>
              </div>
              <p className="text-xs font-sans">
                {isZh ? censorshipResult.reasonZh : censorshipResult.reasonRu}
              </p>
              {censorshipResult.flaggedWords.length > 0 && (
                <div className="text-[11px] font-mono text-red-800 pt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold">{isZh ? '违规词：' : 'Обнаружено:'}</span>
                  <span className="bg-red-200 px-1 py-0.5 border border-red-400 font-mono text-[10px]">
                    {censorshipResult.flaggedWords.join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Семантический радар схожих тем и объединение вопросов */}
          {similarMatches.length > 0 && !censorshipResult.isFlagged && (
            <div className="p-3.5 bg-amber-50 border-2 border-amber-500 shadow-brutal-xs space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-amber-900">
                  <GitMerge className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>{isZh ? '校园智能雷达：发现相似的已有话题' : 'AI-Радар: Найдены похожие решенные вопросы!'}</span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase bg-amber-200 text-amber-900 px-1.5 py-0.5 border border-amber-400">
                  {similarMatches[0].score}% {isZh ? '相似' : 'совпадение'}
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed font-sans">
                {isZh
                  ? '该问题在校园已有类似讨论或已解决方案。您可以直接合并至已有话题，无需重复发帖：'
                  : 'Похожий вопрос уже обсуждался в кампусе. Вы можете объединить ваш вопрос с существующей темой в 1 клик, не создавая дубликат:'}
              </p>

              <div className="space-y-2 pt-1">
                {similarMatches.slice(0, 2).map((match) => {
                  const targetPost = match.post;
                  const targetTitle = isZh
                    ? (targetPost.langOriginal === 'zh' ? targetPost.titleOriginal : targetPost.titleTranslated)
                    : (targetPost.langOriginal === 'ru' ? targetPost.titleOriginal : targetPost.titleTranslated);
                  const isPreviewOpen = previewSimilarPost?.id === targetPost.id;

                  return (
                    <div key={targetPost.id} className="p-2.5 bg-white border border-amber-300 shadow-brutal-xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-xs text-campus-text font-sans">
                            {targetTitle}
                          </div>
                          <div className="text-[11px] font-mono text-amber-800 mt-0.5">
                            {isZh ? match.matchReasonZh : match.matchReasonRu}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-green-100 text-green-800 border border-green-400 flex-shrink-0">
                          {targetPost.isResolved ? (isZh ? '已解决' : 'Решено') : (isZh ? '讨论中' : 'В обсуждении')}
                        </span>
                      </div>

                      {/* Предпросмотр ответа */}
                      {isPreviewOpen && targetPost.aiSummary && (
                        <div className="p-2 bg-blue-50/70 border border-blue-200 text-[11px] space-y-1 font-sans">
                          <div className="font-mono font-bold text-blue-900">
                            {isZh ? '核心解答：' : 'Готовое решение:'}
                          </div>
                          <div className="text-campus-text">
                            {isZh ? (targetPost.aiSummary.quickAnswerZh || targetPost.aiSummary.quickAnswer) : targetPost.aiSummary.quickAnswer}
                          </div>
                          {targetPost.aiSummary.locationOrOffice && (
                            <div className="font-mono text-campus-subtle text-[10px]">
                              {isZh ? `地点：${targetPost.aiSummary.locationOrOfficeZh || targetPost.aiSummary.locationOrOffice}` : `Кабинет: ${targetPost.aiSummary.locationOrOffice}`}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-amber-100">
                        <button
                          type="button"
                          onClick={() => setPreviewSimilarPost(isPreviewOpen ? null : targetPost)}
                          className="text-[11px] font-mono text-campus-subtle hover:text-campus-text underline cursor-pointer flex items-center gap-0.5"
                        >
                          {isPreviewOpen ? (
                            <>
                              <span>{isZh ? '收起答案' : 'Скрыть'}</span>
                              <ChevronUp className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              <span>{isZh ? '查看现成答案' : 'Посмотреть ответ'}</span>
                              <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMergeWithSimilar(targetPost)}
                          disabled={mergeQuestionMutation.isPending}
                          className="btn-action px-2.5 py-1 text-[11px] font-mono flex items-center gap-1 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white border-amber-800 shadow-brutal-xs"
                        >
                          <GitMerge className="w-3 h-3" />
                          <span>{mergeQuestionMutation.isPending ? (isZh ? '正在合并...' : 'Объединение...') : (isZh ? '合并至此话题' : 'Объединить с этой темой')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Выбор категории */}
          <div>
            <label className="block text-xs font-mono font-bold text-campus-text uppercase mb-1">
              {isZh ? '问题分类' : 'Категория вопроса'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PostCategory)}
              className="w-full px-3 py-2 text-xs font-mono border border-campus-border bg-white text-campus-text focus:outline-none focus:ring-1 focus:ring-campus-action shadow-brutal-xs cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Заголовок */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono font-bold text-campus-text uppercase">
                {isZh ? '帖子标题' : 'Заголовок темы'}
              </label>
              <button
                type="button"
                onClick={() => handleToggleVoice('title')}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono border transition-all cursor-pointer ${
                  listeningField === 'title'
                    ? 'bg-red-600 text-white border-red-700 animate-pulse font-bold shadow-brutal-xs'
                    : 'bg-white hover:bg-campus-bg text-campus-action border-campus-border/60 shadow-brutal-xs'
                }`}
                title={isZh ? '点击使用麦克风输入标题' : 'Нажмите для голосового ввода заголовка'}
              >
                {listeningField === 'title' ? (
                  <>
                    <MicOff className="w-3 h-3" />
                    <span>{isZh ? '录音中 (点击停止)' : 'Запись (Стоп)'}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3" />
                    <span>{isZh ? '语音输入' : 'Голосовой ввод'}</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder={
                isZh
                  ? '例如：4号宿舍楼门禁卡消磁了在哪里补办？'
                  : 'Например: Как восстановить пропуск в общежитие №4 при утере?'
              }
              className="w-full px-3 py-2 text-xs border border-campus-border bg-white text-campus-text focus:outline-none focus:ring-1 focus:ring-campus-action shadow-brutal-xs font-sans"
              required
            />
          </div>

          {/* Текст вопроса */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono font-bold text-campus-text uppercase">
                {isZh ? '问题详细描述' : 'Суть вопроса'}
              </label>
              <div className="flex items-center gap-1.5">
                {/* Кнопка AI-Корректор */}
                <button
                  type="button"
                  onClick={handleCheckGrammar}
                  disabled={isCheckingGrammar || (!title.trim() && !content.trim())}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono border transition-all cursor-pointer bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 shadow-brutal-xs disabled:opacity-50"
                  title={isZh ? '使用 AI 检查拼写、宿舍用语与语法错误' : 'Проверить орфографию и кампусный сленг с AI'}
                >
                  <Wand2 className={`w-3 h-3 ${isCheckingGrammar ? 'animate-spin' : ''}`} />
                  <span>{isCheckingGrammar ? (isZh ? '检查中...' : 'Проверка...') : (isZh ? 'AI 拼写与语法' : 'AI-Корректор')}</span>
                </button>

                {/* Голосовой ввод */}
                <button
                  type="button"
                  onClick={() => handleToggleVoice('content')}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono border transition-all cursor-pointer ${
                    listeningField === 'content'
                      ? 'bg-red-600 text-white border-red-700 animate-pulse font-bold shadow-brutal-xs'
                      : 'bg-white hover:bg-campus-bg text-campus-action border-campus-border/60 shadow-brutal-xs'
                  }`}
                  title={isZh ? '点击使用麦克风输入正文' : 'Нажмите для голосового ввода текста'}
                >
                  {listeningField === 'content' ? (
                    <>
                      <MicOff className="w-3 h-3" />
                      <span>{isZh ? '录音中 (点击停止)' : 'Запись (Стоп)'}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3" />
                      <span>{isZh ? '语音输入' : 'Голосовой ввод'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              rows={4}
              value={content}
              onChange={handleContentChange}
              placeholder={
                isZh
                  ? '请详细说明遇到的情况，包括所在宿舍楼、房号或具体诉求，方便同学或老师快速解答...'
                  : 'Опишите подробности проблемы, номер комнаты или кабинета, необходимые документы...'
              }
              className="w-full px-3 py-2 text-xs border border-campus-border bg-white text-campus-text focus:outline-none focus:ring-1 focus:ring-campus-action shadow-brutal-xs font-sans"
              required
            />
          </div>

          {/* Блок предложений AI-корректора */}
          {grammarResult && grammarResult.hasSuggestions && (
            <div className="p-3 bg-blue-50 border-2 border-blue-400 shadow-brutal-xs space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-blue-900">
                  <Wand2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isZh ? 'AI 发现拼写与用语优化建议：' : 'AI нашел опечатки и предлагает исправление:'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGrammarResult(null)}
                  className="text-[10px] font-mono text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  ✕ {isZh ? '忽略' : 'Скрыть'}
                </button>
              </div>

              <div className="space-y-1 text-xs text-blue-950 font-sans bg-white p-2 border border-blue-200">
                {grammarResult.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px] flex-wrap">
                    <span className="line-through text-red-500 bg-red-50 px-1 border border-red-200">{issue.original}</span>
                    <span>➔</span>
                    <span className="font-bold text-green-700 bg-green-50 px-1 border border-green-200">{issue.replacement}</span>
                    <span className="text-campus-subtle text-[10px]">({isZh ? issue.reasonZh : issue.reasonRu})</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleApplyGrammarFixes}
                  className="btn-action px-2.5 py-1 text-[11px] font-mono bg-blue-600 hover:bg-blue-700 text-white border-blue-800 flex items-center gap-1 cursor-pointer shadow-brutal-xs"
                >
                  <Check className="w-3 h-3" />
                  <span>{isZh ? '一键应用全部修正' : 'Применить исправления'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Теги */}
          <div>
            <label className="block text-xs font-mono font-bold text-campus-text uppercase mb-1">
              {isZh ? '标签 (多个标签用逗号隔开)' : 'Теги через запятую'}
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder={isZh ? '例如：门禁卡, 214室, 宿舍' : 'Например: Пропуск, Каб214, Общежитие'}
              className="w-full px-3 py-2 text-xs border border-campus-border bg-white text-campus-text focus:outline-none focus:ring-1 focus:ring-campus-action shadow-brutal-xs font-sans"
            />
          </div>

          {/* Кнопки внизу */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-campus-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline px-3.5 py-1.5 text-xs cursor-pointer"
            >
              {isZh ? '取消' : 'Отмена'}
            </button>
            <button
              type="submit"
              disabled={createPostMutation.isPending || !title.trim() || !content.trim()}
              className="btn-action flex items-center gap-1.5 px-4 py-1.5 text-xs disabled:opacity-50 cursor-pointer"
            >
              {createPostMutation.isPending ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>{isZh ? 'DeepSeek 正在翻译与同步...' : 'AI-Синхронизация...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isZh ? '确认发布' : 'Опубликовать'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
