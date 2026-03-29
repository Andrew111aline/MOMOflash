import { useState, useEffect } from 'react';
import { db } from './db';
import { useTranslation } from './i18n';

export function useNotifications() {
  const { lang } = useTranslation();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [reminderTime, setReminderTime] = useState<string>(
    localStorage.getItem('fsrs_reminder_time') || '20:00'
  );

  const updateReminderTime = (time: string) => {
    setReminderTime(time);
    localStorage.setItem('fsrs_reminder_time', time);
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert(lang === 'en' ? 'Browser does not support notifications' : '浏览器不支持通知');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === 'granted') {
        checkDueCards();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const checkDueCards = async () => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    try {
      const now = new Date();
      const dueCount = await db.cards.where('due').belowOrEqual(now).count();
      
      if (dueCount > 0) {
        const title = lang === 'en' ? 'Time to Review!' : '该复习啦！';
        const body = lang === 'en' 
          ? `You have ${dueCount} cards due for review.` 
          : `您有 ${dueCount} 张卡片待复习。`;
          
        new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
        });
      }
    } catch (error) {
      console.error('Error checking due cards for notification:', error);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkDueCards();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Check periodically (every 1 minute) to see if it's the reminder time
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      
      if (currentTime === reminderTime) {
        const lastReminded = localStorage.getItem('fsrs_last_reminded');
        const todayStr = now.toDateString();
        
        if (lastReminded !== todayStr) {
          checkDueCards();
          localStorage.setItem('fsrs_last_reminded', todayStr);
        }
      }
    }, 60 * 1000);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [lang, reminderTime]);

  return { permission, requestPermission, checkDueCards, reminderTime, updateReminderTime };
}
