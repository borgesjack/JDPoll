import type { CSSProperties } from 'react';
import { teamsData, type Team } from '../data/teamsData';

// Generate lookups at load time for O(1) access
const teamById: Record<string, Team> = {};
const teamByName: Record<string, Team> = {};
const teamBySlug: Record<string, Team> = {};
const teamByAbbr: Record<string, Team> = {};

teamsData.forEach((team) => {
  teamById[team.id.toLowerCase()] = team;
  teamByName[team.displayName.toLowerCase()] = team;
  teamByName[team.shortDisplayName.toLowerCase()] = team;
  teamByName[team.location.toLowerCase()] = team;
  teamBySlug[team.slug.toLowerCase()] = team;
  teamByAbbr[team.abbreviation.toLowerCase()] = team;
});

/**
 * Find a college football team by ID, display name, short name, slug, or abbreviation.
 * Includes a partial match fallback if no exact match is found.
 */
export function getTeam(query: string): Team | undefined {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();

  // Try exact lookups first
  if (teamById[q]) return teamById[q];
  if (teamBySlug[q]) return teamBySlug[q];
  if (teamByName[q]) return teamByName[q];
  if (teamByAbbr[q]) return teamByAbbr[q];

  // Try matching a sub-segment (e.g. "Ohio State" matches "Ohio State Buckeyes")
  const partialMatch = teamsData.find(
    (t) =>
      t.displayName.toLowerCase().includes(q) ||
      t.location.toLowerCase().includes(q) ||
      t.shortDisplayName.toLowerCase().includes(q)
  );

  return partialMatch;
}

/**
 * Get the ESPN CDN logo URL for a team based on name, ID, slug, or abbreviation.
 * Supports light/dark mode variations.
 */
export function getTeamLogoUrl(query: string, isDark: boolean = false): string {
  const team = getTeam(query);
  if (team) {
    return isDark
      ? `https://a.espncdn.com/i/teamlogos/ncaa/500-dark/${team.id}.png`
      : `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.id}.png`;
  }
  return 'https://a.espncdn.com/i/teamlogos/default-logo.png';
}

/**
 * Get inline style properties setting the custom CSS variables --team-primary and --team-secondary.
 */
export function getTeamStyle(query: string): CSSProperties {
  const team = getTeam(query);
  if (!team) return {};
  return {
    '--team-primary': team.color,
    '--team-secondary': team.alternateColor,
  } as CSSProperties;
}

/**
 * Get the custom CSS class name for a team's theme.
 */
export function getTeamThemeClass(query: string): string {
  const team = getTeam(query);
  return team ? `team-theme-${team.id}` : '';
}
export type { Team };
