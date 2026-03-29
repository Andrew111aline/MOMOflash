import Dexie, { type Table } from 'dexie';
import { type Card as FSRSCard, State } from 'ts-fsrs';

export interface Deck {
  id?: number;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Flashcard {
  id?: number;
  deckId: number;
  front: string;
  back: string;
  createdAt: Date;
  
  // FSRS Card properties
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: State;
  last_review?: Date;
  step?: number;
  learning_steps?: number;
}

export interface ReviewLog {
  id?: number;
  cardId: number;
  rating: number;
  state: State;
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  last_elapsed_days: number;
  scheduled_days: number;
  review_time: Date;
}

export class FlashcardDB extends Dexie {
  decks!: Table<Deck, number>;
  cards!: Table<Flashcard, number>;
  reviewLogs!: Table<ReviewLog, number>;

  constructor() {
    super('FlashcardDB');
    this.version(1).stores({
      decks: '++id, name, createdAt',
      cards: '++id, deckId, due, state, createdAt',
      reviewLogs: '++id, cardId, review_time'
    });
  }
}

export const db = new FlashcardDB();
