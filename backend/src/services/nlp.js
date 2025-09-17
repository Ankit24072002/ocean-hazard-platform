import axios from 'axios';

export async function classifyText(text) {
  try {
    const { data } = await axios.post(process.env.AI_BASE_URL + '/classify', { text });
    return data; // { hazard_type, language, score, explain }
  } catch (e) {
    // fallback simple rules
    const t = text.toLowerCase();
    const map = [
      ['oil', 'oil_spill'],
      ['spill', 'oil_spill'],
      ['cyclone', 'cyclone'],
      ['storm', 'storm_surge'],
      ['high tide', 'high_tide'],
      ['swell', 'high_swell'],
      ['flood', 'coastal_flooding']
    ];
    const found = map.find(([k]) => t.includes(k));
    return { hazard_type: found ? found[1] : 'unknown', language: 'unknown', score: 0.3, explain: 'fallback-rules' };
  }
}
