import { describe, it, expect } from 'vitest';
import { getSmartRecipePlaceholder } from '../recipes-smart-defaults';

describe('getSmartRecipePlaceholder', () => {
  it('should return Spring suggestion (Tomato) and Breakfast context in the morning', () => {
    // 4月 1日 8:00 (Spring, Morning)
    const date = new Date(2024, 3, 1, 8, 0, 0); // Month is 0-indexed in JS Date: 3 = April
    const result = getSmartRecipePlaceholder(date);
    expect(result).toBe('料理・食材名で検索（例：トマト、朝ごはん）');
  });

  it('should return Summer suggestion (Eggplant) and Lunch context at noon', () => {
    // 7月 15日 12:00 (Summer, Lunch)
    const date = new Date(2024, 6, 15, 12, 0, 0); // 6 = July
    const result = getSmartRecipePlaceholder(date);
    expect(result).toBe('料理・食材名で検索（例：ナス、お弁当）');
  });

  it('should return Autumn suggestion (Ginger) and Snack context in afternoon', () => {
    // 10月 10日 15:00 (Autumn, Snack)
    const date = new Date(2024, 9, 10, 15, 0, 0); // 9 = October
    const result = getSmartRecipePlaceholder(date);
    expect(result).toBe('料理・食材名で検索（例：生姜、おやつ）');
  });

  it('should return Winter suggestion (Buntan) and Dinner context in evening', () => {
    // 1月 20日 19:00 (Winter, Dinner)
    const date = new Date(2024, 0, 20, 19, 0, 0); // 0 = January
    const result = getSmartRecipePlaceholder(date);
    expect(result).toBe('料理・食材名で検索（例：文旦、おつまみ）');
  });

  it('should return default fallback for late night', () => {
    // 12月 31日 23:00 (Winter, Late Night)
    const date = new Date(2024, 11, 31, 23, 0, 0); // 11 = December
    const result = getSmartRecipePlaceholder(date);
    expect(result).toBe('料理・食材名で検索（例：文旦、作り置き）');
  });
});
