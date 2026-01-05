import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import GrandmaChatter from '../components/GrandmaChatter';

describe('GrandmaChatter', () => {
  const getCommentText = () => {
    const button = screen.getByRole('button', { name: 'ばあちゃんのコメントを開く' });
    const textNode = button.querySelector('p');
    return textNode?.textContent?.trim() ?? '';
  };

  it('cycles to another comment on tap', () => {
    render(<GrandmaChatter />);

    const firstText = getCommentText();
    expect(firstText.length).toBeGreaterThan(0);

    const button = screen.getByRole('button', { name: 'ばあちゃんのコメントを開く' });
    fireEvent.click(button);

    const nextText = getCommentText();
    expect(nextText.length).toBeGreaterThan(0);
    expect(nextText).not.toBe(firstText);
  });

  it('does not auto-rotate after interval', () => {
    vi.useFakeTimers();
    render(<GrandmaChatter />);

    const firstText = getCommentText();

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    const afterText = getCommentText();
    expect(afterText).toBe(firstText);
    vi.useRealTimers();
  });
});
