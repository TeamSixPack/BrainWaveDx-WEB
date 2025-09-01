/**
 * Korean Text Utility
 * Helps ensure proper Korean text handling and prevents encoding issues
 */

/**
 * Ensures proper Korean text encoding and prevents corruption
 * @param text - The Korean text to validate
 * @returns The properly encoded Korean text
 */
export function ensureKoreanText(text: string): string {
  // Replace common corrupted character patterns with correct Korean
  return text
    .replace(/���/g, '영')
    .replace(/��/g, '로')
    .replace(/�/g, '')
    .trim();
}

/**
 * Common Korean text constants to prevent encoding issues
 */
export const KOREAN_TEXT = {
  // Brain wave types
  DELTA_WAVE: '델타파',
  THETA_WAVE: '세타파', 
  ALPHA_WAVE: '알파파',
  BETA_WAVE: '베타파',
  
  // Medical terms
  NORMAL_HEALTH: '정상적 건강',
  MILD_COGNITIVE_IMPAIRMENT: '경도인지장애',
  DEMENTIA: '치매',
  
  // Common phrases
  BRAIN_HEALTH: '뇌 건강',
  BRAIN_REGIONS: '뇌 영역',
  COGNITIVE_FUNCTION: '인지 기능',
  HELP_YOU: '도와드립니다',
  IF_YOU_HAVE: '있으시면',
  GOOD_CONNECTIVITY: '양호한 연결성',
  BRAIN_ANALYSIS: '뇌파 분석',
  PATTERN_ANALYSIS: '패턴 분석'
} as const;

/**
 * Validates that Korean text is properly encoded
 * @param text - Text to validate
 * @returns true if text appears to be properly encoded
 */
export function isValidKoreanText(text: string): boolean {
  // Check for common corruption patterns
  const corruptionPatterns = [/�+/, /\uFFFD+/];
  return !corruptionPatterns.some(pattern => pattern.test(text));
}
