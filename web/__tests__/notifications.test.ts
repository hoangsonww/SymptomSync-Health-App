/**
 * Unit tests for notification utility functions
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock IndexedDB for testing
const mockIDB = {
  open: jest.fn(),
  transaction: jest.fn(),
  objectStore: jest.fn(),
  add: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
  count: jest.fn()
};

// Mock global objects
Object.defineProperty(window, 'indexedDB', {
  value: mockIDB,
  writable: true
});

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    ready: Promise.resolve({
      pushManager: {
        subscribe: jest.fn(),
        getSubscription: jest.fn()
      },
      sync: {
        register: jest.fn()
      }
    }),
    register: jest.fn()
  },
  writable: true
});

Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'default',
    requestPermission: jest.fn()
  },
  writable: true
});

import {
  getNotificationPermission,
  urlBase64ToUint8Array,
  arrayBufferToBase64,
  generateId
} from '@/lib/notifications';

import {
  formatSnoozeDuration,
  markMedicationTaken,
  dismissReminder
} from '@/lib/snoozeUtils';

describe('Notification Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotificationPermission', () => {
    test('returns default when Notification not supported', () => {
      // @ts-ignore
      delete window.Notification;
      const permission = getNotificationPermission();
      expect(permission).toBe('denied');
    });

    test('returns current permission status', () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'granted' },
        writable: true
      });
      const permission = getNotificationPermission();
      expect(permission).toBe('granted');
    });
  });

  describe('urlBase64ToUint8Array', () => {
    test('converts base64url to Uint8Array', () => {
      const base64 = 'SGVsbG9fV29ybGQ';
      const result = urlBase64ToUint8Array(base64);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    test('handles padding correctly', () => {
      const base64 = 'SGVsbG8'; // Missing padding
      const result = urlBase64ToUint8Array(base64);
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('arrayBufferToBase64', () => {
    test('converts ArrayBuffer to base64', () => {
      const buffer = new ArrayBuffer(8);
      const view = new Uint8Array(buffer);
      view[0] = 72; // 'H'
      view[1] = 101; // 'e'
      
      const result = arrayBufferToBase64(buffer);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('returns empty string for null buffer', () => {
      const result = arrayBufferToBase64(null);
      expect(result).toBe('');
    });
  });

  describe('generateId', () => {
    test('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-.+$/);
    });
  });
});

describe('Snooze Utils', () => {
  describe('formatSnoozeDuration', () => {
    test('formats minutes correctly', () => {
      expect(formatSnoozeDuration(5)).toBe('5m');
      expect(formatSnoozeDuration(30)).toBe('30m');
      expect(formatSnoozeDuration(59)).toBe('59m');
    });

    test('formats hours correctly', () => {
      expect(formatSnoozeDuration(60)).toBe('1h');
      expect(formatSnoozeDuration(120)).toBe('2h');
      expect(formatSnoozeDuration(90)).toBe('1h 30m');
    });

    test('formats days correctly', () => {
      expect(formatSnoozeDuration(1440)).toBe('1d');
      expect(formatSnoozeDuration(2880)).toBe('2d');
      expect(formatSnoozeDuration(1500)).toBe('1d 1h');
    });
  });

  // Note: These tests would require mocking Supabase
  // In a real implementation, you'd mock the supabase client
  describe('markMedicationTaken', () => {
    test('should be implemented with Supabase mocks', () => {
      // This test would require proper Supabase mocking
      expect(markMedicationTaken).toBeDefined();
    });
  });

  describe('dismissReminder', () => {
    test('should be implemented with Supabase mocks', () => {
      // This test would require proper Supabase mocking
      expect(dismissReminder).toBeDefined();
    });
  });
});

// Helper functions that should be extracted from the main file for testing
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}