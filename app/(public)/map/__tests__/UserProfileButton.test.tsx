import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import UserProfileButton from '../components/UserProfileButton';
import { useAuth } from '@/lib/auth/AuthContext';

// Mock the module
vi.mock('@/lib/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('UserProfileButton', () => {
  it('renders user name and email when logged in', () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        name: 'Test User',
        email: 'test@example.com',
        avatarUrl: null,
      },
    });

    render(<UserProfileButton />);

    // Open the menu
    const toggleButton = screen.getByRole('button', { name: 'ユーザーメニューを開く' });
    fireEvent.click(toggleButton);

    expect(screen.getByText('Test User')).toBeDefined();
    expect(screen.getByText('test@example.com')).toBeDefined();
  });

  it('renders "ゲストさん" when not logged in', () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
    });

    render(<UserProfileButton />);

    // Open the menu
    const toggleButton = screen.getByRole('button', { name: 'ユーザーメニューを開く' });
    fireEvent.click(toggleButton);

    expect(screen.getByText('ゲストさん')).toBeDefined();
  });
});
