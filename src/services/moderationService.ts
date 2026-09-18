import { Language, Post, PostCategory } from '../types/schema';
import { getAiConfig } from './aiServices';

export interface ModerationResult {
  isFlagged: boolean;
  flaggedWords: string[];
  reasonRu?: string;
  reasonZh?: string;
}

export interface GrammarIssue {
  original: string;
  replacement: string;
  reasonRu: string;
  reasonZh: string;
}

export interface GrammarCheckResult {
  hasSuggestions: boolean;
  suggestedTitle: string;
  suggestedContent: string;
  issues: GrammarIssue[];
}

export interface SimilarPostMatch {
  post: Post;
  score: number; // 0 - 100
  matchReasonRu: string;
  matchReasonZh: string;
}

/**
 * 1. ПРОВЕРКА ЦЕНЗУРЫ И ЭТИКИ КАМПУСА (РУССКИЙ + КИТАЙСКИЙ)
 */
const CENSORSHIP_PATTERNS_RU: Array<{ regex: RegExp; label: string }> = [
  { regex: /(?<![а-яёa-z0-9])(хуй[а-я]*|нахуй|похуй)(?![а-яёa-z0-9])/i, label: 'нецензурная брань' },
  { regex: /(?<![а-яёa-z0-9])(пизд[а-я]*|распиздяй)(?![а-яёa-z0-9])/i, label: 'нецензурная брань' },
  { regex: /(?<![а-яёa-z0-9])(еб[а-я]*|заеб[а-я]*|выеб[а-я]*|уеб[а-я]*)(?![а-яёa-z0-9])/i, label: 'ненормативная лексика' },
  { regex: /(?<![а-яёa-z0-9])(бля[дт][а-я]*)(?![а-яёa-z0-9])/i, label: 'брань' },
  { regex: /(?<![а-яёa-z0-9])(сук[а-я]*)(?![а-яёa-z0-9])/i, label: 'брань' },
  { regex: /(?<![а-яёa-z0-9])(дебил[а-я]*|идиот[а-я]*|козел|козл[а-я]*|придурок[а-я]*|даун[а-я]*|урод[а-я]*|мраз[а-я]*)(?![а-яёa-z0-9])/i, label: 'оскорбление личности' },
  { regex: /(?<![а-яёa-z0-9])(задолба[а-я]*)(?![а-яёa-z0-9])/i, label: 'агрессивная лексика' },
  { regex: /(?<![а-яёa-z0-9])(взятк[а-я]*|купить диплом|купить ответы|отчислить нах)(?![а-яёa-z0-9])/i, label: 'нарушение академической этики' },
];

const CENSORSHIP_PATTERNS_ZH: Array<{ regex: RegExp; label: string }> = [
  { regex: /(操你妈|草泥马|肏|操你|干你)/i, label: '辱骂与不当粗口' },
  { regex: /(傻逼|煞笔|二逼|弱智|脑残|蠢猪)/i, label: '人身攻击' },
  { regex: /(王八蛋|混蛋|滚蛋|狗日的|去死)/i, label: '不文明语言' },
  { regex: /(他妈的|妈的|特么的|卧槽)/i, label: '不文明粗话' },
  { regex: /(买学分|找枪手|作弊包过|行贿)/i, label: '违反学术诚信' },
];

export function checkCensorship(text: string): ModerationResult {
  if (!text || text.trim() === '') {
    return { isFlagged: false, flaggedWords: [] };
  }

  const flaggedWords: string[] = [];
  const reasonsRu: string[] = [];
  const reasonsZh: string[] = [];

  for (const item of CENSORSHIP_PATTERNS_RU) {
    const match = text.match(item.regex);
    if (match) {
      flaggedWords.push(match[0]);
      if (!reasonsRu.includes(item.label)) reasonsRu.push(item.label);
      if (!reasonsZh.includes('不当言论或攻击词汇')) reasonsZh.push('不当言论或攻击词汇');
    }
  }

  for (const item of CENSORSHIP_PATTERNS_ZH) {
    const match = text.match(item.regex);
    if (match) {
      flaggedWords.push(match[0]);
      if (!reasonsZh.includes(item.label)) reasonsZh.push(item.label);
      if (!reasonsRu.includes('недопустимая лексика')) reasonsRu.push('недопустимая лексика');
    }
  }

  if (flaggedWords.length > 0) {
    return {
      isFlagged: true,
      flaggedWords,
      reasonRu: `Текст содержит недопустимые выражения: ${reasonsRu.join(', ')}. Пожалуйста, соблюдайте этику университетского общения.`,
      reasonZh: `内容包含不当词汇（${reasonsZh.join('、')}）。请遵守大学跨文化校园礼仪与文明守则。`,
    };
  }

  return { isFlagged: false, flaggedWords: [] };
}

