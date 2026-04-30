import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import { showToast, withToast } from './toast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => {
  return {
    default: {
      success: vi.fn(),
      error: vi.fn(),
      loading: vi.fn(() => 'test-toast-id'),
      dismiss: vi.fn(),
      promise: vi.fn(),
    }
  };
});

describe('toast utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('showToast', () => {
    it('success - should handle empty string input', () => {
      showToast.success('');
      expect(toast.success).toHaveBeenCalledWith('');
    });

    it('success - should call toast.success with normal data', () => {
      showToast.success('Operation successful');
      expect(toast.success).toHaveBeenCalledWith('Operation successful');
    });

    it('error - should handle empty string input', () => {
      showToast.error('');
      expect(toast.error).toHaveBeenCalledWith('');
    });

    it('error - should call toast.error with normal data', () => {
      showToast.error('Operation failed');
      expect(toast.error).toHaveBeenCalledWith('Operation failed');
    });

    it('loading - should handle empty string input', () => {
      const id = showToast.loading('');
      expect(toast.loading).toHaveBeenCalledWith('');
      expect(id).toBe('test-toast-id');
    });

    it('loading - should call toast.loading with normal data and return id', () => {
      const id = showToast.loading('Loading...');
      expect(toast.loading).toHaveBeenCalledWith('Loading...');
      expect(id).toBe('test-toast-id');
    });

    it('dismiss - should call toast.dismiss with normal data', () => {
      showToast.dismiss('test-toast-id');
      expect(toast.dismiss).toHaveBeenCalledWith('test-toast-id');
    });

    it('promise - should call toast.promise with empty messages', async () => {
      const promise = Promise.resolve('data');
      showToast.promise(promise, { loading: '', success: '', error: '' });
      expect(toast.promise).toHaveBeenCalledWith(promise, { loading: '', success: '', error: '' });
    });

    it('promise - should call toast.promise with normal messages', async () => {
      const promise = Promise.resolve('data');
      const messages = { loading: 'Loading...', success: 'Success!', error: 'Error!' };
      showToast.promise(promise, messages);
      expect(toast.promise).toHaveBeenCalledWith(promise, messages);
    });
  });

  describe('withToast', () => {
    const messages = {
      loading: 'Processing...',
      success: 'Done!',
      error: 'Failed!'
    };

    it('should resolve and show success toast for normal data', async () => {
      const operation = vi.fn().mockResolvedValue('result data');

      const result = await withToast(operation, messages);

      expect(toast.loading).toHaveBeenCalledWith('Processing...');
      expect(operation).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Done!', { id: 'test-toast-id' });
      expect(result).toBe('result data');
    });

    it('should handle operation returning empty string', async () => {
      const operation = vi.fn().mockResolvedValue('');

      const result = await withToast(operation, messages);

      expect(toast.loading).toHaveBeenCalledWith('Processing...');
      expect(operation).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Done!', { id: 'test-toast-id' });
      expect(result).toBe('');
    });

    it('should handle operation returning null', async () => {
      const operation = vi.fn().mockResolvedValue(null);

      const result = await withToast(operation, messages);

      expect(toast.loading).toHaveBeenCalledWith('Processing...');
      expect(operation).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Done!', { id: 'test-toast-id' });
      expect(result).toBeNull();
    });

    it('should handle empty message strings', async () => {
      const operation = vi.fn().mockResolvedValue('result');
      const emptyMessages = { loading: '', success: '', error: '' };

      const result = await withToast(operation, emptyMessages);

      expect(toast.loading).toHaveBeenCalledWith('');
      expect(toast.success).toHaveBeenCalledWith('', { id: 'test-toast-id' });
      expect(result).toBe('result');
    });

    it('should reject and show error toast on exception', async () => {
      const testError = new Error('Test error');
      const operation = vi.fn().mockRejectedValue(testError);

      await expect(withToast(operation, messages)).rejects.toThrow('Test error');

      expect(toast.loading).toHaveBeenCalledWith('Processing...');
      expect(operation).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Failed!', { id: 'test-toast-id' });
      // success should not be called
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should use default error message when error message is not provided on exception', async () => {
      const testError = new Error('Test error');
      const operation = vi.fn().mockRejectedValue(testError);

      const messagesWithoutError = {
        loading: 'Processing...',
        success: 'Done!'
      };

      await expect(withToast(operation, messagesWithoutError)).rejects.toThrow('Test error');

      expect(toast.loading).toHaveBeenCalledWith('Processing...');
      expect(operation).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('エラーが発生しました', { id: 'test-toast-id' });
    });
  });
});
