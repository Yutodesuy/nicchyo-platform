import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '../../../components/admin/StatusBadge';

describe('StatusBadge', () => {
  it('renders correctly with default label for "active" status', () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByRole('status');

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('✓稼働中');
    expect(badge).toHaveAttribute('aria-label', '稼働中');
    expect(badge).toHaveClass('bg-green-700', 'text-white');
  });

  it('renders correctly with default label for "pending" status', () => {
    render(<StatusBadge status="pending" />);
    const badge = screen.getByRole('status');

    expect(badge).toHaveTextContent('⏳承認待ち');
    expect(badge).toHaveAttribute('aria-label', '承認待ち');
    expect(badge).toHaveClass('bg-orange-600', 'text-white');
  });

  it('renders correctly with custom label', () => {
    render(<StatusBadge status="active" customLabel="カスタム稼働中" />);
    const badge = screen.getByRole('status');

    expect(badge).toHaveTextContent('✓カスタム稼働中');
    expect(badge).toHaveAttribute('aria-label', 'カスタム稼働中');
  });

  it('renders correctly for all statuses', () => {
    const statuses: Array<"active" | "pending" | "suspended" | "rejected" | "approved" | "reported" | "published" | "flagged" | "hidden" | "deleted"> = [
      "active", "pending", "suspended", "rejected", "approved", "reported", "published", "flagged", "hidden", "deleted"
    ];

    statuses.forEach(status => {
      const { unmount } = render(<StatusBadge status={status} />);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      unmount();
    });
  });

  it('handles invalid status gracefully (throws error if not defined in TS but testing edge cases if any bypassed type checking)', () => {
    // Suppress console.error for this specific test as React might complain about invalid types if we force it
    const originalError = console.error;
    console.error = vi.fn();

    try {
      // @ts-ignore - deliberately testing runtime behavior with invalid input
      expect(() => render(<StatusBadge status="unknown" />)).toThrow();
    } finally {
      console.error = originalError;
    }
  });
});
