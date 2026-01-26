
import { describe, it, expect } from 'vitest';
import { getSmartNamePlaceholder } from './signup-logic';

describe('getSmartNamePlaceholder', () => {
  const createDate = (hour: number) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return date;
  };

  describe('Japanese Locale (ja)', () => {
    it('returns "早起き 太郎" for Early Morning (04:00 - 08:59)', () => {
      expect(getSmartNamePlaceholder(createDate(4), 'ja')).toBe('早起き 太郎');
      expect(getSmartNamePlaceholder(createDate(8), 'ja')).toBe('早起き 太郎');
    });

    it('returns "朝市 花子" for Morning Market (09:00 - 11:59)', () => {
      expect(getSmartNamePlaceholder(createDate(9), 'ja')).toBe('朝市 花子');
      expect(getSmartNamePlaceholder(createDate(11), 'ja')).toBe('朝市 花子');
    });

    it('returns "食べ歩き 次郎" for Lunch Time (12:00 - 14:59)', () => {
      expect(getSmartNamePlaceholder(createDate(12), 'ja')).toBe('食べ歩き 次郎');
      expect(getSmartNamePlaceholder(createDate(14), 'ja')).toBe('食べ歩き 次郎');
    });

    it('returns "お土産 三郎" for Afternoon (15:00 - 17:59)', () => {
      expect(getSmartNamePlaceholder(createDate(15), 'ja')).toBe('お土産 三郎');
      expect(getSmartNamePlaceholder(createDate(17), 'ja')).toBe('お土産 三郎');
    });

    it('returns "日曜 太郎" for Night/Other (18:00 - 03:59)', () => {
      expect(getSmartNamePlaceholder(createDate(18), 'ja')).toBe('日曜 太郎');
      expect(getSmartNamePlaceholder(createDate(23), 'ja')).toBe('日曜 太郎');
      expect(getSmartNamePlaceholder(createDate(0), 'ja')).toBe('日曜 太郎');
      expect(getSmartNamePlaceholder(createDate(3), 'ja')).toBe('日曜 太郎');
    });
  });

  describe('English Locale (en)', () => {
    it('returns "Early Bird Taro" for Early Morning', () => {
      expect(getSmartNamePlaceholder(createDate(5), 'en-US')).toBe('Early Bird Taro');
    });

    it('returns "Market Hanako" for Morning Market', () => {
      expect(getSmartNamePlaceholder(createDate(10), 'en-GB')).toBe('Market Hanako');
    });

    it('returns "Foodie Jiro" for Lunch Time', () => {
      expect(getSmartNamePlaceholder(createDate(13), 'en')).toBe('Foodie Jiro');
    });

    it('returns "Souvenir Saburo" for Afternoon', () => {
      expect(getSmartNamePlaceholder(createDate(16), 'en')).toBe('Souvenir Saburo');
    });

    it('returns "Sunday Taro" for Night', () => {
      expect(getSmartNamePlaceholder(createDate(20), 'en')).toBe('Sunday Taro');
    });
  });
});
