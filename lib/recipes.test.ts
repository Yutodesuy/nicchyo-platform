import { describe, it, expect } from 'vitest';
import { getSeasonalRecipeIds, pickDailyRecipe, seasonalCollections } from './recipes';

describe('lib/recipes', () => {
  describe('getSeasonalRecipeIds', () => {
    it('returns spring recipes for March, April, May', () => {
      // March 15
      const springDate = new Date(2023, 2, 15);
      const ids = getSeasonalRecipeIds(springDate);
      const springCollection = seasonalCollections.find(c => c.id === 'spring');
      expect(ids).toEqual(springCollection?.recipeIds);
    });

    it('returns summer recipes for June, July, August', () => {
      // July 1
      const summerDate = new Date(2023, 6, 1);
      const ids = getSeasonalRecipeIds(summerDate);
      const summerCollection = seasonalCollections.find(c => c.id === 'summer');
      expect(ids).toEqual(summerCollection?.recipeIds);
    });

    it('returns autumn recipes for September, October, November', () => {
      // October 31
      const autumnDate = new Date(2023, 9, 31);
      const ids = getSeasonalRecipeIds(autumnDate);
      const autumnCollection = seasonalCollections.find(c => c.id === 'autumn');
      expect(ids).toEqual(autumnCollection?.recipeIds);
    });

    it('returns winter recipes for December, January, February', () => {
      // January 1
      const winterDate = new Date(2023, 0, 1);
      const ids = getSeasonalRecipeIds(winterDate);
      const winterCollection = seasonalCollections.find(c => c.id === 'winter');
      expect(ids).toEqual(winterCollection?.recipeIds);
    });

    it('handles boundary cases correctly (Spring start)', () => {
        // March 1
        const date = new Date(2023, 2, 1);
        const ids = getSeasonalRecipeIds(date);
        const springCollection = seasonalCollections.find(c => c.id === 'spring');
        expect(ids).toEqual(springCollection?.recipeIds);
    });

    it('handles boundary cases correctly (Winter end)', () => {
        // February 28
        const date = new Date(2023, 1, 28);
        const ids = getSeasonalRecipeIds(date);
        const winterCollection = seasonalCollections.find(c => c.id === 'winter');
        expect(ids).toEqual(winterCollection?.recipeIds);
    });

    it('handles invalid date input gracefully (defaults to winter fallback)', () => {
        const invalidDate = new Date('invalid-date-string');
        const ids = getSeasonalRecipeIds(invalidDate);
        // Since NaN < 3 is false, and all checks fail, it falls through to 'winter' in the ternary chain
        const winterCollection = seasonalCollections.find(c => c.id === 'winter');
        expect(ids).toEqual(winterCollection?.recipeIds);
    });
  });

  describe('pickDailyRecipe', () => {
    it('returns a recipe object', () => {
      const recipe = pickDailyRecipe(new Date());
      expect(recipe).toHaveProperty('id');
      expect(recipe).toHaveProperty('title');
      expect(recipe).toHaveProperty('description');
    });

    it('is deterministic for the same date', () => {
      const date1 = new Date(2023, 4, 5); // May 5
      const date2 = new Date(2023, 4, 5);

      const recipe1 = pickDailyRecipe(date1);
      const recipe2 = pickDailyRecipe(date2);

      expect(recipe1.id).toBe(recipe2.id);
    });

    it('returns a recipe from the correct season', () => {
        // Summer date -> expect summer recipe
        const summerDate = new Date(2023, 7, 15); // August
        const recipe = pickDailyRecipe(summerDate);
        const summerIds = seasonalCollections.find(c => c.id === 'summer')?.recipeIds;
        expect(summerIds).toContain(recipe.id);
    });

    it('handles default parameter (current date)', () => {
        const recipe = pickDailyRecipe();
        expect(recipe).toBeDefined();
        expect(recipe).toHaveProperty('id');
    });
  });
});
