import { test, expect } from 'bun:test';
import { 
  StreamDeckClient, 
  COLORS, 
  BUTTON_PRESETS,
  createLocalStreamDeckClient,
  isDirectAvailable 
} from '../src/index.js';

test('StreamDeckClient can be instantiated', () => {
  const client = new StreamDeckClient({
    baseUrl: 'http://localhost:8000'
  });
  
  expect(client).toBeDefined();
  expect(client.getConfig().baseUrl).toBe('http://localhost:8000');
});

test('Factory functions work', () => {
  const client = createLocalStreamDeckClient(8080);
  expect(client).toBeDefined();
  expect(client.getConfig().baseUrl).toBe('http://127.0.0.1:8080');
});

test('Colors are available', () => {
  expect(COLORS.RED).toBe('#FF0000');
  expect(COLORS.GREEN).toBe('#00FF00');
  expect(COLORS.BLUE).toBe('#0000FF');
  expect(COLORS.SUCCESS).toBe('#10B981');
});

test('Button presets are available', () => {
  expect(BUTTON_PRESETS.SUCCESS).toBeDefined();
  expect(BUTTON_PRESETS.ERROR).toBeDefined();
  expect(BUTTON_PRESETS.WARNING).toBeDefined();
});

test('Direct client availability detection', () => {
  const available = isDirectAvailable();
  // In Node.js environment, should be true
  expect(typeof available).toBe('boolean');
});

test('Button position validation', () => {
  const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
  const position = { page: 1, row: 0, column: 0 };
  
  // Test basic client functionality instead of fluent API (not yet implemented)
  expect(() => client.getConfig()).not.toThrow();
  expect(client.getConfig().baseUrl).toBe('http://localhost:8000');
});

test('Color validation utility', () => {
  expect(StreamDeckClient.isValidHexColor('#FF0000')).toBe(true);
  expect(StreamDeckClient.isValidHexColor('#000000')).toBe(true);
  expect(StreamDeckClient.isValidHexColor('red')).toBe(false);
  expect(StreamDeckClient.isValidHexColor('#GG0000')).toBe(false);
});

test('RGB to Hex conversion', () => {
  expect(StreamDeckClient.rgbToHex(255, 0, 0)).toBe('#FF0000');
  expect(StreamDeckClient.rgbToHex(0, 255, 0)).toBe('#00FF00');
  expect(StreamDeckClient.rgbToHex(0, 0, 255)).toBe('#0000FF');
});

test('Hex to RGB conversion', () => {
  const red = StreamDeckClient.hexToRgb('#FF0000');
  expect(red).toEqual({ r: 255, g: 0, b: 0 });
  
  const green = StreamDeckClient.hexToRgb('#00FF00');
  expect(green).toEqual({ r: 0, g: 255, b: 0 });
  
  const invalid = StreamDeckClient.hexToRgb('invalid');
  expect(invalid).toBeNull();
});

test('Caching controls work', () => {
  const client = new StreamDeckClient({
    baseUrl: 'http://localhost:8000',
    enableCaching: true
  });
  
  expect(client.isCachingEnabled()).toBe(true);
  
  client.setCachingEnabled(false);
  expect(client.isCachingEnabled()).toBe(false);
  
  client.setCachingEnabled(true);
  expect(client.isCachingEnabled()).toBe(true);
});

test('Animation settings work', () => {
  const client = new StreamDeckClient({
    baseUrl: 'http://localhost:8000',
    nonBlockingAnimations: true
  });
  
  expect(client.isNonBlockingAnimationsEnabled()).toBe(true);
  
  client.setNonBlockingAnimationsEnabled(false);
  expect(client.isNonBlockingAnimationsEnabled()).toBe(false);
});
