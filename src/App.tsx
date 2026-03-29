import { useState } from 'react';
import { Home } from './components/Home';
import { DeckView } from './components/DeckView';
import { StudyView } from './components/StudyView';
import { StatsView } from './components/StatsView';
import { BarChart2, Bell, BellRing, BellOff, Settings } from 'lucide-react';
import { useTranslation } from './lib/i18n';
import { useNotifications } from './lib/useNotifications';

type ViewState = 
  | { type: 'home' }
  | { type: 'deck'; deckId: number }
  | { type: 'study'; deckId: number }
  | { type: 'stats' };

export default function App() {
  const [view, setView] = useState<ViewState>({ type: 'home' });
  const [showSettings, setShowSettings] = useState(false);
  const { t, lang, setLang } = useTranslation();
  const { permission, requestPermission, reminderTime, updateReminderTime } = useNotifications();
  const [tempTime, setTempTime] = useState(reminderTime);

  const handleBellClick = () => {
    if (permission === 'default') {
      requestPermission();
    } else if (permission === 'granted') {
      setTempTime(reminderTime);
      setShowSettings(true);
    }
  };

  const handleSaveSettings = () => {
    updateReminderTime(tempTime);
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 font-bold text-xl tracking-tight cursor-pointer"
            onClick={() => setView({ type: 'home' })}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg leading-none">F</span>
            </div>
            {t('app.title')}
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleBellClick}
              disabled={permission === 'denied' || permission === 'unsupported'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
                permission === 'granted' 
                  ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' 
                  : permission === 'denied'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
              title={
                permission === 'granted' ? t('app.remindersEnabled') :
                permission === 'denied' ? t('app.remindersDenied') :
                permission === 'unsupported' ? t('app.notSupported') :
                t('app.enableReminders')
              }
            >
              {permission === 'granted' ? <BellRing size={18} /> : 
               permission === 'denied' ? <BellOff size={18} /> : 
               <Bell size={18} />}
              <span className="hidden sm:inline text-sm font-medium">
                {permission === 'granted' ? t('app.remindersEnabled') :
                 permission === 'denied' ? t('app.remindersDenied') :
                 permission === 'unsupported' ? t('app.notSupported') :
                 t('app.enableReminders')}
              </span>
            </button>

            <button 
              onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 px-2 py-1 rounded border border-gray-200"
            >
              {lang === 'en' ? '中文' : 'EN'}
            </button>

            {view.type !== 'study' && (
              <button
                onClick={() => setView({ type: 'stats' })}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <BarChart2 size={20} />
                <span className="hidden sm:inline font-medium">{t('nav.stats')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="py-8">
        {view.type === 'home' && (
          <Home onSelectDeck={(id) => setView({ type: 'deck', deckId: id })} />
        )}
        
        {view.type === 'deck' && (
          <DeckView 
            deckId={view.deckId} 
            onBack={() => setView({ type: 'home' })}
            onStudy={() => setView({ type: 'study', deckId: view.deckId })}
          />
        )}

        {view.type === 'study' && (
          <StudyView 
            deckId={view.deckId} 
            onBack={() => setView({ type: 'deck', deckId: view.deckId })}
          />
        )}

        {view.type === 'stats' && (
          <StatsView onBack={() => setView({ type: 'home' })} />
        )}

        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">{t('settings.title')}</h2>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.timeLabel')}
                </label>
                <input 
                  type="time" 
                  value={tempTime}
                  onChange={(e) => setTempTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('settings.cancel')}
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('settings.save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

