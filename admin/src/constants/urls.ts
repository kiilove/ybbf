export const getMainSiteUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4100';
  }
  return 'https://ybbf.org';
};
