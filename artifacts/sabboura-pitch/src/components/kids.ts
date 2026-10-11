export type BadgeKind = 'lost' | 'partly' | 'gotit' | 'bored';

export interface Kid {
  id: string;
  name: string;
  nameAr: string;
  trait: string;
  misconception: string;
}

/** The fractions class, as defined in the product spec. */
export const KIDS: Kid[] = [
  {
    id: 'omar',
    name: 'Omar',
    nameAr: 'عمر',
    trait: 'Confident, hand always up',
    misconception: '“3 is bigger than 2, so ⅓ must be bigger than ½.”',
  },
  {
    id: 'lina',
    name: 'Lina',
    nameAr: 'لينا',
    trait: 'Shy, never volunteers',
    misconception: 'Sees a fraction as two separate numbers. Speaks only when asked by name.',
  },
  {
    id: 'sara',
    name: 'Sara',
    nameAr: 'سارة',
    trait: 'Always asks “but why?”',
    misconception: 'Memorised the rule, with no idea why it works.',
  },
  {
    id: 'khaled',
    name: 'Khaled',
    nameAr: 'خالد',
    trait: 'Practical',
    misconception: '“When will I ever use this?” Needs it in real life.',
  },
  {
    id: 'yazan',
    name: 'Yazan',
    nameAr: 'يزن',
    trait: 'Fast learner',
    misconception: 'Already gets it. Bored unless you challenge him.',
  },
];

export const BADGE_LABEL: Record<BadgeKind, string> = {
  lost: 'Lost',
  partly: 'Partly',
  gotit: 'Got it',
  bored: 'Bored',
};
