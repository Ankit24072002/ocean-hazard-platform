export function credibilityScore({ user, hasMedia, socialMatches, distanceCluster }) {
  // Simple weighted sum. Range ~[0,1].
  const wUser = Math.min(Math.max((user?.trust_score || 0) / 10, 0), 0.3);    // up to 0.3
  const wMedia = hasMedia ? 0.25 : 0;
  const wSocial = Math.min(socialMatches / 5, 0.25); // up to 0.25
  const wCluster = Math.min(distanceCluster / 3, 0.2); // up to 0.2 (0..3 nearby)
  let score = 0.2 + wUser + wMedia + wSocial + wCluster;
  if (score > 1) score = 1;
  return score;
}
