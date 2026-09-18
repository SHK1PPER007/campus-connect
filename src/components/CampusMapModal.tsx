import React, { useState } from 'react';
import { X, MapPin, Building, Phone, Clock, Compass, Shield, HeartPulse, Wifi } from 'lucide-react';

interface CampusMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'map' | 'contacts';
  activeLanguage?: 'ru' | 'zh';
}

export const CampusMapModal: React.FC<CampusMapModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'map',
  activeLanguage = 'ru',
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'contacts'>(initialMode);

  if (!isOpen) return null;

  const isZh = activeLanguage === 'zh';

  const campusLocations = [
    {
      buildingZh: '主教学楼 A栋 (Главный учебный корпус A)',
      buildingRu: 'Корпус А (Главный учебный)',
      rooms: [
        {
          numberZh: 'A栋 108室',
          numberRu: 'Каб. 108',
          titleZh: '留学生专职辅导员办公室',
          titleRu: 'Куратор иностранных студентов',
          personZh: '安娜·谢尔盖耶夫娜 (负责留学生日常事务)',
          personRu: 'Анна Сергеевна Соколова',
          hoursZh: '周一至周五 10:00 - 16:30',
          hoursRu: 'Пн-Пт 10:00 - 16:30',
          phone: '+7 (495) 200-11-08',
          icon: <Compass className="w-3.5 h-3.5 text-campus-action" />,
        },
        {
          numberZh: 'A栋 210室',
          numberRu: 'Каб. 210',
          titleZh: '系办公室 / 教务处',
          titleRu: 'Деканат / Учебная часть',
          personZh: '成绩单盖章、请假条办理与学术证明',
          personRu: 'Сдача зачеток и академические справки',
          hoursZh: '周一至周五 09:00 - 17:00',
          hoursRu: 'Пн-Пт 09:00 - 17:00',
          phone: '+7 (495) 200-12-10',
          icon: <Building className="w-3.5 h-3.5 text-campus-text" />,
        },
        {
          numberZh: 'A栋 104室',
          numberRu: 'Каб. 104',
          titleZh: '签证居留与外事处',
          titleRu: 'Миграционный отдел (Регистрация и визы)',
          personZh: '办理落地签、延长学生签证与入境登记',
          personRu: 'Оформление миграционного учета',
          hoursZh: '周二、周四 10:00 - 15:00',
          hoursRu: 'Вт, Чт 10:00 - 15:00',
          phone: '+7 (495) 200-11-04',
          icon: <Shield className="w-3.5 h-3.5 text-campus-ai" />,
        },
      ],
    },
    {
      buildingZh: '校医务综合楼 B栋 (Медицинский центр B)',
      buildingRu: 'Корпус Б (Медицинский центр)',
      rooms: [
        {
          numberZh: 'B栋 302室',
          numberRu: 'Каб. 302',
          titleZh: '留学生商业医疗保险办理处',
          titleRu: 'Оформление медицинской страховки',
          personZh: '商业医疗保险 (ДМС) 购买与理赔咨询',
          personRu: 'Полисы ДМС, безналичная оплата',
          hoursZh: '周一至周五 09:00 - 16:30',
          hoursRu: 'Пн-Пт 09:00 - 16:30',
          phone: '+7 (495) 200-23-02',
          icon: <HeartPulse className="w-3.5 h-3.5 text-campus-action" />,
        },
        {
          numberZh: 'B栋 105室',
          numberRu: 'Каб. 105',
          titleZh: '年度体检与胸透X光室',
          titleRu: 'Флюорографический кабинет и терапевт',
          personZh: '萨莫伊洛娃医生 (体检合格盖章)',
          personRu: 'Врач Самойлова Е.В.',
          hoursZh: '周二、周四 09:00 - 12:00',
          hoursRu: 'Вт, Чт 09:00 - 12:00',
          phone: '+7 (495) 200-21-05',
          icon: <HeartPulse className="w-3.5 h-3.5 text-green-600" />,
        },
      ],
    },
    {
      buildingZh: '宿舍区与通行证管理 (Студгородок)',
      buildingRu: 'Студгородок и КПП',
      rooms: [
        {
          numberZh: '1号门岗 214室',
          numberRu: 'Каб. 214 (КПП-1)',
          titleZh: '校园与宿舍出入证管理中心',
          titleRu: 'Бюро пропусков (Электронные карты)',
          personZh: '门禁卡补办、消磁修复与通行权限开通',
          personRu: 'Выдача и замена кампусных пропусков',
          hoursZh: '周一至周五 08:30 - 17:00',
          hoursRu: 'Пн-Пт 08:30 - 17:00',
          phone: '+7 (495) 200-32-14',
          icon: <Shield className="w-3.5 h-3.5 text-campus-action" />,
        },
        {
          numberZh: '4号宿舍楼 102室',
          numberRu: 'Корпус 4, каб. 102',
          titleZh: '校园网络与IT支持中心',
          titleRu: 'ИТ-Техподдержка студгородка',
          personZh: '德米特里 (宿舍Wi-Fi登录与故障报修)',
          personRu: 'Дмитрий Смирнов (Wi-Fi Campus-Student)',
          hoursZh: '周一至周六 10:00 - 19:00',
          hoursRu: 'Пн-Сб 10:00 - 19:00',
          phone: '+7 (495) 200-31-02',
          icon: <Wifi className="w-3.5 h-3.5 text-campus-ai" />,
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-campus-surface border-2 border-campus-border shadow-brutal-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Шапка */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-campus-border bg-campus-bg flex-shrink-0">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-campus-action" />
            <div>
              <h2 className="font-mono font-black text-xs sm:text-sm uppercase tracking-tight text-campus-text">
                {isZh ? '校园楼栋地图与办事科室导航' : 'Карта кампуса и Справочник отделов'}
              </h2>
              <p className="text-[10px] font-mono text-campus-subtle">
                {isZh ? '留学生核心办事科室、办公时间与联系电话' : 'Кабинеты, телефоны и часы приема иностранных студентов'}
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

        {/* Переключатель вкладок */}
        <div className="flex border-b border-campus-border bg-white px-3 sm:px-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`py-2 px-3 text-xs font-mono font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'map'
                ? 'border-campus-action text-campus-action'
                : 'border-transparent text-campus-subtle hover:text-campus-text'
            }`}
          >
            {isZh ? '科室楼栋分布' : 'Карта кабинетов'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`py-2 px-3 text-xs font-mono font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'contacts'
                ? 'border-campus-action text-campus-action'
                : 'border-transparent text-campus-subtle hover:text-campus-text'
            }`}
          >
            {isZh ? '重要联系电话' : 'Экстренные контакты'}
          </button>
        </div>

        {/* Контент */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-4 flex-1 bg-campus-bg">
          {activeTab === 'map' ? (
            <div className="space-y-4">
              {campusLocations.map((group, gIdx) => (
                <div key={gIdx} className="bg-white border border-campus-border shadow-brutal-xs p-3 sm:p-4">
                  <h3 className="font-mono font-bold text-xs uppercase text-campus-action mb-2.5 pb-1 border-b border-campus-border/30">
                    {isZh ? group.buildingZh : group.buildingRu}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {group.rooms.map((room, rIdx) => (
                      <div key={rIdx} className="p-2.5 border border-campus-border/60 bg-campus-bg/40 space-y-1 text-xs">
                        <div className="flex items-center justify-between font-mono font-bold text-campus-text">
                          <span className="flex items-center gap-1.5">
                            {room.icon}
                            <span>{isZh ? room.titleZh : room.titleRu}</span>
                          </span>
                          <span className="badge-sticker text-[10px]">
                            {isZh ? room.numberZh : room.numberRu}
                          </span>
                        </div>
                        <p className="text-[11px] text-campus-muted font-sans">
                          {isZh ? room.personZh : room.personRu}
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-mono text-campus-subtle pt-1 border-t border-campus-border/20">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{isZh ? room.hoursZh : room.hoursRu}</span>
                          </span>
                          <a
                            href={`tel:${room.phone}`}
                            className="flex items-center gap-1 text-campus-action hover:underline font-bold"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{room.phone}</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-campus-border shadow-brutal-xs p-3 sm:p-4 space-y-3">
              <h3 className="font-mono font-bold text-xs uppercase text-campus-text mb-2">
                {isZh ? '// 校园应急与办事通讯录' : '// ЭКСТРЕННЫЕ И ВАЖНЫЕ КОНТАКТЫ'}
              </h3>
              <div className="divide-y divide-campus-border/40 text-xs font-mono">
                {[
                  { nameZh: '留学生专职辅导员', nameRu: 'Куратор иностранных студентов', phone: '+7 (495) 200-11-08', descZh: 'A栋 108室，请假与日常事务', descRu: 'Каб. 108, общие вопросы и справки' },
                  { nameZh: '签证与外事处', nameRu: 'Миграционный отдел (Визы)', phone: '+7 (495) 200-11-04', descZh: 'A栋 104室，居留签注与落地签', descRu: 'Каб. 104, визы и регистрация' },
                  { nameZh: '门禁卡与出入证办理', nameRu: 'Бюро пропусков (Каб. 214)', phone: '+7 (495) 200-32-14', descZh: '1号门岗，门禁卡补办', descRu: 'КПП-1, пропуска в общежития' },
                  { nameZh: '校园医务急救与咨询', nameRu: 'Медпункт кампуса', phone: '+7 (495) 200-21-05', descZh: 'B栋 105室，急诊与体检', descRu: 'Корпус Б, каб. 105' },
                  { nameZh: '俄罗斯国家统一急救电话', nameRu: 'Единая служба спасения РФ', phone: '112', descZh: '支持英语与俄语急救报警', descRu: 'МЧС, скорая помощь, полиция' },
                ].map((c, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <div className="font-bold text-campus-text">{isZh ? c.nameZh : c.nameRu}</div>
                      <div className="text-[11px] text-campus-subtle">{isZh ? c.descZh : c.descRu}</div>
                    </div>
                    <a
                      href={`tel:${c.phone}`}
                      className="btn-action text-xs py-1 px-2.5 flex items-center gap-1 font-bold"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{c.phone}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
