import type { CategoryId, DeckManifest } from "@ask-me-more/contracts";

export type SeededDeck = {
  categoryId: CategoryId;
  questions: string[];
};

export const deckManifest: DeckManifest = {
  version: "2026.04.17",
  generatedAt: new Date("2026-04-17T00:00:00.000Z").toISOString(),
  categories: [
    {
      id: "discovery",
      label: "Self Discovery",
      description: "Explore who you truly are",
      iconKey: "sparkle",
      accentColor: "#7B4F8E",
      backgroundColor: "#F4EDF8",
      accessLevel: "free",
      totalQuestions: 24,
    },
    {
      id: "dreams",
      label: "Dreams & Goals",
      description: "Share your visions for the future",
      iconKey: "target",
      accentColor: "#2B6A8B",
      backgroundColor: "#E8F3F9",
      accessLevel: "free",
      totalQuestions: 18,
    },
    {
      id: "playful",
      label: "Playful & Fun",
      description: "Light-hearted conversation starters",
      iconKey: "sun",
      accentColor: "#B86B15",
      backgroundColor: "#FEF3E4",
      accessLevel: "free",
      totalQuestions: 30,
    },
    {
      id: "deeper",
      label: "Going Deeper",
      description: "Questions that reveal your soul",
      iconKey: "layers",
      accentColor: "#8B2020",
      backgroundColor: "#FDECEA",
      accessLevel: "premium",
      totalQuestions: 22,
    },
    {
      id: "values",
      label: "Core Values",
      description: "What truly matters to you both",
      iconKey: "shield",
      accentColor: "#1F7A4B",
      backgroundColor: "#E8F6EE",
      accessLevel: "premium",
      totalQuestions: 16,
    },
    {
      id: "intimacy",
      label: "Intimacy & Love",
      description: "Deepen your emotional connection",
      iconKey: "heart",
      accentColor: "#8B2252",
      backgroundColor: "#FCE8F1",
      accessLevel: "premium",
      totalQuestions: 20,
    },
  ],
  quotes: [
    {
      text: "The real voyage of discovery consists not in seeking new landscapes, but in having new eyes.",
      author: "Marcel Proust",
    },
    {
      text: "Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.",
      author: "Lao Tzu",
    },
    {
      text: "You do not love someone for their looks, or their clothes. You love them because they sing a song only you can hear.",
      author: "Oscar Wilde",
    },
  ],
};

export const seededDecks: SeededDeck[] = [
  {
    categoryId: "discovery",
    questions: [
      "What moment from your childhood shaped who you are most deeply, and how do you still carry it today?",
      "If you could relive one perfectly ordinary day of your life exactly as it was, which day would you choose and why?",
      "What is one belief you once held firmly that you have since completely let go of, and what changed your mind?",
      "Describe a version of yourself you have grown away from. Is there anything you still quietly miss about them?",
      "What is something about yourself that took you the longest to truly accept?",
    ],
  },
  {
    categoryId: "dreams",
    questions: [
      "Where do you picture yourself in ten years, not career-wise, but emotionally and personally?",
      "Is there a dream you have quietly set aside that still resurfaces when you are alone with your thoughts?",
      "What kind of home environment do you dream of, and what feeling would it give you walking through the door?",
      "If money and practicality were no concern, how would you spend every Tuesday afternoon for the rest of your life?",
      "What is one adventure you have always imagined us taking together someday, but have not said out loud yet?",
    ],
  },
  {
    categoryId: "playful",
    questions: [
      "If our relationship were a movie, what genre would it be and who would you cast to play each of us?",
      "What is one completely irrational food opinion you will passionately defend for the rest of your life?",
      "If you could instantly become an expert in any one skill just to impress me, what would you choose?",
      "What is the most embarrassing thing you have Googled in the past month that you would actually admit to?",
      "If we had our own reality show, what would it be called and what would the cameras mostly catch us doing?",
    ],
  },
  {
    categoryId: "deeper",
    questions: [
      "Is there something you have never said out loud that you have been quietly carrying for a long time?",
      "What does home truly mean to you: a place, a feeling, or a specific person?",
      "When do you feel most alone, even when you are surrounded by people who care about you?",
      "What is a version of yourself you are still slowly becoming, and what is standing in the way?",
      "What do you wish people understood about you that they almost never seem to?",
    ],
  },
  {
    categoryId: "values",
    questions: [
      "What is one principle you would never compromise on, regardless of the cost or consequence?",
      "How do you define success today, and has that shifted since we have been together?",
      "What does loyalty actually look like in practice to you, beyond just the word itself?",
      "What human quality do you think is the most underrated in the world today?",
      "What does fairness mean to you in a relationship, and do you think we genuinely live it?",
    ],
  },
  {
    categoryId: "intimacy",
    questions: [
      "When do you feel most deeply loved by me, and what does that moment usually look like?",
      "Is there a way I could better show up for you that you have been a little hesitant to ask for?",
      "What is something small I do that means far more to you than I probably realize?",
      "What feeling do you most want to experience more of in our relationship going forward?",
      "When you imagine us together 30 years from now, what is the one thing you hope stays exactly the same?",
    ],
  },
];

export const seededDeckMap = Object.fromEntries(
  seededDecks.map((deck) => [deck.categoryId, deck.questions]),
) as Record<CategoryId, string[]>;
