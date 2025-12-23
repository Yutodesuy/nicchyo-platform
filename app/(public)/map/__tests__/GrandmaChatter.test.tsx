import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GrandmaChatter from '../components/GrandmaChatter';
import { grandmaCommentPool } from '../services/grandmaCommentService';

describe('GrandmaChatter', () => {
  it('renders the first comment and cycles on tap', () => {
    render(<GrandmaChatter />);

    const first = grandmaCommentPool[0];
    expect(screen.getByText(first.text)).toBeInTheDocument();

    const button = screen.getByRole('button', { name: 'ばあちゃんのコメントを開く' });
    fireEvent.click(button);

    const second = grandmaCommentPool[1];
    expect(screen.getByText(second.text)).toBeInTheDocument();
  });

  it('auto-rotates to the next comment after interval', () => {
    vi.useFakeTimers();
    render(<GrandmaChatter />);

    const second = grandmaCommentPool[1];
    vi.advanceTimersByTime(60000);

    expect(screen.getByText(second.text)).toBeInTheDocument();
    vi.useRealTimers();
  });
});
