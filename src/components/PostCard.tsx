import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Globe,
  Pin,
  Eye,
  Building,
  FileText,
  UserCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Volume2,
  ThumbsUp,
  ClipboardCopy,
  Check,
  GitMerge,
  Award,
} from 'lucide-react';
import { Post, User } from '../types/schema';
import { CommentSection } from './CommentSection';
import { useResolveThreadMutation, useToggleLikePostMutation, useVoteQuestionMutation } from '../services/postsApi';
import { speakCampusText } from '../utils/speechUtils';
import { useToast } from './Toast';

interface PostCardProps {
  post: Post;
  userPreferredLang?: 'ru' | 'zh';
  currentUser?: User;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  userPreferredLang = 'ru',
  currentUser,
}) => {
  const [isToggledLocally, setIsToggledLocally] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [mergedQuestionsExpanded, setMergedQuestionsExpanded] = useState(false);
  const [summaryLang, setSummaryLang] = useState<'bilingual' | 'ru' | 'zh'>('bilingual');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [copiedLang, setCopiedLang] = useState<'bilingual' | 'ru' | 'zh' | null>(null);

  const toggleLikeMutation = useToggleLikePostMutation();
  const voteMutation = useVoteQuestionMutation();
  const [voted, setVoted] = useState(false);
  const [communityVotes, setCommunityVotes] = useState(post.communityVotes || 0);
  const { showToast } = useToast();

  useEffect(() => {
    setIsToggledLocally(false);
  }, [userPreferredLang]);

  useEffect(() => {
    setLikesCount(post.likes || 0);
  }, [post.likes]);

  useEffect(() => {
    setCommunityVotes(post.communityVotes || 0);
  }, [post.communityVotes]);

  const resolveMutation = useResolveThreadMutation();

  const author = post.author;
  const aiSummary = post.aiSummary;

  const effectiveLang: 'ru' | 'zh' = isToggledLocally
    ? userPreferredLang === 'ru'
      ? 'zh'
      : 'ru'
    : userPreferredLang;

  const isDisplayingOriginal = post.langOriginal === effectiveLang;
  const displayTitle = isDisplayingOriginal ? post.titleOriginal : post.titleTranslated;
  const displayContent = isDisplayingOriginal ? post.contentOriginal : post.contentTranslated;

  const renderRoleBadge = () => {
    switch (author.role) {
      case 'curator':
        return (
          <span className="badge-sticker-curator">
            {effectiveLang === 'zh' ? '辅导员' : 'Куратор'}
          </span>
        );
      case 'admin':
        return (
          <span className="badge-sticker-admin">
            {effectiveLang === 'zh' ? '管理员' : 'Администратор'}
          </span>
        );
      case 'student':
      default:
        return (
          <span className="badge-sticker">
            {author.nativeLang === 'zh'
              ? (effectiveLang === 'zh' ? '留学生' : 'Студент (Китай)')
              : (effectiveLang === 'zh' ? '本地学生' : 'Студент (РФ)')}
          </span>
        );
    }
  };

  const getToggleBtnText = () => {
    if (effectiveLang === 'ru') {
      return isDisplayingOriginal
        ? 'Показать перевод на китайский (ZH)'
        : 'Показать оригинал автора (ZH)';
    } else {
      return isDisplayingOriginal
        ? '查看俄语译文 (RU)'
        : '查看作者俄语原文 (RU)';
    }
  };

  const handleTriggerAiSummary = async () => {
    if (resolveMutation.isPending) return;
    await resolveMutation.mutateAsync(post.id);
  };

  const handleCopyCheatSheet = (targetLang: 'bilingual' | 'ru' | 'zh') => {
    if (!post.aiSummary) return;
    const summary = post.aiSummary;

    if (targetLang === 'bilingual') {
      const titleRu = post.langOriginal === 'ru' ? post.titleOriginal : post.titleTranslated;
      const titleZh = post.langOriginal === 'zh' ? post.titleOriginal : post.titleTranslated;

      const steps = summary.keySteps.map((s, i) => {
        const zh = summary.keyStepsZh?.[i] ? `\n   [ZH] ${summary.keyStepsZh[i]}` : '';
        return `${i + 1}. [RU] ${s}${zh}`;
      }).join('\n');

      const locRu = summary.locationOrOffice;
      const locZh = summary.locationOrOfficeZh;
      const loc = locRu || locZh ? `Кабинет / 地点: ${[locRu, locZh].filter(Boolean).join(' • ')}` : '';

      const contactRu = summary.contactPerson;
      const contactZh = summary.contactPersonZh;
      const contact = contactRu || contactZh ? `Контакт / 联系人: ${[contactRu, contactZh].filter(Boolean).join(' • ')}` : '';

      const docsRu = summary.documentsRequired?.join(', ');
      const docsZh = summary.documentsRequiredZh?.join('、');
      const docs = docsRu || docsZh ? `Документы / 所需材料: ${[docsRu, docsZh].filter(Boolean).join(' • ')}` : '';

      const textToCopy = `[Campus.Connect 双语办事备忘录 // Билингвальная памятка]\n` +
        `Вопрос / 问题: ${titleRu} // ${titleZh}\n\n` +
        `[RU] Решение: ${summary.quickAnswer}\n` +
        `[ZH] 核心解答: ${summary.quickAnswerZh || summary.quickAnswer}\n\n` +
        `Шаги / 办理步骤:\n${steps}\n\n` +
        `${[loc, contact, docs].filter(Boolean).join('\n')}\n\n` +
        `---\nCampus.Connect 校园双语智能互通平台`;

      navigator.clipboard.writeText(textToCopy);
      setCopiedLang('bilingual');
      setTimeout(() => setCopiedLang(null), 2500);

      showToast({
        message: effectiveLang === 'zh' ? '已复制双语完整备忘录！' : 'Двуязычная памятка скопирована!',
        subMessage: effectiveLang === 'zh' ? '包含俄语与中文对照' : 'Включает русский и китайский текст',
        type: 'success',
      });
      return;
    }

    const isZh = targetLang === 'zh';
    
    const cleanTitle = isZh
      ? (post.langOriginal === 'zh' ? post.titleOriginal : post.titleTranslated)
      : (post.langOriginal === 'ru' ? post.titleOriginal : post.titleTranslated);

    const quickAns = isZh
      ? (summary.quickAnswerZh || summary.quickAnswer)
      : summary.quickAnswer;

    const stepsList = isZh
      ? (summary.keyStepsZh || summary.keySteps)
      : summary.keySteps;

    const steps = stepsList.map((s, i) => `${i + 1}. ${s}`).join('\n');

    const officeVal = isZh ? (summary.locationOrOfficeZh || summary.locationOrOffice) : summary.locationOrOffice;
    const loc = officeVal ? (isZh ? `地点: ${officeVal}` : `Кабинет: ${officeVal}`) : '';

    const contactVal = isZh ? (summary.contactPersonZh || summary.contactPerson) : summary.contactPerson;
    const contact = contactVal ? (isZh ? `联系人: ${contactVal}` : `Контакт: ${contactVal}`) : '';

    const docsList = isZh ? (summary.documentsRequiredZh || summary.documentsRequired) : summary.documentsRequired;
    const docs = docsList && docsList.length > 0
      ? (isZh ? `所需材料: ${docsList.join('、')}` : `Документы: ${docsList.join(', ')}`)
      : '';

    const textToCopy = isZh
      ? `[Campus.Connect 办事备忘录]\n问题: ${cleanTitle}\n核心解答: ${quickAns}\n\n办理步骤:\n${steps}\n\n${[loc, contact, docs].filter(Boolean).join('\n')}\n\n---\n来源: 校园双语智能互通平台`
      : `[Campus.Connect Памятка для визита]\nВопрос: ${cleanTitle}\nРешение: ${quickAns}\n\nШаги:\n${steps}\n\n${[loc, contact, docs].filter(Boolean).join('\n')}\n\n---\nИсточник: Билингвальный кампус-мост`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedLang(targetLang);
    setTimeout(() => setCopiedLang(null), 2500);

    showToast({
      message: isZh ? '办事备忘录已复制！' : 'Памятка скопирована!',
      subMessage: isZh ? '可直接发送至微信群或好友' : 'Готово для отправки в Telegram или печати',
      type: 'success',
    });
  };

  const handleToggleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    try {
      await toggleLikeMutation.mutateAsync(post.id);
    } catch (e) {
      setLiked(!nextLiked);
      setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleVoteForWiki = async () => {
    if (voted || voteMutation.isPending || post.status === 'wiki_promoted') return;
    setVoted(true);
    setCommunityVotes((prev) => prev + 1);
    try {
      const res = await voteMutation.mutateAsync(post.id);
      if (res?.status === 'wiki_promoted') {
        showToast({
          message: effectiveLang === 'zh' ? '达到3票！已自动收录入知识库！' : '3 голоса! Вопрос перенесен в Базу Знаний!',
          subMessage: effectiveLang === 'zh' ? '已生成双语标准百科词条' : 'Создана статья в энциклопедии',
          type: 'success',
        });
      } else {
        const remaining = Math.max(0, 3 - (communityVotes + 1));
        showToast({
          message: effectiveLang === 'zh' ? '投票成功！' : 'Ваш голос принят!',
          subMessage: effectiveLang === 'zh' ? `距收录进知识库还需 ${remaining} 票` : `До переноса в Базу Знаний осталось голосов: ${remaining}`,
          type: 'success',
        });
      }
    } catch (e) {
      setVoted(false);
      setCommunityVotes((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <article className="brutal-card p-3.5 sm:p-5 mb-4 transition-all">
      
      {/* Шапка */}
      <div className="flex items-start justify-between gap-2.5 mb-2.5">
        <div className="flex items-center space-x-2.5 min-w-0">
          <img
            src={author.avatar}
            alt={author.name}
            className="w-9 h-9 sm:w-10 sm:h-10 border border-campus-border object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-campus-text truncate">
                {effectiveLang === 'zh' && author.nativeName ? author.nativeName : author.name}
              </span>
              {renderRoleBadge()}
            </div>
            <div className="text-[10px] sm:text-[11px] font-mono text-campus-subtle flex items-center gap-1.5 mt-0.5">
              <span>{post.createdAt}</span>
              {author.dormitoryInfo && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[140px] sm:max-w-none">
                    {effectiveLang === 'zh'
                      ? author.dormitoryInfo.replace('Общежитие №', '').replace('комн.', '室')
                      : author.dormitoryInfo}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Статусы */}
        <div className="flex items-center space-x-1 flex-shrink-0 flex-wrap justify-end gap-1">
          {post.pinned && (
            <span className="badge-sticker bg-[#FFE700] text-black text-[9px] sm:text-[10px] flex items-center gap-0.5">
              <Pin className="w-2.5 h-2.5 fill-current" /> {effectiveLang === 'zh' ? '置顶' : 'ВАЖНО'}
            </span>
          )}

          {(post.status === 'wiki_promoted' || (post.communityVotes || 0) >= 3) && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-500 shadow-brutal-xs">
              <Award className="w-3 h-3 text-amber-700" />
              <span>{effectiveLang === 'zh' ? '⭐ 社区精选入库' : '⭐ В Базе Знаний'}</span>
            </span>
          )}

          {post.mergedQuestions && post.mergedQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => setMergedQuestionsExpanded(!mergedQuestionsExpanded)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] sm:text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-600 shadow-brutal-xs hover:bg-amber-200 transition-colors cursor-pointer"
              title={effectiveLang === 'zh' ? '点击查看已合并的相关问题' : 'Нажмите, чтобы просмотреть объединенные вопросы'}
            >
              <GitMerge className="w-3 h-3 text-amber-700" />
              <span>{effectiveLang === 'zh' ? `+${post.mergedQuestions.length} 相似合并` : `+${post.mergedQuestions.length} объед.`}</span>
            </button>
          )}

          {post.isResolved ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] sm:text-xs font-mono font-bold bg-green-100 text-green-900 border border-green-700 shadow-brutal-xs">
              <CheckCircle2 className="w-3 h-3 text-green-700" />
              <span>{effectiveLang === 'zh' ? '已解决 (AI)' : 'РЕШЕНО (AI)'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] sm:text-xs font-mono font-medium bg-campus-bg text-campus-muted border border-campus-border">
              {effectiveLang === 'zh' ? '讨论中' : 'ОБСУЖДЕНИЕ'}
            </span>
          )}
        </div>
      </div>

      {/* Теги */}
      <div className="flex flex-wrap gap-1 mb-2">
        {post.tags.map((tag, idx) => (
          <span
            key={idx}
            className="text-[10px] font-mono px-1.5 py-0.2 bg-campus-tag border border-campus-border/50 text-campus-text"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Заголовок */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-extrabold text-sm sm:text-base text-campus-text tracking-tight font-sans leading-snug">
          {displayTitle}
        </h3>
        <button
          type="button"
          onClick={() => speakCampusText(displayTitle, effectiveLang)}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono border border-campus-border/60 bg-white hover:bg-campus-bg text-campus-subtle hover:text-campus-text transition-colors flex-shrink-0 shadow-brutal-xs cursor-pointer"
          title={effectiveLang === 'zh' ? '点击朗读标题' : 'Озвучить заголовок'}
        >
          <Volume2 className="w-3.5 h-3.5 text-campus-action" />
          <span>{effectiveLang === 'zh' ? '朗读' : 'Озвучить'}</span>
        </button>
      </div>

      {/* Сжатая суть от ИИ (если сгенерирована) */}
      {post.aiEssence && (
        <div className="mb-2.5 p-2 bg-blue-50/70 border border-blue-200 text-xs font-mono text-blue-950 flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{effectiveLang === 'zh' ? 'AI 核心提炼：' : 'Суть вопроса (ИИ): '}</span>
            <span className="font-sans text-campus-text">{post.aiEssence}</span>
          </div>
        </div>
      )}

      {/* Текст поста */}
      <div className="text-xs sm:text-sm text-campus-text leading-relaxed font-sans mb-3 whitespace-pre-line">
        {displayContent}
      </div>

      {/* Тумблер перевода */}
      <div className="mb-3.5">
        <button
          type="button"
          onClick={() => setIsToggledLocally(!isToggledLocally)}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-mono font-bold border border-campus-border bg-white shadow-brutal-xs hover:bg-campus-bg active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-campus-action" />
          <span>{getToggleBtnText()}</span>
          <span className="text-[10px] text-campus-subtle font-normal ml-1">
            [{isDisplayingOriginal ? (effectiveLang === 'zh' ? '原文' : 'Оригинал') : (effectiveLang === 'zh' ? 'AI 译文' : 'AI-Перевод')}]
          </span>
        </button>
      </div>

      {/* Индикатор AI-анализа */}
      {resolveMutation.isPending && (
        <div className="my-3.5 border-2 border-campus-ai bg-campus-ai/10 p-3 sm:p-4 shadow-brutal-xs flex items-center space-x-3 animate-pulse font-mono text-xs text-campus-ai">
          <Sparkles className="w-5 h-5 animate-spin flex-shrink-0 text-campus-ai" />
          <div className="min-w-0">
            <div className="font-bold uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
              <span>{effectiveLang === 'zh' ? 'DeepSeek-V4 正在分析问答...' : 'DeepSeek-V4 анализирует тред...'}</span>
              <span className="badge-sticker bg-campus-ai text-white text-[9px] py-0 px-1">LIVE HF API</span>
            </div>
            <div className="text-[11px] text-campus-subtle mt-0.5">
              {effectiveLang === 'zh' ? '正在提取核心解答、办理科室与所需材料清单...' : 'Извлечение шагов решения, номеров кабинетов и списка документов...'}
            </div>
          </div>
        </div>
      )}

      {/* Ошибка AI-анализа */}
      {resolveMutation.isError && (
        <div className="my-3.5 border-2 border-red-500 bg-red-50 p-3 text-xs font-mono text-red-900 flex items-center justify-between gap-2">
          <span>{resolveMutation.error?.message || (effectiveLang === 'zh' ? 'AI 分析失败，请重试' : 'Ошибка генерации AI-итога')}</span>
          <button onClick={handleTriggerAiSummary} className="underline font-bold hover:text-red-700 cursor-pointer">
            {effectiveLang === 'zh' ? '重试' : 'Повторить'}
          </button>
        </div>
      )}

      {/* Блок "AI ИТОГ" */}
      {post.isResolved && aiSummary && (
        <div className="my-3.5 border-2 border-campus-ai bg-campus-ai-subtle p-3 sm:p-4 shadow-brutal-ai relative">
          
          {/* Шапка AI-итога */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-campus-ai/30 pb-2 mb-2.5">
            <div className="flex items-center space-x-1.5">
              <span className="p-1 bg-campus-ai text-white">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="font-mono font-black text-xs uppercase tracking-wide text-campus-ai">
                  {summaryLang === 'zh'
                    ? 'AI 智能解决方案'
                    : summaryLang === 'ru'
                    ? 'AI-Итог решения'
                    : (effectiveLang === 'zh' ? 'AI 双语解决方案 (RU + ZH)' : 'AI-Итог решения (RU + ZH)')}
                </span>
                <span className="inline-block ml-2 text-[10px] font-mono font-bold bg-campus-ai/20 text-campus-ai px-1.5 py-0.2 border border-campus-ai/40">
                  {aiSummary.modelUsed}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-[10px] font-mono">
              <button
                type="button"
                onClick={handleTriggerAiSummary}
                disabled={resolveMutation.isPending}
                title={effectiveLang === 'zh' ? '重新生成双语分析' : 'Повторно сгенерировать двуязычный анализ'}
                className="inline-flex items-center gap-1 px-2 py-0.5 border border-campus-ai bg-white hover:bg-campus-ai-subtle text-campus-ai font-bold transition-colors disabled:opacity-50 shadow-brutal-xs cursor-pointer"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${resolveMutation.isPending ? 'animate-spin' : ''}`} />
                <span>{effectiveLang === 'zh' ? '重新分析' : 'Обновить анализ'}</span>
              </button>

              <div className="flex items-center space-x-0.5">
                <button
                  type="button"
                  onClick={() => setSummaryLang('bilingual')}
                  className={`px-1.5 py-0.5 border cursor-pointer font-bold transition-colors ${
                    summaryLang === 'bilingual'
                      ? 'bg-campus-ai text-white border-campus-ai shadow-brutal-xs'
                      : 'bg-white text-campus-text border-campus-border hover:bg-campus-bg'
                  }`}
                  title={effectiveLang === 'zh' ? '双语对照' : 'Двуязычный режим'}
                >
                  RU + ZH
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryLang('ru')}
                  className={`px-1.5 py-0.5 border cursor-pointer font-bold transition-colors ${
                    summaryLang === 'ru'
                      ? 'bg-campus-ai text-white border-campus-ai shadow-brutal-xs'
                      : 'bg-white text-campus-text border-campus-border hover:bg-campus-bg'
                  }`}
                  title="Только на русском"
                >
                  RU
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryLang('zh')}
                  className={`px-1.5 py-0.5 border cursor-pointer font-bold transition-colors ${
                    summaryLang === 'zh'
                      ? 'bg-campus-ai text-white border-campus-ai shadow-brutal-xs'
                      : 'bg-white text-campus-text border-campus-border hover:bg-campus-bg'
                  }`}
                  title="仅中文显示"
                >
                  ZH
                </button>
              </div>
            </div>
          </div>

          {/* Быстрый ответ */}
          <div className="bg-white border border-campus-ai/40 p-2.5 mb-2.5">
            <span className="text-[10px] font-mono font-bold text-campus-ai uppercase block mb-1">
              {summaryLang === 'zh'
                ? '// 快速解答 (一句话结论):'
                : summaryLang === 'ru'
                ? '// Суть решения (Быстрый ответ):'
                : '// Суть решения // 快速解答 (RU + ZH):'}
            </span>
            {summaryLang === 'bilingual' ? (
              <div className="space-y-1.5">
                <div className="flex items-start gap-1.5">
                  <span className="text-[9px] font-mono font-bold bg-campus-dark text-white px-1 py-0.2 select-none flex-shrink-0 mt-0.5">
                    RU
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-campus-text font-sans leading-snug">
                    {aiSummary.quickAnswer}
                  </p>
                </div>
                <div className="flex items-start gap-1.5 pt-1 border-t border-campus-border/30">
                  <span className="text-[9px] font-mono font-bold bg-campus-action text-white px-1 py-0.2 select-none flex-shrink-0 mt-0.5">
                    ZH
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-campus-text font-sans leading-snug">
                    {aiSummary.quickAnswerZh || aiSummary.quickAnswer}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm font-bold text-campus-text font-sans">
                {summaryLang === 'zh' && aiSummary.quickAnswerZh
                  ? aiSummary.quickAnswerZh
                  : aiSummary.quickAnswer}
              </p>
            )}
          </div>

          {/* Шаги */}
          <div className="space-y-1 mb-2.5">
            <span className="text-[10px] font-mono font-bold text-campus-text uppercase block mb-1">
              {summaryLang === 'zh'
                ? '// 办理步骤:'
                : summaryLang === 'ru'
                ? '// Алгоритм действий:'
                : '// Алгоритм действий // 办理步骤 (RU + ZH):'}
            </span>
            {summaryLang === 'bilingual' ? (
              <ul className="space-y-1.5 text-xs text-campus-text font-sans">
                {aiSummary.keySteps.map((stepRu, idx) => {
                  const stepZh = aiSummary.keyStepsZh?.[idx];
                  return (
                    <li key={idx} className="bg-white/90 p-2 border border-campus-ai/20 shadow-brutal-xs space-y-1">
                      <div className="flex items-start space-x-1.5">
                        <span className="font-mono font-bold text-campus-ai text-[11px] select-none flex-shrink-0">
                          [{idx + 1}]
                        </span>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start gap-1 text-campus-text">
                            <span className="text-[9px] font-mono font-bold text-campus-subtle select-none">RU:</span>
                            <span className="font-medium">{stepRu}</span>
                          </div>
                          {stepZh && (
                            <div className="flex items-start gap-1 text-campus-text/90 pt-1 border-t border-campus-border/30">
                              <span className="text-[9px] font-mono font-bold text-campus-action select-none">ZH:</span>
                              <span className="font-sans">{stepZh}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="space-y-1 text-xs text-campus-text font-sans">
                {(summaryLang === 'zh' && aiSummary.keyStepsZh
                  ? aiSummary.keyStepsZh
                  : aiSummary.keySteps
                ).map((step, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5 bg-white/80 p-1.5 border border-campus-ai/20">
                    <span className="font-mono font-bold text-campus-ai text-[11px] select-none">
                      [{idx + 1}]
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Локация и контакты */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 border-t border-campus-ai/30 text-xs font-mono">
            {aiSummary.locationOrOffice && (
              <div className="flex items-start space-x-1.5 text-campus-text bg-white/70 p-1.5 border border-campus-ai/20">
                <Building className="w-3.5 h-3.5 text-campus-ai flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-campus-subtle text-[10px] block">
                    {summaryLang === 'zh' ? '地点:' : summaryLang === 'ru' ? 'Кабинет:' : 'Кабинет / 地点:'}
                  </span>
                  {summaryLang === 'bilingual' ? (
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs truncate">
                        <span className="text-[9px] text-campus-subtle mr-1">RU:</span>
                        {aiSummary.locationOrOffice}
                      </div>
                      {aiSummary.locationOrOfficeZh && (
                        <div className="text-[11px] text-campus-muted truncate">
                          <span className="text-[9px] text-campus-action font-bold mr-1">ZH:</span>
                          {aiSummary.locationOrOfficeZh}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="truncate block font-bold">
                      {summaryLang === 'zh'
                        ? aiSummary.locationOrOfficeZh || aiSummary.locationOrOffice
                        : aiSummary.locationOrOffice}
                    </span>
                  )}
                </div>
              </div>
            )}

            {aiSummary.contactPerson && (
              <div className="flex items-start space-x-1.5 text-campus-text bg-white/70 p-1.5 border border-campus-ai/20">
                <UserCheck className="w-3.5 h-3.5 text-campus-ai flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-campus-subtle text-[10px] block">
                    {summaryLang === 'zh' ? '联系人:' : summaryLang === 'ru' ? 'Контакт:' : 'Контакт / 联系人:'}
                  </span>
                  {summaryLang === 'bilingual' ? (
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs truncate">
                        <span className="text-[9px] text-campus-subtle mr-1">RU:</span>
                        {aiSummary.contactPerson}
                      </div>
                      {aiSummary.contactPersonZh && (
                        <div className="text-[11px] text-campus-muted truncate">
                          <span className="text-[9px] text-campus-action font-bold mr-1">ZH:</span>
                          {aiSummary.contactPersonZh}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="truncate block font-bold">
                      {summaryLang === 'zh'
                        ? aiSummary.contactPersonZh || aiSummary.contactPerson
                        : aiSummary.contactPerson}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {aiSummary.documentsRequired && aiSummary.documentsRequired.length > 0 && (
            <div className="mt-1.5 text-xs font-mono bg-white/70 p-1.5 border border-campus-ai/20 flex items-start space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-campus-ai flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <strong className="text-campus-subtle text-[10px] uppercase block mb-0.5">
                  {summaryLang === 'zh' ? '所需材料:' : summaryLang === 'ru' ? 'Документы:' : 'Документы / 所需材料:'}
                </strong>
                {summaryLang === 'bilingual' ? (
                  <div className="space-y-0.5 text-[11px]">
                    <div className="text-campus-text">
                      <span className="text-[9px] text-campus-subtle font-bold mr-1">RU:</span>
                      {aiSummary.documentsRequired.join(', ')}
                    </div>
                    {aiSummary.documentsRequiredZh && (
                      <div className="text-campus-text">
                        <span className="text-[9px] text-campus-action font-bold mr-1">ZH:</span>
                        {aiSummary.documentsRequiredZh.join('、')}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-campus-text">
                    {summaryLang === 'zh'
                      ? (aiSummary.documentsRequiredZh || aiSummary.documentsRequired)?.join('、')
                      : aiSummary.documentsRequired?.join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Кнопки копирования памятки */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 mt-2.5">
            <button
              type="button"
              onClick={() => handleCopyCheatSheet('bilingual')}
              className="py-1.5 px-2 bg-campus-ai hover:bg-campus-ai-hover text-white border border-campus-ai font-mono font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-brutal-xs transition-colors cursor-pointer"
              title={effectiveLang === 'zh' ? '复制俄中双语完整备忘录' : 'Скопировать полную двуязычную памятку (RU + ZH)'}
            >
              {copiedLang === 'bilingual' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  <span className="font-bold">{effectiveLang === 'zh' ? '已复制双语！' : 'Скопировано!'}</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="w-3.5 h-3.5 text-white" />
                  <span>{effectiveLang === 'zh' ? '双语备忘录' : 'Двуязычная памятка'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleCopyCheatSheet('ru')}
              className="py-1.5 px-2 bg-white hover:bg-campus-bg text-campus-text border border-campus-border font-mono font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-brutal-xs transition-colors cursor-pointer"
              title={effectiveLang === 'zh' ? '复制俄语备忘录，出示给办公室人员' : 'Скопировать памятку на русском'}
            >
              {copiedLang === 'ru' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />
                  <span className="text-green-700 font-bold">{effectiveLang === 'zh' ? '已复制俄语！' : 'Скопировано (RU)!'}</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="w-3.5 h-3.5 text-campus-action" />
                  <span>{effectiveLang === 'zh' ? '俄语版 (出示给窗口)' : 'Памятка (RU)'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleCopyCheatSheet('zh')}
              className="py-1.5 px-2 bg-white hover:bg-campus-bg text-campus-text border border-campus-border font-mono font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-brutal-xs transition-colors cursor-pointer"
              title={effectiveLang === 'zh' ? '复制中文备忘录，方便在微信群交流' : 'Скопировать памятку на китайском для WeChat'}
            >
              {copiedLang === 'zh' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />
                  <span className="text-green-700 font-bold">{effectiveLang === 'zh' ? '已复制微信版！' : 'Скопировано (ZH)!'}</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="w-3.5 h-3.5 text-campus-ai" />
                  <span>{effectiveLang === 'zh' ? '微信版 (ZH)' : 'Памятка (ZH)'}</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* Блок объединенных схожих вопросов */}
      {post.mergedQuestions && post.mergedQuestions.length > 0 && (
        <div className="mb-3 border border-amber-300 bg-amber-50/50 p-2.5 space-y-2">
          <button
            type="button"
            onClick={() => setMergedQuestionsExpanded(!mergedQuestionsExpanded)}
            className="w-full flex items-center justify-between font-mono text-xs font-bold text-amber-900 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <GitMerge className="w-3.5 h-3.5 text-amber-700" />
              <span>
                {effectiveLang === 'zh'
                  ? `已合并关联问题 (${post.mergedQuestions.length})`
                  : `Связанные и объединенные вопросы студентов (${post.mergedQuestions.length})`}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-800">
              <span>
                {mergedQuestionsExpanded
                  ? (effectiveLang === 'zh' ? '收起' : 'Скрыть')
                  : (effectiveLang === 'zh' ? '展开查看' : 'Показать')}
              </span>
              {mergedQuestionsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {mergedQuestionsExpanded && (
            <div className="space-y-2 pt-2 border-t border-amber-200/80 animate-in fade-in duration-150">
              {post.mergedQuestions.map((q) => (
                <div key={q.id} className="p-2 bg-white border border-amber-200 text-xs shadow-brutal-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-campus-subtle">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={q.authorAvatar}
                        alt={q.authorName}
                        className="w-4 h-4 border border-campus-border object-cover"
                      />
                      <span className="font-bold text-campus-text">{q.authorName}</span>
                      <span className="badge-sticker text-[9px] py-0 px-1">
                        {q.authorRole === 'curator' ? (effectiveLang === 'zh' ? '辅导员' : 'Куратор') : (effectiveLang === 'zh' ? '学生' : 'Студент')}
                      </span>
                    </div>
                    <span>{q.mergedAt}</span>
                  </div>
                  <div className="font-bold text-campus-text font-sans">{q.title}</div>
                  <div className="text-campus-subtle text-[11px] font-sans line-clamp-2">{q.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Футер */}
      <div className="flex items-center justify-between pt-2.5 border-t border-campus-border text-xs font-mono">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleToggleLike}
            className={`btn-outline flex items-center gap-1 text-xs py-1 transition-all cursor-pointer ${
              liked
                ? 'bg-red-50 text-red-600 border-red-400 font-bold'
                : 'text-campus-text hover:bg-campus-bg'
            }`}
            title={effectiveLang === 'zh' ? '有用' : 'Полезно'}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${liked ? 'fill-current text-red-600' : ''}`} />
            <span>{likesCount}</span>
          </button>

          {/* Народное голосование за перенос в Базу Знаний */}
          {post.status === 'wiki_promoted' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-1 bg-amber-100 text-amber-900 border border-amber-500 shadow-brutal-xs">
              <Award className="w-3.5 h-3.5 text-amber-700" />
              <span>{effectiveLang === 'zh' ? `已入知识库 (${communityVotes}票)` : `В Базе Знаний (${communityVotes})`}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleVoteForWiki}
              disabled={voted || voteMutation.isPending}
              className={`btn-outline flex items-center gap-1 text-xs py-1 px-2 cursor-pointer transition-all ${
                voted
                  ? 'bg-amber-100 text-amber-900 border-amber-500 font-bold'
                  : 'text-campus-text hover:bg-amber-50 hover:border-amber-400'
              }`}
              title={effectiveLang === 'zh' ? '推选入知识库（满3票自动收录）' : 'Голос за включение в Базу Знаний (при 3 голосах)'}
            >
              <Award className={`w-3.5 h-3.5 ${voted ? 'text-amber-700' : 'text-amber-600'}`} />
              <span>
                {effectiveLang === 'zh'
                  ? (voted ? `已投票 (${communityVotes}/3)` : `推入百科 (${communityVotes}/3)`)
                  : (voted ? `Голос учтен (${communityVotes}/3)` : `В Базу Знаний (${communityVotes}/3)`)}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setCommentsExpanded(!commentsExpanded)}
            className="btn-outline flex items-center gap-1 text-xs py-1 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{effectiveLang === 'zh' ? `回复 (${post.commentsCount})` : `Ответы (${post.commentsCount})`}</span>
            {commentsExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {!post.isResolved && (
            <button
              type="button"
              onClick={handleTriggerAiSummary}
              disabled={resolveMutation.isPending}
              className="btn-ai flex items-center gap-1.5 text-xs py-1 px-2.5 disabled:opacity-50 font-bold shadow-brutal-xs cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${resolveMutation.isPending ? 'animate-spin' : ''}`} />
              <span>
                {resolveMutation.isPending
                  ? (effectiveLang === 'zh' ? 'AI 正在分析...' : 'AI анализирует...')
                  : (effectiveLang === 'zh' ? 'DeepSeek 智能解答' : 'AI-анализ треда')}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-1 text-campus-subtle text-[11px]">
          <Eye className="w-3.5 h-3.5" />
          <span>{post.views}</span>
        </div>
      </div>

      {/* Ветка комментариев */}
      {commentsExpanded && (
        <CommentSection
          postId={post.id}
          comments={post.comments}
          defaultLanguage={effectiveLang}
          currentUser={currentUser}
        />
      )}

    </article>
  );
};
