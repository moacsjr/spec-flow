import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { CONFIG_FILE, getProvider, DEFAULT_PROVIDER } from '../config.mjs';

// Resolve o provider/modelo de IA a partir do .spec-wave.json (gravado pelo init
// e versionado no repo) com precedência para variáveis de ambiente — assim os
// workflows usam exatamente o que foi escolhido no init, sem depender de flags.
function resolveAi() {
  let fileAi = {};
  try {
    const configPath = path.join(process.cwd(), CONFIG_FILE);
    if (existsSync(configPath)) {
      fileAi = JSON.parse(readFileSync(configPath, 'utf-8')).ai || {};
    }
  } catch {
    // config ausente/corrompido → cai nos defaults/env
  }

  const provider = (process.env.SPEC_WAVE_PROVIDER || fileAi.provider || DEFAULT_PROVIDER).toLowerCase();
  const meta = getProvider(provider) || getProvider(DEFAULT_PROVIDER);
  const model = process.env.SPEC_WAVE_MODEL || fileAi.model || meta.defaultModel;
  return { provider: meta.value, model, secret: meta.secret };
}

export async function generateDocument(systemPrompt, userContent) {
  const ai = resolveAi();
  console.log(`Provider de IA: ${ai.provider} · modelo: ${ai.model}`);

  if (ai.provider === 'openrouter') {
    return generateWithOpenRouter(systemPrompt, userContent, ai);
  }
  return generateWithAnthropic(systemPrompt, userContent, ai);
}

async function generateWithAnthropic(systemPrompt, userContent, ai) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY not set.\n' +
      'Add it as a GitHub Actions secret or set it in your environment.'
    );
  }

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: ai.model,
    max_tokens: 4096,
    messages: [{ role: 'user', content: userContent }],
    system: systemPrompt,
  });

  return message.content[0].text;
}

async function generateWithOpenRouter(systemPrompt, userContent, ai) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY not set.\n' +
      'Add it as a GitHub Actions secret or set it in your environment.'
    );
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/moacsjr/spec-wave',
      'X-Title': 'spec-wave',
    },
    body: JSON.stringify({
      model: ai.model,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter API ${res.status}: ${body}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`OpenRouter retornou resposta vazia: ${JSON.stringify(data)}`);
  }
  return content;
}
