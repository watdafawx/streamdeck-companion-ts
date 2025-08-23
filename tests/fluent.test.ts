/**
 * Fluent API Test
 * 
 * Tests the new fluent API implementation to ensure it's working correctly.
 */

import { describe, test, expect } from 'bun:test';
import { StreamDeckClient } from '../src/core/streamdeck-client';

describe('Fluent API', () => {
  test('ButtonChain can be created', () => {
    const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
    const position = StreamDeckClient.createPosition(0, 0, 0);
    
    const chain = client.button(position);
    expect(chain).toBeDefined();
    expect(typeof chain.text).toBe('function');
    expect(typeof chain.bgcolor).toBe('function');
    expect(typeof chain.color).toBe('function');
    expect(typeof chain.size).toBe('function');
    expect(typeof chain.press).toBe('function');
    expect(typeof chain.rotate).toBe('function');
    expect(typeof chain.apply).toBe('function');
  });

  test('SystemChain can be created', () => {
    const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
    
    const chain = client.system();
    expect(chain).toBeDefined();
    expect(typeof chain.setVar).toBe('function');
    expect(typeof chain.setVars).toBe('function');
    expect(typeof chain.rescanSurfaces).toBe('function');
    expect(typeof chain.apply).toBe('function');
  });

  test('ButtonChain supports method chaining', () => {
    const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
    const position = StreamDeckClient.createPosition(0, 0, 0);
    
    // Test that methods return the chain for fluent API
    const chain = client.button(position)
      .text('Test')
      .bgcolor('#FF0000')
      .color('#FFFFFF')
      .size(14);
    
    expect(chain).toBeDefined();
    expect(typeof chain.apply).toBe('function');
  });

  test('SystemChain supports method chaining', () => {
    const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
    
    // Test that methods return the chain for fluent API
    const chain = client.system()
      .setVar('test', 'value')
      .setVars({ key1: 'val1', key2: 'val2' });
    
    expect(chain).toBeDefined();
    expect(typeof chain.apply).toBe('function');
  });

  test('Conditional methods exist on ButtonChain', () => {
    const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
    const position = StreamDeckClient.createPosition(0, 0, 0);
    
    const chain = client.button(position);
    expect(typeof chain.when).toBe('function');
    expect(typeof chain.whenAsync).toBe('function');
    expect(typeof chain.unless).toBe('function');
    expect(typeof chain.unlessAsync).toBe('function');
  });

  test('Conditional methods exist on SystemChain', () => {
    const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
    
    const chain = client.system();
    expect(typeof chain.when).toBe('function');
    expect(typeof chain.whenAsync).toBe('function');
    expect(typeof chain.unless).toBe('function');
    expect(typeof chain.unlessAsync).toBe('function');
  });

  test('FluentClientInterface methods are available', () => {
    const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
    const position = StreamDeckClient.createPosition(0, 0, 0);
    
    // Test that the client implements FluentClientInterface methods
    expect(typeof client.setButtonColor).toBe('function');
    expect(typeof client.setButtonStyle).toBe('function');
    expect(typeof client.rotateButton).toBe('function');
    expect(typeof client.setVariable).toBe('function');
    expect(typeof client.setVariables).toBe('function');
  });
});
