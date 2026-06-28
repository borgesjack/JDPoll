import React, { useState } from 'react';
import { getTeamLogoUrl, getTeam } from '../utils/teamUtils';

interface TeamLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Can be team ID, name, slug, or abbreviation */
  teamQuery: string;
  /** Whether to use the dark-mode friendly logo variation if available */
  isDark?: boolean;
  /** Size of the fallback avatar circle (in pixels) if image fails to load */
  fallbackSize?: number;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({
  teamQuery,
  isDark = false,
  fallbackSize = 24,
  className = '',
  alt,
  ...props
}) => {
  const team = getTeam(teamQuery);
  const [prevQuery, setPrevQuery] = useState(teamQuery);
  const [prevIsDark, setPrevIsDark] = useState(isDark);
  const [hasError, setHasError] = useState(false);

  // Adjust state directly in render when props change
  if (teamQuery !== prevQuery || isDark !== prevIsDark) {
    setPrevQuery(teamQuery);
    setPrevIsDark(isDark);
    setHasError(false);
  }

  const displayName = team ? team.displayName : teamQuery;

  if (hasError || !team) {
    // Elegant fallback: a styled circle avatar containing the team's first letter
    const initial = teamQuery ? teamQuery.trim().charAt(0).toUpperCase() : '?';
    const bg = team ? team.color : '#7f7f7f';
    const fg = team ? team.alternateColor : '#ffffff';
    
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full font-bold select-none aspect-square shrink-0 ${className}`}
        style={{
          backgroundColor: bg,
          color: fg,
          width: fallbackSize,
          height: fallbackSize,
          fontSize: `${fallbackSize * 0.5}px`,
          lineHeight: 1,
          border: `1px solid ${fg}33`,
        }}
        title={displayName}
      >
        {initial}
      </div>
    );
  }

  const src = getTeamLogoUrl(teamQuery, isDark);

  return (
    <img
      src={src}
      alt={alt || `${displayName} logo`}
      className={`inline-block aspect-square object-contain shrink-0 ${className}`}
      onError={() => {
        setHasError(true);
      }}
      {...props}
    />
  );
};
