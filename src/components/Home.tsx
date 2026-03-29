import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Plus, BookOpen, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from '../lib/i18n';

export function Home({ onSelectDeck }: { onSelectDeck: (id: number) => void }) {
  const { t } = useTranslation();
  const decks = useLiveQuery(() => db.decks.toArray());
  const [newDeckName, setNewDeckName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    await db.decks.add({
      name: newDeckName.trim(),
      createdAt: new Date(),
    });
    setNewDeckName('');
    setIsAdding(false);
  };

  const handleDeleteDeck = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('home.deleteConfirm'))) {
      await db.decks.delete(id);
      await db.cards.where('deckId').equals(id).delete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('home.myDecks')}</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          {t('home.newDeck')}
        </button>
      </div>

      {isAdding && (
        <motion.form
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100"
          onSubmit={handleAddDeck}
        >
          <div className="flex gap-4">
            <input
              type="text"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder={t('home.deckName')}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {t('home.create')}
            </button>
          </div>
        </motion.form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks?.map((deck) => (
          <motion.div
            key={deck.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer group relative"
            onClick={() => deck.id && onSelectDeck(deck.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <BookOpen size={24} />
              </div>
              <button
                onClick={(e) => deck.id && handleDeleteDeck(deck.id, e)}
                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{deck.name}</h2>
            <DeckStats deckId={deck.id!} />
          </motion.div>
        ))}
        {decks?.length === 0 && !isAdding && (
          <div className="col-span-full text-center py-12 text-gray-500">
            {t('home.noDecks')}
          </div>
        )}
      </div>
    </div>
  );
}

function DeckStats({ deckId }: { deckId: number }) {
  const { t } = useTranslation();
  const stats = useLiveQuery(async () => {
    const now = new Date();
    const cards = await db.cards.where('deckId').equals(deckId).toArray();
    const due = cards.filter(c => c.due <= now).length;
    return { total: cards.length, due };
  }, [deckId]);

  if (!stats) return <div className="text-sm text-gray-500">{t('home.loading')}</div>;

  return (
    <div className="flex gap-4 text-sm">
      <span className="text-gray-500">{stats.total} {t('home.cards')}</span>
      {stats.due > 0 && (
        <span className="text-orange-600 font-medium">{stats.due} {t('home.due')}</span>
      )}
    </div>
  );
}
