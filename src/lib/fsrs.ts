import { fsrs, createEmptyCard, Rating, State, type Card as FSRSCard } from 'ts-fsrs';
import type { Flashcard } from './db';

const f = fsrs();

export function createNewCard(deckId: number, front: string, back: string): Flashcard {
  const emptyCard = createEmptyCard();
  return {
    deckId,
    front,
    back,
    createdAt: new Date(),
    ...emptyCard
  };
}

export function rateCard(card: Flashcard, rating: Rating, now: Date = new Date()) {
  const fsrsCard = {
    ...card
  } as FSRSCard;

  const schedulingCards = f.repeat(fsrsCard, now);
  const recordLog = schedulingCards[rating];
  
  return {
    nextCard: {
      ...card,
      ...recordLog.card,
    },
    log: recordLog.log,
  };
}
