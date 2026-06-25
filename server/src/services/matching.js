const keywordTags = {
  pet: ['dog', 'cat', 'collar', 'leash', 'paw', 'fur', 'bird'],
  phone: ['iphone', 'android', 'samsung', 'case', 'screen', 'charger'],
  wallet: ['wallet', 'card', 'cash', 'id', 'license'],
  bag: ['bag', 'backpack', 'purse', 'tote', 'laptop'],
  keys: ['keys', 'keychain', 'car key', 'house key'],
  jewelry: ['ring', 'chain', 'bracelet', 'watch', 'earring'],
  document: ['passport', 'certificate', 'id', 'book', 'file']
};

function tokenize(value = '') {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function buildTags(notice) {
  const text = [
    notice.category,
    notice.title,
    notice.description,
    notice.location,
    notice.imageUrl
  ].join(' ');

  const tokens = tokenize(text);
  const inferred = Object.entries(keywordTags)
    .flatMap(([category, words]) => (notice.category === category ? words : words.filter((word) => text.toLowerCase().includes(word))));

  return [...new Set([notice.category, ...tokens.slice(0, 12), ...inferred])].slice(0, 16);
}

export function findMatches(notice, candidates) {
  const noticeTags = new Set(notice.tags || []);
  const noticeLocation = tokenize(notice.location);

  return candidates
    .map((candidate) => {
      const sharedTags = (candidate.tags || []).filter((tag) => noticeTags.has(tag));
      const sharedLocation = tokenize(candidate.location).filter((part) => noticeLocation.includes(part));
      const categoryBoost = candidate.category === notice.category ? 3 : 0;
      const score = sharedTags.length * 2 + sharedLocation.length + categoryBoost;

      return {
        notice: candidate,
        score,
        reasons: [
          sharedTags.length ? `${sharedTags.length} similar tag${sharedTags.length === 1 ? '' : 's'}` : '',
          sharedLocation.length ? 'nearby location text' : '',
          categoryBoost ? 'same category' : ''
        ].filter(Boolean)
      };
    })
    .filter((match) => match.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
