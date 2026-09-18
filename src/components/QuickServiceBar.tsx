import React from 'react';
import { CAMPUS_SERVICES, CampusServiceItem } from '../mock/mockData';
import {
  ChevronRight,
  HeartPulse,
  ShieldCheck,
  KeyRound,
  GraduationCap,
  PhoneCall,
} from 'lucide-react';

interface QuickServiceBarProps {
  onSelectService: (service: CampusServiceItem) => void;
  onOpenMap: (mode: 'map' | 'contacts') => void;
  activeLanguage?: 'ru' | 'zh';
}

export const QuickServiceBar: React.FC<QuickServiceBarProps> = ({
  onSelectService,
  onOpenMap,
  activeLanguage = 'ru',
}) => {
  const isZh = activeLanguage === 'zh';

  const renderServiceIcon = (id: string) => {
    switch (id) {
      case 'srv-health':
        return <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600 stroke-[2]" />;
      case 'srv-visa':
        return <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 stroke-[2]" />;
      case 'srv-dorm':
        return <KeyRound className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 stroke-[2]" />;
      case 'srv-studies':
        return <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 stroke-[2]" />;
      case 'srv-urgent':
      default:
        return <PhoneCall className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 stroke-[2]" />;
    }
  };

  return (
    <div className="bg-white border border-campus-border shadow-brutal p-4 sm:p-5 mb-5">
      
      {/* Заголовок блока */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-campus-action"></span>
          <h3 className="font-mono font-bold text-xs sm:text-sm text-campus-text uppercase tracking-tight">
            {isZh ? '高频办事科室导航' : 'Сервисы первой необходимости'}
          </h3>
        </div>
        <button
          onClick={() => onOpenMap('map')}
          className="text-xs font-mono text-campus-action hover:text-campus-action-hover font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
        >
          <span>{isZh ? '全部科室地图' : 'Карта всех отделов'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Сетка ключевых сервисов */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {CAMPUS_SERVICES.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelectService(service)}
            className="flex flex-col items-center group text-center p-2 sm:p-2.5 border border-transparent hover:border-campus-border hover:bg-campus-bg transition-all cursor-pointer"
          >
            {/* Иконка */}
            <div
              className={`w-11 h-11 sm:w-13 sm:h-13 border border-campus-border/60 flex items-center justify-center transition-transform group-hover:scale-105 group-hover:shadow-brutal-xs ${service.iconBg}`}
            >
              {renderServiceIcon(service.id)}
            </div>

            {/* Название сервиса */}
            <span className="font-bold text-xs text-campus-text mt-2 group-hover:text-campus-action transition-colors leading-tight font-sans">
              {isZh ? service.titleZh : service.titleRu}
            </span>

            {/* Подпись кабинета */}
            <span className="text-[10px] font-mono text-campus-subtle mt-0.5 hidden xs:block truncate max-w-full">
              {isZh ? service.badge : service.room}
            </span>
          </button>
        ))}
      </div>

    </div>
  );
};
