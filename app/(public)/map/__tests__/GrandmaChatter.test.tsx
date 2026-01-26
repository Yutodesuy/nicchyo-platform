import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import GrandmaChatter from '../components/GrandmaChatter';

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('GrandmaChatter', () => {
  const getCommentText = () => {
    const button = screen.getByRole('button', { name: 'おばあちゃんのつぶやきを見る' });
    const textNode = button.querySelector('p');
    return textNode?.textContent?.trim() ?? '';
  };

  it('cycles to another comment on tap', () => {
    render(<GrandmaChatter />);

    const firstText = getCommentText();
    expect(firstText.length).toBeGreaterThan(0);

    const button = screen.getByRole('button', { name: 'おばあちゃんのつぶやきを見る' });
    fireEvent.click(button);

    const nextText = getCommentText();
    expect(nextText.length).toBeGreaterThan(0);
    expect(nextText).not.toBe(firstText);
  });

  it('auto-rotates after interval', () => {
    vi.useFakeTimers();
    render(<GrandmaChatter />);

    const firstText = getCommentText();

    act(() => {
      vi.advanceTimersByTime(7000);
    });

    const afterText = getCommentText();
    expect(afterText).not.toBe(firstText);
    vi.useRealTimers();
  });
});
