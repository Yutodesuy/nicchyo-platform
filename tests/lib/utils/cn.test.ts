import { describe, it, expect } from 'vitest';
import { cn } from '../../../lib/utils/cn';

describe('cn utility function', () => {
  it('should merge tailwind classes correctly', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('should handle conditional classes', () => {
    expect(cn('p-2', true && 'text-red-500', false && 'text-blue-500')).toBe('p-2 text-red-500');
  });

  it('should handle empty inputs gracefully', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(null, undefined, false)).toBe('');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['p-2', 'text-center'])).toBe('p-2 text-center');
  });

  it('should merge clsx formats', () => {
    expect(cn('p-2', { 'text-red-500': true, 'bg-blue-500': false })).toBe('p-2 text-red-500');
  });
});