export const checkModeration = checkCensorship;

/**
 * 2. ПРОВЕРКА ОРФОГРАФИИ И КАМПУСНОГО СТИЛЯ (РУССКИЙ + КИТАЙСКИЙ)
 */
const COMMON_TYPOS: Array<{
  pattern: RegExp;
  replacement: string;
  reasonRu: string;
  reasonZh: string;
}> = [
  { pattern: /(?<![а-яёa-z0-9])зделать(?![а-яёa-z0-9])/gi, replacement: 'сделать', reasonRu: 'Приставка с- вместо з-', reasonZh: '俄语拼写纠正：сделать' },
  { pattern: /(?<![а-яёa-z0-9])пропусск(?![а-яёa-z0-9])/gi, replacement: 'пропуск', reasonRu: 'Слово «пропуск» пишется с одной «с»', reasonZh: '拼写纠正：пропуск（单写с）' },
  { pattern: /(?<![а-яёa-z0-9])общагу(?![а-яёa-z0-9])/gi, replacement: 'общежитие', reasonRu: 'Рекомендуется официальное «общежитие»', reasonZh: '建议使用规范词：общежитие（宿舍）' },
  { pattern: /(?<![а-яёa-z0-9])общаг[еиа](?![а-яёa-z0-9])/gi, replacement: 'общежитии', reasonRu: 'Официальный кампусный стиль: общежитие', reasonZh: '建议使用规范词：общежитие' },
  { pattern: /(?<![а-яёa-z0-9])куратр(?![а-яёa-z0-9])/gi, replacement: 'куратор', reasonRu: 'Опечатка: куратор', reasonZh: '拼写纠正：куратор（辅导员）' },
  { pattern: /(?<![а-яёa-z0-9])куротор(?![а-яёa-z0-9])/gi, replacement: 'куратор', reasonRu: 'Правильно: куратор (через «а»)', reasonZh: '拼写纠正：куратор' },
  { pattern: /(?<![а-яёa-z0-9])деконат(?![а-яёa-z0-9])/gi, replacement: 'деканат', reasonRu: 'Правильно: деканат (через «а»)', reasonZh: '拼写纠正：деканат（系办）' },
  { pattern: /(?<![а-яёa-z0-9])флюрографи[яюеи](?![а-яёa-z0-9])/gi, replacement: 'флюорографию', reasonRu: 'Опечатка: пропущена буква «о» (флюорография)', reasonZh: '拼写纠正：флюорография（胸透体检）' },
  { pattern: /(?<![а-яёa-z0-9])страхофк[ауеи](?![а-яёa-z0-9])/gi, replacement: 'страховку', reasonRu: 'Правильно: страховка (через «в»)', reasonZh: '拼写纠正：страховка（保险）' },
  { pattern: /(?<![а-яёa-z0-9])здать(?![а-яёa-z0-9])/gi, replacement: 'сдать', reasonRu: 'Приставка с-: сдать зачет / экзамен', reasonZh: '拼写纠正：сдать' },
  { pattern: /(?<![а-яёa-z0-9])справку нада(?![а-яёa-z0-9])/gi, replacement: 'нужна справка', reasonRu: 'Стилистическая правка: «нужна справка»', reasonZh: '语序与语法润色' },

  { pattern: /挂衣[畔判]/g, replacement: '挂衣袢', reasonRu: 'Петелька на куртке: правильно 挂衣袢', reasonZh: '字词修正：衣帽间挂衣“袢”（pàn）而非“畔”' },
  { pattern: /宿管大妈/g, replacement: '宿舍管理员', reasonRu: 'Вежливый тон: 宿舍管理员', reasonZh: '规范文明称谓：宿舍管理员（宿管老师）' },
  { pattern: /连不上网/g, replacement: '校园网Wi-Fi连接异常', reasonRu: 'Уточнение формулировки для ИТ-отдела', reasonZh: '建议规范主题：校园网Wi-Fi连接异常' },
  { pattern: /外事办在哪/g, replacement: '签证与外事处具体办公地点', reasonRu: 'Официальное название: 签证与外事处', reasonZh: '建议规范部门全称：签证与外事处（104室）' },
];

