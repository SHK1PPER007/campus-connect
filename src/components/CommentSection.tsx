import React, { useState } from 'react';
import { Send, ThumbsUp, Sparkles, Check, Globe, Volume2, Mic, MicOff } from 'lucide-react';
import { Comment, Language, User } from '../types/schema';
import { CURRENT_USER } from '../mock/mockData';
import { useAddCommentMutation, useToggleLikeCommentMutation } from '../services/postsApi';
import { speakCampusText } from '../utils/speechUtils';
import { startVoiceRecognition, stopVoiceRecognition, isVoiceInputSupported } from '../utils/voiceRecognition';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  defaultLanguage?: 'ru' | 'zh';
  currentUser?: User;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments,
  defaultLanguage = 'ru',
  currentUser = CURRENT_USER,
}) => {
  const [commentText, setCommentText] = useState('');
  const [replyLang, setReplyLang] = useState<Language>(currentUser?.nativeLang || defaultLanguage);
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const [isRecording, setIsRecording] = useState(false);

  React.useEffect(() => {
    if (currentUser?.nativeLang) {
      setReplyLang(currentUser.nativeLang);
    }
  }, [currentUser]);

  React.useEffect(() => {
    return () => {
      stopVoiceRecognition();
    };
  }, []);

  const handleToggleVoice = () => {
    if (!isVoiceInputSupported()) {
      alert(defaultLanguage === 'zh' ? '您的浏览器不支持语音输入' : 'Голосовой ввод не поддерживается в этом браузере');
      return;
    }

    if (isRecording) {
      stopVoiceRecognition();
      setIsRecording(false);
      return;
    }

    startVoiceRecognition({
      lang: replyLang,
      onStart: () => setIsRecording(true),
      onResult: (transcript) => {
        setCommentText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      },
      onError: () => setIsRecording(false),
      onEnd: () => setIsRecording(false),
    });
  };

  const addCommentMutation = useAddCommentMutation();
  const toggleLikeCommentMutation = useToggleLikeCommentMutation();

  const handleToggleCommentLike = (commentId: string) => {
    setLikedCommentIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
    toggleLikeCommentMutation.mutate({ postId, commentId });
  };

  const toggleCommentOriginal = (commentId: string) => {
    setShowOriginalMap((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || addCommentMutation.isPending) return;

    await addCommentMutation.mutateAsync({
      postId,
      content: commentText.trim(),
      author: currentUser,
      lang: replyLang,
    });

    setCommentText('');
  };

  return (
    <div className="mt-3.5 pt-3.5 border-t border-campus-border/60 bg-campus-bg/60 -mx-3.5 -mb-3.5 sm:-mx-5 sm:-mb-5 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2.5 text-xs font-mono">
        <span className="font-bold text-campus-text uppercase flex items-center gap-1.5">
          <span>{defaultLanguage === 'zh' ? '// 全部回帖' : '// Ответы'}</span>
          <span className="px-1.5 py-0.2 bg-campus-dark text-white text-[10px]">
            {comments.length}
          </span>
        </span>
        <span className="text-[10px] sm:text-[11px] text-campus-subtle">
          {defaultLanguage === 'zh' ? '双向智能同步' : 'AI-перевод'}
        </span>
      </div>

      {/* Список комментариев */}
      <div className="space-y-2.5 mb-3">
        {comments.map((comment) => {
          const isToggled = !!showOriginalMap[comment.id];
          const effectiveLang: 'ru' | 'zh' = isToggled
            ? defaultLanguage === 'ru' ? 'zh' : 'ru'
            : defaultLanguage;

          const isOriginal = comment.langOriginal === effectiveLang;
          const displayedText = isOriginal ? comment.contentOriginal : comment.contentTranslated;

          return (
            <div
              key={comment.id}
              className={`p-2.5 sm:p-3 border text-xs bg-white ${
                comment.isOfficialAnswer
                  ? 'border-campus-border shadow-brutal-xs bg-[#FFFDF0]'
                  : 'border-campus-border/60'
              }`}
            >
              {/* Шапка */}
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <div className="flex items-center space-x-1.5">
                  <img
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    className="w-5 h-5 border border-campus-border object-cover"
                  />
                  <span className="font-bold text-campus-text text-xs">
                    {effectiveLang === 'zh' && comment.author.nativeName
                      ? comment.author.nativeName
                      : comment.author.name}
                  </span>

                  {comment.author.role === 'curator' && (
                    <span className="badge-sticker-curator text-[9px] py-0 px-1">
                      {effectiveLang === 'zh' ? '辅导员' : 'Куратор'}
                    </span>
                  )}
                  {comment.author.role === 'admin' && (
                    <span className="badge-sticker-admin text-[9px] py-0 px-1">
                      {effectiveLang === 'zh' ? '管理员' : 'Администратор'}
                    </span>
                  )}
                  {comment.author.role === 'student' && (
                    <span className="badge-sticker text-[9px] py-0 px-1">
                      {comment.author.nativeLang === 'zh'
                        ? (effectiveLang === 'zh' ? '留学生' : 'Студент (Китай)')
                        : (effectiveLang === 'zh' ? '本地学生' : 'Студент (РФ)')}
                    </span>
                  )}

                  {comment.isOfficialAnswer && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold text-green-700 bg-green-100 px-1 border border-green-400">
                      <Check className="w-2.5 h-2.5 stroke-[3]" /> {effectiveLang === 'zh' ? '官方解答' : 'Ответ куратора'}
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-mono text-campus-subtle">
                  {comment.createdAt}
                </span>
              </div>

              {/* Текст */}
              <p className="text-campus-text text-xs sm:text-[13px] leading-relaxed mb-2 font-sans">
                {displayedText}
              </p>

              {/* Футер */}
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono pt-1 border-t border-campus-border/20">
                <button
                  type="button"
                  onClick={() => toggleCommentOriginal(comment.id)}
                  className="inline-flex items-center gap-1 text-campus-subtle hover:text-campus-action transition-colors cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>
                    {effectiveLang === 'ru'
                      ? (isOriginal ? 'Показать перевод на китайский (ZH)' : 'Показать оригинал автора (ZH)')
                      : (isOriginal ? '查看俄语译文 (RU)' : '查看作者俄语原文 (RU)')}
                  </span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => speakCampusText(displayedText, effectiveLang)}
                    className="inline-flex items-center text-campus-subtle hover:text-campus-action p-0.5 cursor-pointer"
                    title={effectiveLang === 'zh' ? '朗读回帖' : 'Озвучить ответ'}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleCommentLike(comment.id)}
                    className={`inline-flex items-center space-x-1 transition-colors px-1 py-0.5 border cursor-pointer ${
                      likedCommentIds.has(comment.id)
                        ? 'bg-red-50 text-red-600 border-red-300 font-bold'
                        : 'text-campus-subtle hover:text-campus-text border-transparent hover:border-campus-border/40'
                    }`}
                    title={effectiveLang === 'zh' ? '赞同' : 'Нравится'}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${likedCommentIds.has(comment.id) ? 'fill-current text-red-600' : ''}`} />
                    <span>{comment.likes + (likedCommentIds.has(comment.id) ? 1 : 0)}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {comments.length === 0 && (
          <div className="text-center py-3.5 border border-dashed border-campus-border/40 text-xs font-mono text-campus-subtle">
            {defaultLanguage === 'zh' ? '暂无回帖，欢迎留下第一个解答！' : 'Пока нет ответов. Напишите первое сообщение!'}
          </div>
        )}
      </div>

      {/* Форма ответа */}
      <form onSubmit={handleSendComment} className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono">
          <span className="text-campus-muted font-bold">
            {defaultLanguage === 'zh' ? '撰写回帖:' : 'Ваш ответ:'}
          </span>
          <div className="flex items-center space-x-1">
            <span className="text-campus-subtle">{defaultLanguage === 'zh' ? '语言:' : 'Язык:'}</span>
            <button
              type="button"
              onClick={() => setReplyLang(replyLang === 'zh' ? 'ru' : 'zh')}
              className="px-1.5 py-0.5 border border-campus-border font-bold bg-white hover:bg-campus-bg transition-colors cursor-pointer"
            >
              {replyLang === 'zh' ? '中文 (ZH)' : 'Русский (RU)'}
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 sm:gap-2 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                isRecording
                  ? (replyLang === 'zh' ? '录音中，请直接说话...' : 'Слушаю... Говорите в микрофон...')
                  : (replyLang === 'zh'
                    ? '写下您的建议或解答（系统自动翻译为俄语）...'
                    : 'Ответ на русском (автоперевод на китайский)...')
              }
              className={`w-full pl-2.5 pr-8 py-1.5 sm:py-2 text-xs border border-campus-border bg-white text-campus-text focus:outline-none focus:ring-1 focus:ring-campus-action shadow-brutal-xs font-sans ${
                isRecording ? 'border-red-500 bg-red-50 ring-1 ring-red-400' : ''
              }`}
            />
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 text-xs transition-colors cursor-pointer ${
                isRecording ? 'text-red-600 animate-pulse' : 'text-campus-action hover:text-campus-dark'
              }`}
              title={replyLang === 'zh' ? '点击开始语音输入' : 'Нажмите для голосового ввода'}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!commentText.trim() || addCommentMutation.isPending}
            className="btn-action px-3 py-1.5 text-xs flex items-center gap-1 disabled:opacity-50 flex-shrink-0 cursor-pointer"
          >
            {addCommentMutation.isPending ? (
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>{defaultLanguage === 'zh' ? '发送' : 'Отправить'}</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
