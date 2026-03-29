import { useState } from 'react';
import { Home } from './components/Home';
import { DeckView } from './components/DeckView';
import { StudyView } from './components/StudyView';
import { StatsView } from './components/StatsView';
import { BarChart2, Bell, BellRing, BellOff, Download, Settings, X } from 'lucide-react';
import { useTranslation } from './lib/i18n';
import { useNotifications } from './lib/useNotifications';
import { usePwaInstall } from './lib/usePwaInstall';

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
  const {
    isInstallable,
    canShowManualGuide,
    needsAndroidSecureOriginHelp,
    shouldShowInstallBanner,
    showIosGuide,
    setShowIosGuide,
    dismissBanner,
    promptInstall,
  } = usePwaInstall();
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
            {(isInstallable || canShowManualGuide) && (
              <button
                onClick={() => void promptInstall()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                title={t('app.install')}
              >
                <Download size={18} />
                <span className="hidden sm:inline text-sm font-medium">{t('app.install')}</span>
              </button>
            )}

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

      {shouldShowInstallBanner && (
        <div className="bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">{t('app.installTitle')}</p>
              <p className="text-sm text-blue-100">{t('app.installDescription')}</p>
              {canShowManualGuide && (
                <p className="text-xs text-blue-100 mt-1">{t('app.installIosHint')}</p>
              )}
              {needsAndroidSecureOriginHelp && (
                <p className="text-xs text-blue-100 mt-1">{t('app.installAndroidHint')}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!needsAndroidSecureOriginHelp && (
                <button
                  onClick={() => void promptInstall()}
                  className="px-4 py-2 rounded-lg bg-white text-blue-700 font-medium hover:bg-blue-50 transition-colors"
                >
                  {t('app.installButton')}
                </button>
              )}
              <button
                onClick={dismissBanner}
                className="px-4 py-2 rounded-lg border border-blue-300 text-white hover:bg-blue-500 transition-colors"
              >
                {t('app.installLater')}
              </button>
            </div>
          </div>
        </div>
      )}

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

        {showIosGuide && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{t('app.installGuideTitle')}</h2>
                <button
                  onClick={() => setShowIosGuide(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={t('app.close')}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 text-sm text-gray-700">
                <p>{t('app.installGuideStep1')}</p>
                <p>{t('app.installGuideStep2')}</p>
                <p>{t('app.installGuideStep3')}</p>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowIosGuide(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('app.close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

