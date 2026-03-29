import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'zh';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

export const translations = {
  en: {
    'app.title': 'FSRS Flashcards',
    'app.enableReminders': 'Enable Reminders',
    'app.remindersEnabled': 'Reminders Enabled',
    'app.remindersDenied': 'Reminders Denied',
    'app.notSupported': 'Notifications not supported',
    'nav.stats': 'Statistics',
    'home.myDecks': 'My Decks',
    'home.newDeck': 'New Deck',
    'home.create': 'Create',
    'home.deckName': 'Deck Name',
    'home.noDecks': 'No decks yet. Create one to get started!',
    'home.cards': 'cards',
    'home.due': 'due',
    'home.deleteConfirm': 'Are you sure you want to delete this deck? All cards will be lost.',
    'home.loading': 'Loading...',
    'deck.back': 'Back to Decks',
    'deck.totalCards': 'cards total',
    'deck.addCard': 'Add Card',
    'deck.study': 'Study',
    'deck.due': 'due',
    'deck.editCard': 'Edit Card',
    'deck.newCard': 'New Card',
    'deck.front': 'Front (Question)',
    'deck.backLabel': 'Back (Answer)',
    'deck.cancel': 'Cancel',
    'deck.saveChanges': 'Save Changes',
    'deck.saveCard': 'Save Card',
    'deck.deleteConfirm': 'Delete this card?',
    'deck.noCards': 'No cards in this deck yet. Add some to start studying!',
    'deck.dueNow': 'Now',
    'deck.reps': 'Reps',
    'study.exit': 'Exit Session',
    'study.caughtUp': "You're all caught up!",
    'study.reviewed': 'You have reviewed',
    'study.cardsToday': 'cards today.',
    'study.backToDeck': 'Back to Deck',
    'study.tapToReveal': 'Tap to reveal',
    'study.again': 'Again',
    'study.hard': 'Hard',
    'study.good': 'Good',
    'study.easy': 'Easy',
    'stats.title': 'Statistics',
    'stats.totalCards': 'Total Cards',
    'stats.totalReviews': 'Total Reviews',
    'stats.dueToday': 'Due Today',
    'stats.forgettingCurve': 'Forgetting Curve',
    'stats.retention': 'Retention (%)',
    'stats.days': 'Days',
    'stats.learningStatus': 'Learning Status (Last 14 Days)',
    'stats.activityHeatmap': 'Review Activity (Last 90 Days)',
    'stats.less': 'Less',
    'stats.more': 'More',
    'stats.reviews': 'Reviews',
    'stats.memoryStability': 'Memory Stability',
    'stats.cardCount': 'Card Count',
    'stats.stateDistribution': 'Card States',
    'stats.stateNew': 'New',
    'stats.stateLearning': 'Learning',
    'stats.stateReview': 'Review',
    'stats.stateRelearning': 'Relearning',
    'stats.noData': 'No data available yet.',
    'stats.upcomingReviews': 'Upcoming Reviews (Next 14 Days)',
    'settings.title': 'Reminder Settings',
    'settings.timeLabel': 'Daily Reminder Time',
    'settings.save': 'Save',
    'settings.cancel': 'Cancel',
  },
  zh: {
    'app.title': 'FSRS 记忆卡',
    'app.enableReminders': '开启复习提醒',
    'app.remindersEnabled': '已开启提醒',
    'app.remindersDenied': '提醒已拒绝',
    'app.notSupported': '浏览器不支持通知',
    'nav.stats': '统计',
    'home.myDecks': '我的牌组',
    'home.newDeck': '新建牌组',
    'home.create': '创建',
    'home.deckName': '牌组名称',
    'home.noDecks': '还没有牌组。创建一个开始吧！',
    'home.cards': '张卡片',
    'home.due': '待复习',
    'home.deleteConfirm': '确定要删除这个牌组吗？所有卡片都将丢失。',
    'home.loading': '加载中...',
    'deck.back': '返回牌组',
    'deck.totalCards': '张卡片',
    'deck.addCard': '添加卡片',
    'deck.study': '开始复习',
    'deck.due': '待复习',
    'deck.editCard': '编辑卡片',
    'deck.newCard': '新卡片',
    'deck.front': '正面 (问题)',
    'deck.backLabel': '背面 (答案)',
    'deck.cancel': '取消',
    'deck.saveChanges': '保存修改',
    'deck.saveCard': '保存卡片',
    'deck.deleteConfirm': '确定删除这张卡片吗？',
    'deck.noCards': '牌组中还没有卡片。添加一些开始学习吧！',
    'deck.dueNow': '现在',
    'deck.reps': '复习次数',
    'study.exit': '结束复习',
    'study.caughtUp': "复习完成！",
    'study.reviewed': '您今天已经复习了',
    'study.cardsToday': '张卡片。',
    'study.backToDeck': '返回牌组',
    'study.tapToReveal': '点击查看答案',
    'study.again': '重来',
    'study.hard': '困难',
    'study.good': '良好',
    'study.easy': '简单',
    'stats.title': '统计数据',
    'stats.totalCards': '总卡片数',
    'stats.totalReviews': '总复习数',
    'stats.dueToday': '今日待复习',
    'stats.forgettingCurve': '遗忘曲线 (基于平均记忆稳定性)',
    'stats.retention': '记忆保留率 (%)',
    'stats.days': '天数',
    'stats.learningStatus': '学习情况 (近14天复习量)',
    'stats.activityHeatmap': '复习活跃度 (近90天)',
    'stats.less': '少',
    'stats.more': '多',
    'stats.reviews': '复习次数',
    'stats.memoryStability': '记忆持久度 (稳定性分布)',
    'stats.cardCount': '卡片数量',
    'stats.stateDistribution': '卡片状态分布',
    'stats.stateNew': '新卡片',
    'stats.stateLearning': '学习中',
    'stats.stateReview': '复习中',
    'stats.stateRelearning': '重新学习',
    'stats.noData': '暂无数据',
    'stats.upcomingReviews': '未来复习预测 (未来14天)',
    'settings.title': '提醒设置',
    'settings.timeLabel': '每日提醒时间',
    'settings.save': '保存',
    'settings.cancel': '取消',
  }
};

const I18nContext = createContext<I18nContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('zh');
  
  const t = (key: string) => {
    return translations[lang][key as keyof typeof translations['en']] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useTranslation must be used within LanguageProvider');
  return context;
};

