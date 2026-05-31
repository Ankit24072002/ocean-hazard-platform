import axios from 'axios';

export async function classifyText(text) {
  try {
    const { data } = await axios.post(process.env.AI_BASE_URL + '/classify', { text });
    return data; // { hazard_type, language, score, explain }
  } catch (e) {
    // fallback simple rules
    const t = text.toLowerCase();
    const map = [
      ['tsunami', 'tsunami'],
      ['oil', 'oil_spill'],
      ['spill', 'oil_spill'],
      ['cyclone', 'cyclone'],
      ['wave damage', 'wave_damage'],
      ['storm', 'storm_surge'],
      ['high tide', 'high_tide'],
      ['flooded beach', 'coastal_flooding'],
      ['swell', 'high_swell'],
      ['flood', 'coastal_flooding'],
      ['ज्वार', 'high_tide'],
      ['बाढ़', 'coastal_flooding'],
      ['அலை', 'high_swell'],
      ['তরঙ্গ', 'high_swell'],
      ['తుఫాను', 'cyclone']
    ];
    const found = map.find(([k]) => t.includes(k));
    return {
      hazard_type: found ? found[1] : 'unknown',
      language: detectLanguage(text),
      score: found ? 0.72 : 0.25,
      sentiment: classifySentiment(t),
      urgency: classifyUrgency(t),
      explain: 'fallback-rules'
    };
  }
}

function detectLanguage(text) {
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';
  return 'en';
}

function classifySentiment(text) {
  if (/(panic|trapped|help|urgent|danger|scared|evacuate|बचाओ)/.test(text)) return 'panic';
  if (/(fake|promo|subscribe|offer|unrelated)/.test(text)) return 'irrelevant';
  return 'informative';
}

function classifyUrgency(text) {
  if (/(now|urgent|help|trapped|evacuate|danger|immediate)/.test(text)) return 'high';
  if (/(warning|alert|rising|damage|flood)/.test(text)) return 'medium';
  return 'low';
}