export async function checkGrammarAndEnhance(params: {
  title: string;
  content: string;
  lang: Language;
}): Promise<GrammarCheckResult> {
  const { title, content } = params;

  let suggestedTitle = title;
  let suggestedContent = content;
  const issues: GrammarIssue[] = [];

  for (const typo of COMMON_TYPOS) {
    if (typo.pattern.test(suggestedTitle)) {
      const match = suggestedTitle.match(typo.pattern)?.[0] || '';
      suggestedTitle = suggestedTitle.replace(typo.pattern, typo.replacement);
      issues.push({
        original: match,
        replacement: typo.replacement,
        reasonRu: typo.reasonRu,
        reasonZh: typo.reasonZh,
      });
    }

    if (typo.pattern.test(suggestedContent)) {
      const match = suggestedContent.match(typo.pattern)?.[0] || '';
      suggestedContent = suggestedContent.replace(typo.pattern, typo.replacement);
      if (!issues.some((i) => i.original === match)) {
        issues.push({
          original: match,
          replacement: typo.replacement,
          reasonRu: typo.reasonRu,
          reasonZh: typo.reasonZh,
        });
      }
    }
  }

  const config = getAiConfig();
  if (config.apiKey && config.apiKey.trim() !== '') {
    try {
      const response = await fetch('/api/ai-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: config.apiKey.trim(),
          model: config.model,
          messages: [
            {
              role: 'system',
              content: 'Ты — AI-редактор кампусного форума. Исправь опечатки и грамматику. Верни ТОЛЬКО JSON: {"correctedTitle": "...", "correctedContent": "..."}',
            },
            {
              role: 'user',
              content: `Заголовок: ${suggestedTitle}\nТекст: ${suggestedContent}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content;
        const match = raw?.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.correctedTitle && parsed.correctedTitle !== title) {
            suggestedTitle = parsed.correctedTitle;
          }
          if (parsed.correctedContent && parsed.correctedContent !== content) {
            suggestedContent = parsed.correctedContent;
          }
        }
      }
    } catch (e) {
    }
  }

  const hasSuggestions =
    suggestedTitle.trim() !== title.trim() ||
    suggestedContent.trim() !== content.trim() ||
    issues.length > 0;

  return {
    hasSuggestions,
    suggestedTitle,
    suggestedContent,
    issues,
  };
}

/**
 * 3. СЕМАНТИЧЕСКИЙ АНАЛИЗ И ПОИСК СХОЖИХ ВОПРОСОВ (ПОИСК ДУБЛИКАТОВ)
 */
interface TopicKeywordCluster {
  id: string;
  nameRu: string;
  nameZh: string;
  keywords: string[];
  room?: string;
}

const TOPIC_CLUSTERS: TopicKeywordCluster[] = [
  {
    id: 'medical_fluorography',
    nameRu: 'Медицинская страховка и флюорография',
    nameZh: '留学生医疗保险与胸透体检',
    keywords: [
      'флюорограф', 'флюшка', 'медпункт', 'страховк', 'дмс', 'медосмотр', '302', 'рентген',
      '胸透', '体检', '医保', '医疗保险', '校医室', '302室', 'X光',
    ],
    room: '302',
  },
  {
    id: 'dorm_wifi',
    nameRu: 'Wi-Fi и интернет в общежитии',
    nameZh: '宿舍校园网与Wi-Fi连接认证',
    keywords: [
      'wi-fi', 'wifi', 'вайфай', 'интернет', 'сертификат', '10.10.0.1', 'роутер', 'сеть',
      '校园网', '无线网', '证书错误', '内网', '登录', '学号认证',
    ],
    room: '102',
  },
  {
    id: 'session_grades',
    nameRu: 'Зачетные книжки, сессия и отработки',
    nameZh: '成绩册提交与补考补课时间表',
    keywords: [
      'зачетк', 'зачетная', 'сесси', 'отработк', 'деканат', '210', 'хвост', 'пересдач',
      '成绩册', '记分册', '补考', '补课', '系办', '210室', '考试',
    ],
    room: '210',
  },
  {
    id: 'pass_dorm_card',
    nameRu: 'Пропуск в общежитие и бюро пропусков',
    nameZh: '宿舍门禁与出入通行证办理',
    keywords: [
      'пропуск', 'бюро пропусков', '214', 'электронный пропуск', 'турникет', 'карточка', 'кпп',
      '出入证', '通行证', '门禁', '214室', '补办卡', '宿舍大门',
    ],
    room: '214',
  },
  {
    id: 'visa_registration',
    nameRu: 'Визы, регистрация и миграционный учет',
    nameZh: '签证延期与居留登记办理',
    keywords: [
      'виз', 'регистраци', 'паспорт', 'миграцион', '104', 'перевод паспорта', 'учет',
      '签证', '居留', '外事处', '104室', '护照公证', '居留登记',
    ],
    room: '104',
  },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

export function findSimilarQuestions(params: {
  title: string;
  content: string;
  existingPosts: Post[];
}): SimilarPostMatch[] {
  const { title, content, existingPosts } = params;
  const inputFull = `${title} ${content}`.toLowerCase();
  const inputTokens = new Set(tokenize(inputFull));

  if (inputTokens.size < 2) return [];

  const matches: SimilarPostMatch[] = [];

  let matchedCluster: TopicKeywordCluster | null = null;
  let maxClusterHits = 0;

  for (const cluster of TOPIC_CLUSTERS) {
    let hits = 0;
    for (const kw of cluster.keywords) {
      if (inputFull.includes(kw.toLowerCase())) {
        hits++;
      }
    }
    if (hits > maxClusterHits && hits >= 2) {
      maxClusterHits = hits;
      matchedCluster = cluster;
    }
  }

  for (const post of existingPosts) {
    const postFull = `${post.titleOriginal} ${post.titleTranslated} ${post.contentOriginal} ${post.contentTranslated}`.toLowerCase();
    const postTokens = tokenize(postFull);

    let tokenMatches = 0;
    for (const token of postTokens) {
      if (inputTokens.has(token)) {
        tokenMatches++;
      }
    }

    const roomMatch = matchedCluster?.room && postFull.includes(matchedCluster.room);

    let clusterOverlap = false;
    if (matchedCluster) {
      for (const kw of matchedCluster.keywords) {
        if (postFull.includes(kw.toLowerCase())) {
          clusterOverlap = true;
          break;
        }
      }
    }

    let score = 0;
    if (clusterOverlap && maxClusterHits >= 2) {
      score += 45;
    }
    if (roomMatch) {
      score += 25;
    }
    score += Math.min(30, tokenMatches * 5);

    if (score >= 40) {
      const reasonRu = matchedCluster
        ? `Оба вопроса посвящены теме «${matchedCluster.nameRu}»${roomMatch ? ` (Кабинет ${matchedCluster.room})` : ''}`
        : 'Найдено высокое смысловое совпадение ключевых слов и темы обращения';

      const reasonZh = matchedCluster
        ? `提问均涉及「${matchedCluster.nameZh}」业务${roomMatch ? `（涉及办公室：${matchedCluster.room}）` : ''}`
        : '检测到与已有帖子的核心关键词及办理诉求高度契合';

      matches.push({
        post,
        score: Math.min(98, score),
        matchReasonRu: reasonRu,
        matchReasonZh: reasonZh,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

/**
 * 4. СЖАТИЕ И ВЫДЕЛЕНИЕ СУТИ ВОПРОСА (AI ESSENCE COMPRESSION)
 * Анализирует длину и эмоциональную окраску, отсекая приветствия и панику,
 * формируя лаконичное смысловое ядро для ускорения модерации.
 */
export interface EssenceCompressionResult {
  essenceRu: string;
  essenceZh: string;
  originalWordCount: number;
  compressedWordCount: number;
  wasCompressed: boolean;
}

export function compressQuestionEssence(
  inputOrTitle: { title?: string; content?: string; lang?: Language } | string,
  contentOrLang?: string,
  langParam?: Language
): EssenceCompressionResult {
  let title = '';
  let content = '';
  let lang: Language = 'ru';

  if (typeof inputOrTitle === 'object' && inputOrTitle !== null) {
    title = inputOrTitle.title || '';
    content = inputOrTitle.content || '';
    lang = inputOrTitle.lang || (/[一-龥]/.test(title + content) ? 'zh' : 'ru');
  } else if (typeof inputOrTitle === 'string') {
    if (contentOrLang === 'ru' || contentOrLang === 'zh') {
      title = inputOrTitle;
      content = '';
      lang = contentOrLang;
    } else {
      title = inputOrTitle;
      content = contentOrLang || '';
      lang = langParam || (/[一-龥]/.test(title + content) ? 'zh' : 'ru');
    }
  }

  const fullText = `${title} ${content}`.trim();
  const words = fullText.split(/\s+/).filter(Boolean);
  const originalWordCount = words.length;

  let cleaned = fullText
    .replace(/(Всем привет[!,.]*|Здравствуйте[!,.]*|Привет всем[!,.]*|Добрый день[!,.]*)/gi, '')
    .replace(/(Срочно помогите[!,.]*|Очень срочно[!,.]*|Помогите пожалуйста[!,.]*|Спасите[!,.]*)/gi, '')
    .replace(/(Не знаю что делать[!,.]*|У меня паника[!,.]*|В полном шоке[!,.]*)/gi, '')
    .replace(/(大家好[！!，,]*|各位学长学姐好[！!，,]*|有人在吗[？?]*)/g, '')
    .replace(/(急急急[！!]*|求助各位大神[！!]*|在线等[，,]*挺急的)/g, '')
    .replace(/(救命啊[！!]*|急死我了[！!]*|完全不知道该怎么办[！!]*)/g, '')
    .replace(/(太感谢了[！!]*|谢谢大家[！!]*|多谢[！!]*|非常感谢[！!]*)/g, '')
    .trim();

  cleaned = cleaned.replace(/\s+/g, ' ').replace(/[!?！？]{2,}/g, '?');

  let coreSentence = cleaned;
  const sentences = cleaned.split(/(?<=[.?!。！？])\s*/).filter(Boolean);
  if (sentences.length > 1) {
    const questionSentence = sentences.find((s) => s.includes('?') || s.includes('？'));
    coreSentence = questionSentence || sentences[0];
  }

  if (title.trim().length > 10 && title.trim().length < 80 && !content) {
    coreSentence = title.trim();
  }

  const isZh = lang === 'zh';
  const essenceZh = isZh
    ? coreSentence.replace(/^[，,。. ]+/, '')
    : `[提炼要点] ${coreSentence}`;
  const essenceRu = isZh
    ? `[Суть обращения]: ${coreSentence}`
    : coreSentence.replace(/^[，,。. ]+/, '');

  const compressedWordCount = coreSentence.split(/\s+/).filter(Boolean).length;
  const wasCompressed = originalWordCount > compressedWordCount + 2;

  return {
    essenceRu,
    essenceZh,
    originalWordCount,
    compressedWordCount,
    wasCompressed,
  };
}

/**
 * 5. АВТОМАТИЧЕСКОЕ ОПРЕДЕЛЕНИЕ КАТЕГОРИИ И ПОДКАТЕГОРИИ БЕЛАРУСИ
 * Определяет категорию для облегчения работы модератора в админке
 */
export interface CategorySuggestion {
  category: PostCategory;
  subcategoryRu: string;
  subcategoryZh: string;
  confidence: number;
  tags: string[];
}

export function suggestCategoryAndSubcategory(text: string): CategorySuggestion {
  const lower = text.toLowerCase();

  if (
    lower.includes('оплат') ||
    lower.includes('талон') ||
    lower.includes('жетон') ||
    lower.includes('метро') ||
    lower.includes('автобус') ||
    lower.includes('троллейбус') ||
    lower.includes('трамвай') ||
    lower.includes('проездн') ||
    lower.includes('штраф') ||
    lower.includes('контрол') ||
    lower.includes('маршрутк') ||
    lower.includes('toptip') ||
    lower.includes('公交') ||
    lower.includes('地铁') ||
    lower.includes('车票') ||
    lower.includes('交通卡') ||
    lower.includes('刷码')
  ) {
    return {
      category: 'transport',
      subcategoryRu: 'Городской транспорт (Оплата проезда, метро Минска, талоны)',
      subcategoryZh: '城市交通（Оплати 扫码支付、明斯克地铁、乘车票）',
      confidence: 94,
      tags: ['Транспорт', 'Минск', 'Оплати', 'Метро'],
    };
  }

  if (
    lower.includes('бель') ||
    lower.includes('постель') ||
    lower.includes('кастелян') ||
    lower.includes('комендант') ||
    lower.includes('общежит') ||
    lower.includes('общаг') ||
    lower.includes('214') ||
    lower.includes('пропуск') ||
    lower.includes('дежурств') ||
    lower.includes('стирк') ||
    lower.includes('душ') ||
    lower.includes('таракан') ||
    lower.includes('кровать') ||
    lower.includes('宿舍') ||
    lower.includes('被套') ||
    lower.includes('床单') ||
    lower.includes('换洗') ||
    lower.includes('宿管') ||
    lower.includes('洗衣房')
  ) {
    return {
      category: 'dormitory',
      subcategoryRu: 'Быт общежития (Смена постельного белья, комендант, ремонт)',
      subcategoryZh: '宿舍生活与后勤（被褥定期换洗、宿管老师、门禁报修）',
      confidence: 95,
      tags: ['Общежитие', 'ПостельноеБелье', 'Быт', 'Каб214'],
    };
  }

  if (
    lower.includes('дран') ||
    lower.includes('мачанк') ||
    lower.includes('кухн') ||
    lower.includes('еда') ||
    lower.includes('ресторан') ||
    lower.includes('кафе') ||
    lower.includes('столов') ||
    lower.includes('комаровк') ||
    lower.includes('рынок') ||
    lower.includes('специ') ||
    lower.includes('соус') ||
    lower.includes('соев') ||
    lower.includes('халяль') ||
    lower.includes('лапш') ||
    lower.includes('продукты') ||
    lower.includes('土豆饼') ||
    lower.includes('美食') ||
    lower.includes('餐厅') ||
    lower.includes('老干妈') ||
    lower.includes('中国调料') ||
    lower.includes('火锅') ||
    lower.includes('市场')
  ) {
    return {
      category: 'cuisine',
      subcategoryRu: 'Белорусская кухня и питание (Драники, столовые, китайские специи)',
      subcategoryZh: '餐饮美食与食材选购（白俄罗斯土豆饼、学生食堂、中国调料采购）',
      confidence: 92,
      tags: ['Кухня', 'Драники', 'Комаровка', 'Питание'],
    };
  }

  if (
    lower.includes('этикет') ||
    lower.includes('тишин') ||
    lower.includes('23:00') ||
    lower.includes('23') ||
    lower.includes('шум') ||
    lower.includes('гардероб') ||
    lower.includes('петельк') ||
    lower.includes('бахил') ||
    lower.includes('вы') ||
    lower.includes('вежлив') ||
    lower.includes('отчеств') ||
    lower.includes('куртк') ||
    lower.includes('礼仪') ||
    lower.includes('静音') ||
    lower.includes('23点') ||
    lower.includes('挂衣袢') ||
    lower.includes('衣帽间') ||
    lower.includes('鞋套') ||
    lower.includes('尊称')
  ) {
    return {
      category: 'etiquette',
      subcategoryRu: 'Правила этикета и поведение (Закон о тишине, гардероб, обращение)',
      subcategoryZh: '公共社交礼仪与规范（23点静音规则、衣帽间存衣、师生尊称）',
      confidence: 93,
      tags: ['Этикет', 'Тишина', 'Гардероб', 'Культура'],
    };
  }

  if (
    lower.includes('виз') ||
    lower.includes('огим') ||
    lower.includes('регистрац') ||
    lower.includes('104') ||
    lower.includes('паспорт') ||
    lower.includes('госпошлин') ||
    lower.includes('миграци') ||
    lower.includes('签证') ||
    lower.includes('居留') ||
    lower.includes('落地签') ||
    lower.includes('104室')
  ) {
    return {
      category: 'visa',
      subcategoryRu: 'Визы и регистрация в ОГИМ (Каб. 104, продление, выезд)',
      subcategoryZh: '签证与居留注册（104办公室、落地签延期、出入境）',
      confidence: 96,
      tags: ['Визы', 'ОГИМ', 'Каб104', 'Регистрация'],
    };
  }

  if (
    lower.includes('зачет') ||
    lower.includes('сесси') ||
    lower.includes('экзамен') ||
    lower.includes('деканат') ||
    lower.includes('210') ||
    lower.includes('лекци') ||
    lower.includes('отработк') ||
    lower.includes('хвост') ||
    lower.includes('задолженност') ||
    lower.includes('成绩册') ||
    lower.includes('考试') ||
    lower.includes('系办') ||
    lower.includes('补考')
  ) {
    return {
      category: 'studies',
      subcategoryRu: 'Учебный процесс и сессия (Зачетки, деканат 210, экзамены)',
      subcategoryZh: '学业管理与期末考试（成绩册提交、210系办公室、补考安排）',
      confidence: 95,
      tags: ['Учеба', 'Сессия', 'Зачетка', 'Каб210'],
    };
  }

  return {
    category: 'curator',
    subcategoryRu: 'Консультация с куратором (Каб. 108, общие вопросы)',
    subcategoryZh: '辅导员咨询（108办公室、新生综合解答）',
    confidence: 80,
    tags: ['Куратор', 'Каб108', 'Кампус'],
  };
}

/**
 * 6. ПРЕВРАЩЕНИЕ НАРОДНОГО ОТВЕТА В СТАТЬЮ БАЗЫ ЗНАНИЙ (WIKI FORMATTING)
 * Финальное форматирование нейросетью вопроса и лучшего ответа сообщества в энциклопедический стиль
 */
export function formatCommunityAnswerToWiki(params: {
  questionTitle: string;
  questionContent: string;
  bestAnswerContent: string;
  category: PostCategory;
}): {
  titleRu: string;
  titleZh: string;
  contentRu: string;
  contentZh: string;
  keyStepsRu: string[];
  keyStepsZh: string[];
  tags: string[];
} {
  const { questionTitle, questionContent, bestAnswerContent, category } = params;

  const lines = bestAnswerContent.split('\n').map((l) => l.trim()).filter(Boolean);
  const detectedStepsRu: string[] = [];
  const detectedStepsZh: string[] = [];

  for (const line of lines) {
    if (/^(\d+[.)]|[-•*])\s*/.test(line)) {
      const cleanLine = line.replace(/^(\d+[.)]|[-•*])\s*/, '');
      if (/[\u4e00-\u9fa5]/.test(cleanLine)) {
        detectedStepsZh.push(cleanLine);
      } else {
        detectedStepsRu.push(cleanLine);
      }
    }
  }

  const finalStepsRu = detectedStepsRu.length > 0
    ? detectedStepsRu
    : [
        'Ознакомьтесь с подробной инструкцией в посте сообщества',
        'При необходимости уточните информацию у старосты или в соответствующем кабинете',
        'Сохраните данную памятку для быстрого доступа',
      ];

  const finalStepsZh = detectedStepsZh.length > 0
    ? detectedStepsZh
    : [
        '仔细查阅社区同学与老师提供的实操解答',
        '如有进一步疑问，可前往对应办公室或咨询班长',
        '收藏此知识库条目，方便日后随时调取查阅',
      ];

  const titleRu = `Памятка: ${questionTitle.replace(/^(Как|Где|Куда|Почему|Что делать если)\s*/i, '')}`;
  const titleZh = `办事指南：${questionTitle}`;

  const contentRu = `Данная статья сформирована на основе реального опыта китайских студентов в Беларуси и одобрена сообществом:\n\n${bestAnswerContent}`;
  const contentZh = `本条目基于白俄罗斯留学生真实互助讨论提炼而成，并经社区多数点赞入库：\n\n${bestAnswerContent}`;

  return {
    titleRu,
    titleZh,
    contentRu,
    contentZh,
    keyStepsRu: finalStepsRu,
    keyStepsZh: finalStepsZh,
    tags: ['ВыбраноСообществом', 'Вики', category],
  };
}
