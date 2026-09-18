import React, { useState } from 'react';
import { X, Search, BookOpen, Building, Check, Copy, Volume2 } from 'lucide-react';
import { CAMPUS_GLOSSARY } from '../services/aiServices';
import { GlossaryItem } from '../types/schema';
import { speakCampusText } from '../utils/speechUtils';
import { useToast } from './Toast';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLanguage?: 'ru' | 'zh';
}

export const GlossaryModal: React.FC<GlossaryModalProps> = ({
  isOpen,
  onClose,
  activeLanguage = 'ru',
}) => {
  const [search, setSearch] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const isZh = activeLanguage === 'zh';

  const filteredItems = CAMPUS_GLOSSARY.filter(
    (item) =>
      item.ru.toLowerCase().includes(search.toLowerCase()) ||
      item.zh.includes(search) ||
      item.pinyin.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (item: GlossaryItem, index: number) => {
    navigator.clipboard.writeText(`${item.zh} = ${item.ru} (${item.pinyin})`);
    setCopiedIndex(index);
    showToast({
      message: isZh ? '词汇已复制到剪贴板！' : 'Термин скопирован в буфер!',
      subMessage: `${item.zh} ⇋ ${item.ru}`,
      type: 'success',
      duration: 2500,
    });
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-campus-surface border-2 border-campus-border shadow-brutal-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Шапка */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-campus-border bg-campus-bg flex-shrink-0">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-campus-action" />
            <div>
              <h2 className="font-mono font-black text-xs sm:text-sm uppercase tracking-tight text-campus-text">
                {isZh ? '校园生活高频术语词汇表' : 'Кампусный глоссарий терминов'}
              </h2>
              <p className="text-[10px] font-mono text-campus-subtle">
                {isZh ? '留学生高频办事、教学与生活专用词汇对照' : 'Нормативный словарь кампуса для синхронного перевода'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-campus-surface border border-transparent hover:border-campus-border transition-colors cursor-pointer"
            title={isZh ? '关闭' : 'Закрыть'}
          >
            <X className="w-4 h-4 text-campus-text" />
          </button>
        </div>

        {/* Поиск */}
        <div className="p-3 sm:p-4 border-b border-campus-border bg-white flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-campus-subtle" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isZh
                  ? '搜索中文或俄语词汇 (辅导员, 门禁卡, зачетка, куратор)...'
                  : 'Поиск термина (куратор, зачетка, пропуск, 宿舍)...'
              }
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs font-mono border border-campus-border bg-campus-bg text-campus-text focus:outline-none focus:ring-1 focus:ring-campus-action shadow-brutal-xs"
              autoFocus
            />
          </div>
        </div>

        {/* Список */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 bg-campus-bg">
          {filteredItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-white border border-campus-border shadow-brutal-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {isZh ? (
                    <>
                      <span className="font-bold text-sm text-campus-action font-sans flex items-center gap-1">
                        <span>{item.zh}</span>
                        <button
                          type="button"
                          onClick={() => speakCampusText(item.zh, 'zh')}
                          title="收听中文发音"
                          className="p-0.5 text-campus-subtle hover:text-campus-action transition-colors cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                      <span className="text-[11px] font-mono text-campus-muted px-1 py-0.2 bg-campus-bg border border-campus-border/40">
                        [{item.pinyin}]
                      </span>
                      <span className="text-campus-subtle font-mono text-xs">⇋</span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-campus-text flex items-center gap-1">
                        <span>{item.ru}</span>
                        <button
                          type="button"
                          onClick={() => speakCampusText(item.ru, 'ru')}
                          title="收听俄语发音"
                          className="p-0.5 text-campus-subtle hover:text-campus-action transition-colors cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono font-bold text-xs sm:text-sm text-campus-text flex items-center gap-1">
                        <span>{item.ru}</span>
                        <button
                          type="button"
                          onClick={() => speakCampusText(item.ru, 'ru')}
                          title="Прослушать русское произношение"
                          className="p-0.5 text-campus-subtle hover:text-campus-action transition-colors cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                      <span className="text-campus-subtle font-mono text-xs">⇋</span>
                      <span className="font-bold text-sm text-campus-action font-sans flex items-center gap-1">
                        <span>{item.zh}</span>
                        <button
                          type="button"
                          onClick={() => speakCampusText(item.zh, 'zh')}
                          title="Прослушать китайское произношение"
                          className="p-0.5 text-campus-subtle hover:text-campus-action transition-colors cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                      <span className="text-[11px] font-mono text-campus-muted px-1 py-0.2 bg-campus-bg border border-campus-border/40">
                        [{item.pinyin}]
                      </span>
                    </>
                  )}
                  <span className="badge-sticker text-[9px] py-0 px-1">
                    {item.category}
                  </span>
                </div>

                <p className="text-xs text-campus-muted font-sans leading-relaxed">
                  {item.contextNotes}
                </p>

                {item.officialRoom && (
                  <div className="flex items-center space-x-1 text-[11px] font-mono text-campus-ai font-bold">
                    <Building className="w-3.5 h-3.5" />
                    <span>{isZh ? `对应科室: ${item.officialRoom}` : `Локация: ${item.officialRoom}`}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleCopy(item, idx)}
                  className="btn-outline text-[10px] py-1 px-2 flex items-center gap-1 cursor-pointer"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-green-700 font-bold">{isZh ? '已复制' : 'Скопировано'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{isZh ? '复制' : 'Копировать'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="text-center py-10 text-xs font-mono text-campus-subtle">
              {isZh ? '未找到相关词汇，请更换搜索关键词' : 'Ничего не найдено по вашему запросу'}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
