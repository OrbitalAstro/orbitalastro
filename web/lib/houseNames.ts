// House names mapping
export const houseNames: Record<number, string> = {
  1: 'First House',
  2: 'Second House',
  3: 'Third House',
  4: 'Fourth House',
  5: 'Fifth House',
  6: 'Sixth House',
  7: 'Seventh House',
  8: 'Eighth House',
  9: 'Ninth House',
  10: 'Tenth House',
  11: 'Eleventh House',
  12: 'Twelfth House'
};

export const getHouseName = (houseNumber: number): string => {
  return houseNames[houseNumber] || `House ${houseNumber}`;
};
