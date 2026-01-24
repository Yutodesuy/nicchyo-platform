import { describe, it, expect } from 'vitest';
import { getSmartPlaceholder } from './contact-logic';

describe('getSmartPlaceholder', () => {
  it('should return correct greeting for morning', () => {
    const result = getSmartPlaceholder('question', 8); // 8 AM
    expect(result).toContain('おはようございます');
  });

  it('should return correct greeting for day', () => {
    const result = getSmartPlaceholder('question', 14); // 2 PM
    expect(result).toContain('こんにちは');
  });

  it('should return correct greeting for night', () => {
    const result = getSmartPlaceholder('question', 20); // 8 PM
    expect(result).toContain('こんばんは');
  });

  it('should return correct template for question', () => {
    const result = getSmartPlaceholder('question', 12);
    expect(result).toContain('日曜市の開催時間や');
  });

  it('should return correct template for bug', () => {
    const result = getSmartPlaceholder('bug', 12);
    expect(result).toContain('アプリの不具合について報告します');
    expect(result).toContain('発生した画面:');
  });

  it('should return correct template for feedback', () => {
    const result = getSmartPlaceholder('feedback', 12);
    expect(result).toContain('マップ機能について要望なのですが');
  });

  it('should return correct template for other', () => {
    const result = getSmartPlaceholder('other', 12);
    expect(result).toContain('取材の依頼について');
  });
});
