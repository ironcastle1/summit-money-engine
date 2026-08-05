export function evidenceGrade(confidence, sourceCount = 0) {
  const value = Number(confidence) || 0;
  if (value >= 85 && sourceCount >= 3) return 'A';
  if (value >= 70 && sourceCount >= 2) return 'B';
  if (value >= 50) return 'C';
  if (value > 0) return 'D';
  return 'U';
}
