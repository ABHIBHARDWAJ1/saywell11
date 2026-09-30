export const DEFAULT_PREFS = {
  saveHistory: true, tone: 'Natural', context: 'Partner', language: 'auto', keepHinglish: false, length: 'normal', voice: 35,
  onboarded: false, goals: [], audiences: [], directness: 50, focus: '', reduceMotion: false, theme: 'dark', weeklyCard: true
};
export const S = { user: null, auth: null, db: null, prefs: { ...DEFAULT_PREFS }, cache: {}, go: () => {}, pending: null };
export const firstName = () => (S.user?.displayName || S.user?.email || 'there').split(/[\s@]/)[0];
