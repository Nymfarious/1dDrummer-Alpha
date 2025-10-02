// Profanity filter based on common inappropriate words
const profaneWords = [
  'fuck', 'shit', 'damn', 'hell', 'ass', 'bitch', 'bastard', 'crap',
  'dick', 'piss', 'cock', 'pussy', 'cunt', 'fag', 'slut', 'whore',
  'nigger', 'nigga', 'retard', 'sex', 'porn', 'xxx'
];

export const containsProfanity = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return profaneWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
};

export const sanitizeName = (name: string): string => {
  return name.trim().substring(0, 50); // Limit to 50 chars
};
