import { useState, useEffect } from 'react';
import { db, type Flashcard } from '../lib/db';
import { rateCard } from '../lib/fsrs';
import { Rating } from 'ts-fsrs';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../lib/i18n';

export function StudyView({ deckId, onBack }: { deckId: number; onBack: () => void }) {
  const { t } = useTranslation();
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDueCards = async () => {
      const now = new Date();
      const cards = await db.cards
        .where('deckId')
        .equals(deckId)
        .filter(c => c.due <= now)
        .toArray();
      
      // Shuffle cards slightly for variety
      setDueCards(cards.sort(() => Math.random() - 0.5));
      setIsLoading(false);
    };
    loadDueCards();
  }, [deckId]);

  const handleRate = async (rating: Rating) => {
    const currentCard = dueCards[currentIndex];
    if (!currentCard || !currentCard.id) return;

    const { nextCard, log } = rateCard(currentCard, rating);

    // Update card in DB
    await db.cards.update(currentCard.id, nextCard);
    
    // Save review log
    await db.reviewLogs.add({
      cardId: currentCard.id,
      rating,
      state: currentCard.state,
      due: currentCard.due,
      stability: currentCard.stability,
      difficulty: currentCard.difficulty,
      elapsed_days: currentCard.elapsed_days,
      last_elapsed_days: log.last_elapsed_days,
      scheduled_days: currentCard.scheduled_days,
      review_time: new Date(),
    });

    // Move to next card
    setIsFlipped(false);
    setCurrentIndex(prev => prev + 1);
  };

  if (isLoading) return <div className="flex justify-center p-12">{t('home.loading')}</div>;

  if (currentIndex >= dueCards.length) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center mt-20">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('study.caughtUp')}</h2>
          <p className="text-gray-500 mb-8">{t('study.reviewed')} {dueCards.length} {t('study.cardsToday')}</p>
          <button
            onClick={onBack}
            className="bg-gray-900 text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
          >
            {t('study.backToDeck')}
          </button>
        </motion.div>
      </div>
    );
  }

  const card = dueCards[currentIndex];
  const progress = ((currentIndex) / dueCards.length) * 100;

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          {t('study.exit')}
        </button>
        <div className="text-sm font-medium text-gray-500">
          {currentIndex + 1} / {dueCards.length}
        </div>
      </div>

      <div className="w-full bg-gray-200 h-2 rounded-full mb-12 overflow-hidden">
        <div 
          className="bg-blue-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center -mt-20" style={{ perspective: 1000 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id + (isFlipped ? '-back' : '-front')}
            initial={{ opacity: 0, rotateX: isFlipped ? -90 : 90 }}
            animate={{ opacity: 1, rotateX: 0 }}
            exit={{ opacity: 0, rotateX: isFlipped ? 90 : -90 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl bg-white min-h-[400px] p-12 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center cursor-pointer"
            onClick={() => !isFlipped && setIsFlipped(true)}
          >
            <div className="text-2xl md:text-4xl text-gray-900 font-medium whitespace-pre-wrap leading-relaxed">
              {isFlipped ? card.back : card.front}
            </div>
            
            {!isFlipped && (
              <div className="absolute bottom-8 text-gray-400 text-sm font-medium uppercase tracking-widest animate-pulse">
                {t('study.tapToReveal')}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-2xl mt-8 grid grid-cols-4 gap-4"
          >
            <RateButton
              label={t('study.again')}
              subLabel="< 1m"
              color="bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
              onClick={() => handleRate(Rating.Again)}
            />
            <RateButton
              label={t('study.hard')}
              subLabel="1d"
              color="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200"
              onClick={() => handleRate(Rating.Hard)}
            />
            <RateButton
              label={t('study.good')}
              subLabel="3d"
              color="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
              onClick={() => handleRate(Rating.Good)}
            />
            <RateButton
              label={t('study.easy')}
              subLabel="5d"
              color="bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
              onClick={() => handleRate(Rating.Easy)}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

function RateButton({ label, subLabel, color, onClick }: { label: string; subLabel: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all active:scale-95 ${color}`}
    >
      <span className="font-bold text-lg mb-1">{label}</span>
      <span className="text-xs opacity-70 font-medium">{subLabel}</span>
    </button>
  );
}
