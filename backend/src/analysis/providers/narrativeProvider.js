/**
 * Layer 2: OPTIONAL narrative provider.
 * Contract: given a structured analysis payload (already computed by the rule engine), return a short
 * plain-language narrative. Providers must use ONLY the supplied numbers and must not diagnose.
 * If no provider is configured, or a call fails, the rule-based explanation remains and the insight
 * is labelled with its source. Keys are read from backend environment variables only.
 */
import { env } from '../../config/env.js';

const SYSTEM_PROMPT = [
  'You write short plain-language explanations for a prototype astronaut exercise and performance monitoring dashboard.',
  'Use ONLY the numbers in the JSON payload. Do not invent measurements, references, thresholds or causes.',
  'Do not diagnose any condition (including muscle atrophy, osteoporosis or bone loss). Describe the measured difference and recommend specialist review where the payload says so.',
  'Answer in at most three sentences.',
].join(' ');

const openaiProvider = {
  name: 'openai',
  label: 'OpenAI narrative (optional)',
  async explain(payload) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.openaiApiKey}` },
      body: JSON.stringify({
        model: env.openaiModel,
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(payload) },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Narrative provider responded with HTTP ${response.status}`);
    const json = await response.json();
    return json.choices?.[0]?.message?.content?.trim() || null;
  },
};

export function getNarrativeProvider() {
  if (env.aiProvider === 'openai' && env.openaiApiKey) return openaiProvider;
  return null; // rule-based analysis only
}

export function narrativeProviderStatus() {
  const provider = getNarrativeProvider();
  return {
    layer1: 'Rule-based analysis (always active, no key required)',
    layer2: provider ? provider.label : 'Not configured: rule-based explanations only',
    configuredProvider: env.aiProvider,
  };
}
