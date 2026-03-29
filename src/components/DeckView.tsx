import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Flashcard } from '../lib/db';
import { createNewCard } from '../lib/fsrs';
import { ArrowLeft, Play, Plus, Trash2, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '../lib/i18n';

export function DeckView({ deckId, onBack, onStudy }: { deckId: number; onBack: () => void; onStudy: () => void }) {
  const { t } = useTranslation();
  const deck = useLiveQuery(() => db.decks.get(deckId));
  const cards = useLiveQuery(() => db.cards.where('deckId').equals(deckId).reverse().sortBy('createdAt'));
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  const dueCount = cards?.filter(c => c.due <= new Date()).length || 0;

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    
    if (editingCard && editingCard.id) {
      await db.cards.update(editingCard.id, {
        front: front.trim(),
        back: back.trim()
      });
      setEditingCard(null);
    } else {
      const newCard = createNewCard(deckId, front.trim(), back.trim());
      await db.cards.add(newCard);
    }
    
    setFront('');
    setBack('');
    setIsAdding(false);
  };

  const handleEditClick = (card: Flashcard) => {
    setEditingCard(card);
    setFront(card.front);
    setBack(card.back);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCard = async (id: number) => {
    if (confirm(t('deck.deleteConfirm'))) {
      await db.cards.delete(id);
    }
  };

  if (!deck) return <div>{t('home.loading')}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        {t('deck.back')}
      </button>

      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{deck.name}</h1>
          <p className="text-gray-500">{cards?.length || 0} {t('deck.totalCards')}</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingCard(null);
              setFront('');
              setBack('');
              setIsAdding(!isAdding);
            }}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Plus size={20} />
            {t('deck.addCard')}
          </button>
          <button
            onClick={onStudy}
            disabled={dueCount === 0}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={20} />
            {t('deck.study')} ({dueCount} {t('deck.due')})
          </button>
        </div>
      </div>

      {isAdding && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          onSubmit={handleAddCard}
        >
          <h2 className="text-lg font-semibold mb-4">{editingCard ? t('deck.editCard') : t('deck.newCard')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('deck.front')}</label>
              <textarea
                value={front}
                onChange={(e) => setFront(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('deck.backLabel')}</label>
              <textarea
                value={back}
                onChange={(e) => setBack(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingCard(null);
                  setFront('');
                  setBack('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                {t('deck.cancel')}
              </button>
              <button
                type="submit"
                className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {editingCard ? t('deck.saveChanges') : t('deck.saveCard')}
              </button>
            </div>
          </div>
        </motion.form>
      )}

      <div className="space-y-4">
        {cards?.map((card) => (
          <div key={card.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start group">
            <div className="grid grid-cols-2 gap-8 flex-1">
              <div>
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">{t('deck.front')}</div>
                <div className="text-gray-900 whitespace-pre-wrap">{card.front}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">{t('deck.backLabel')}</div>
                <div className="text-gray-700 whitespace-pre-wrap">{card.back}</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 ml-4">
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditClick(card)}
                  className="text-gray-400 hover:text-blue-500"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => card.id && handleDeleteCard(card.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="text-xs text-gray-400 text-right mt-2">
                {t('deck.due')}: {card.due <= new Date() ? t('deck.dueNow') : formatDistanceToNow(card.due, { addSuffix: true })}
                <br />
                {t('deck.reps')}: {card.reps}
              </div>
            </div>
          </div>
        ))}
        {cards?.length === 0 && !isAdding && (
          <div className="text-center py-12 text-gray-500">
            {t('deck.noCards')}
          </div>
        )}
      </div>
    </div>
  );
}
