import { describe, it, expect } from 'vitest';
import { parseSseChunk } from './sse-parser';

describe('parseSseChunk', () => {
  it('parseia evento chunk corretamente', () => {
    const line = 'data: {"type":"chunk","content":"Olá"}';
    expect(parseSseChunk(line)).toEqual({ type: 'chunk', content: 'Olá' });
  });

  it('parseia evento done corretamente', () => {
    const line = 'data: {"type":"done"}';
    expect(parseSseChunk(line)).toEqual({ type: 'done' });
  });

  it('parseia evento error corretamente', () => {
    const line = 'data: {"type":"error","message":"Erro ao processar"}';
    expect(parseSseChunk(line)).toEqual({
      type: 'error',
      message: 'Erro ao processar',
    });
  });

  it('retorna null para linha vazia', () => {
    expect(parseSseChunk('')).toBeNull();
  });

  it('retorna null para linha sem prefixo data:', () => {
    expect(parseSseChunk('{"type":"chunk","content":"Olá"}')).toBeNull();
  });

  it('retorna null para JSON inválido', () => {
    expect(parseSseChunk('data: {invalid json}')).toBeNull();
  });

  it('retorna null para tipo de evento desconhecido', () => {
    expect(parseSseChunk('data: {"type":"unknown","content":"x"}')).toBeNull();
  });

  it('retorna null para evento chunk sem campo content', () => {
    expect(parseSseChunk('data: {"type":"chunk"}')).toBeNull();
  });

  it('retorna null para evento error sem campo message', () => {
    expect(parseSseChunk('data: {"type":"error"}')).toBeNull();
  });

  it('retorna null para payload que não é objeto', () => {
    expect(parseSseChunk('data: "string"')).toBeNull();
    expect(parseSseChunk('data: 42')).toBeNull();
    expect(parseSseChunk('data: null')).toBeNull();
  });

  it('ignora espaços extras na linha', () => {
    const line = '  data: {"type":"done"}  ';
    expect(parseSseChunk(line)).toEqual({ type: 'done' });
  });
});
