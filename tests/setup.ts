/**
 * Jest setup file
 * Mocks GAS-specific global objects for local testing
 */

// Mock SpreadsheetApp
const mockSpreadsheetApp = {
  getActiveSpreadsheet: jest.fn(),
  getUi: jest.fn(() => ({
    createMenu: jest.fn(() => ({
      addItem: jest.fn().mockReturnThis(),
      addSeparator: jest.fn().mockReturnThis(),
      addToUi: jest.fn(),
    })),
    alert: jest.fn(),
    showModalDialog: jest.fn(),
    showSidebar: jest.fn(),
  })),
  openById: jest.fn(),
  create: jest.fn(),
};

// Mock ScriptApp
const mockScriptApp = {
  getScriptId: jest.fn(() => 'mock-script-id'),
  getOAuthToken: jest.fn(() => 'mock-token'),
  getProjectTriggers: jest.fn(() => []),
  newTrigger: jest.fn(),
  deleteTrigger: jest.fn(),
};

// Mock Utilities
const mockUtilities = {
  formatDate: jest.fn((date: Date, timezone: string, format: string) => {
    // Simple format implementation for testing
    const d = new Date(date);
    if (format === 'yyyy/MM/dd HH:mm:ss') {
      return d.toISOString().replace('T', ' ').substring(0, 19);
    }
    if (format === 'yyyyMMdd_HHmmss') {
      return d.toISOString().replace(/[-:T]/g, '').substring(0, 15).replace(/(\d{8})(\d{6})/, '$1_$2');
    }
    return d.toISOString();
  }),
  sleep: jest.fn(),
};

// Mock HtmlService
const mockHtmlService = {
  createHtmlOutput: jest.fn(() => ({
    setWidth: jest.fn().mockReturnThis(),
    setHeight: jest.fn().mockReturnThis(),
    getContent: jest.fn(() => ''),
  })),
  createHtmlOutputFromFile: jest.fn(() => ({
    setWidth: jest.fn().mockReturnThis(),
    setHeight: jest.fn().mockReturnThis(),
    getContent: jest.fn(() => ''),
  })),
  createTemplateFromFile: jest.fn(() => ({
    evaluate: jest.fn(() => ({
      setWidth: jest.fn().mockReturnThis(),
      setHeight: jest.fn().mockReturnThis(),
      getContent: jest.fn(() => ''),
    })),
  })),
};

// Mock PropertiesService
const mockPropertiesService = {
  getScriptProperties: jest.fn(() => ({
    getProperty: jest.fn(),
    setProperty: jest.fn(),
    deleteProperty: jest.fn(),
    getProperties: jest.fn(() => ({})),
    setProperties: jest.fn(),
  })),
  getUserProperties: jest.fn(() => ({
    getProperty: jest.fn(),
    setProperty: jest.fn(),
    deleteProperty: jest.fn(),
    getProperties: jest.fn(() => ({})),
    setProperties: jest.fn(),
  })),
  getDocumentProperties: jest.fn(() => ({
    getProperty: jest.fn(),
    setProperty: jest.fn(),
    deleteProperty: jest.fn(),
    getProperties: jest.fn(() => ({})),
    setProperties: jest.fn(),
  })),
};

// Mock Logger
const mockLogger = {
  log: jest.fn(console.log),
  clear: jest.fn(),
  getLog: jest.fn(() => ''),
};

// Mock console (keep original but spy on it)
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(originalConsole.log),
  error: jest.fn(originalConsole.error),
  warn: jest.fn(originalConsole.warn),
  info: jest.fn(originalConsole.info),
};

// Assign to global
(global as any).SpreadsheetApp = mockSpreadsheetApp;
(global as any).ScriptApp = mockScriptApp;
(global as any).Utilities = mockUtilities;
(global as any).HtmlService = mockHtmlService;
(global as any).PropertiesService = mockPropertiesService;
(global as any).Logger = mockLogger;

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Custom matchers
expect.extend({
  toBeValidDate(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid Date`
          : `expected ${received} to be a valid Date`,
    };
  },
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
    };
  },
});

// TypeScript declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDate(): R;
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}

export {};
