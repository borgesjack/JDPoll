import React, { useState, useMemo, useEffect } from 'react';
import { teamsData, type Team } from '../data/teamsData';
import { TeamLogo } from './TeamLogo';
import { getTeamStyle, getTeamConference } from '../utils/teamUtils';

export const VotePage: React.FC = () => {
  // Ballot settings
  const [voterType, setVoterType] = useState<'jack' | 'devan' | 'custom'>('jack');
  const [customVoterName, setCustomVoterName] = useState('');
  const [week, setWeek] = useState(1);
  const [year, setYear] = useState(2026);

  // Ballot workspace (exactly 25 slots)
  const [rankedTeams, setRankedTeams] = useState<(Team | null)[]>(() => {
    // Seed with empty slots
    return Array(25).fill(null);
  });

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConference, setActiveConference] = useState<string>('All');

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedTeamFromLibrary, setDraggedTeamFromLibrary] = useState<Team | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Status message state
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Clear messages after 6 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Auto-scroll window when dragging near viewport edges
  useEffect(() => {
    const isDragging = draggedIndex !== null || draggedTeamFromLibrary !== null;
    if (!isDragging) return;

    const handleDragOver = (e: DragEvent) => {
      const threshold = 120; // distance from edge in pixels
      const clientY = e.clientY;
      const viewHeight = window.innerHeight;

      if (clientY < threshold) {
        // Scroll speed increases the closer we get to the top edge
        const ratio = (threshold - clientY) / threshold;
        const speed = Math.max(5, Math.round(ratio * 25));
        window.scrollBy(0, -speed);
      } else if (clientY > viewHeight - threshold) {
        // Scroll speed increases the closer we get to the bottom edge
        const ratio = (clientY - (viewHeight - threshold)) / threshold;
        const speed = Math.max(5, Math.round(ratio * 25));
        window.scrollBy(0, speed);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
    };
  }, [draggedIndex, draggedTeamFromLibrary]);


  const showTemporaryMessage = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
  };

  // Get exact voter string to submit
  const getVoterName = () => {
    if (voterType === 'custom') {
      return customVoterName.trim().substring(0, 10) || 'Guest';
    }
    return voterType;
  };

  // Pre-generate placeholder consensus ranks for teams based on their ID/hash so it's consistent
  const getPlaceholderConsensusRank = (teamId: string) => {
    const idNum = parseInt(teamId, 10) || 1;
    // Map to a reasonable ranking placeholder (1 to 134)
    const rank = (idNum % 25) + 1;
    return `#${rank}`;
  };

  // Helper to determine conference for any team
  const getConference = (team: Team) => {
    return getTeamConference(team.displayName);
  };

  // Filter teams list
  const filteredTeams = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return teamsData.filter((team) => {
      const matchesSearch =
        team.displayName.toLowerCase().includes(query) ||
        team.abbreviation.toLowerCase().includes(query) ||
        team.location.toLowerCase().includes(query);

      if (!matchesSearch) return false;
      if (activeConference === 'All') return true;

      const conf = getConference(team);
      return conf === activeConference;
    });
  }, [searchQuery, activeConference]);

  // Limit displayed search results to 35 for render speed
  const displayedLibraryTeams = useMemo(() => {
    return filteredTeams.slice(0, 35);
  }, [filteredTeams]);

  // Click on a library team toggles its inclusion on the ballot
  const handleTeamClick = (team: Team) => {
    const existingIndex = rankedTeams.findIndex((t) => t && t.id === team.id);
    if (existingIndex !== -1) {
      // Remove it from the ballot
      const newRanked = [...rankedTeams];
      newRanked[existingIndex] = null;
      setRankedTeams(newRanked);
    } else {
      // Add to first empty slot
      const firstEmpty = rankedTeams.indexOf(null);
      if (firstEmpty !== -1) {
        const newRanked = [...rankedTeams];
        newRanked[firstEmpty] = team;
        setRankedTeams(newRanked);
      } else {
        showTemporaryMessage('error', 'Your ballot is full! Deselect a team or remove one to free up a slot.');
      }
    }
  };

  // Swap slots in ballot
  const swapSlots = (idx1: number, idx2: number) => {
    const newRanked = [...rankedTeams];
    const temp = newRanked[idx1];
    newRanked[idx1] = newRanked[idx2];
    newRanked[idx2] = temp;
    setRankedTeams(newRanked);
  };

  // Shift rank up
  const moveUp = (idx: number) => {
    if (idx > 0) {
      swapSlots(idx, idx - 1);
    }
  };

  // Shift rank down
  const moveDown = (idx: number) => {
    if (idx < 24) {
      swapSlots(idx, idx + 1);
    }
  };

  // Remove team from slot
  const removeSlot = (idx: number) => {
    const newRanked = [...rankedTeams];
    newRanked[idx] = null;
    setRankedTeams(newRanked);
  };

  // Clear all slots
  const clearBallot = () => {
    if (window.confirm('Are you sure you want to clear your entire ballot?')) {
      setRankedTeams(Array(25).fill(null));
      showTemporaryMessage('success', 'Ballot cleared.');
    }
  };

  // Submit ballot to database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const voterName = getVoterName();
    if (!voterName) {
      showTemporaryMessage('error', 'Please specify a voter name.');
      return;
    }

    // Must have exactly 25 teams
    const selectedCount = rankedTeams.filter(Boolean).length;
    if (selectedCount !== 25) {
      showTemporaryMessage('error', `Your ballot must contain exactly 25 teams. Currently you have ranked ${selectedCount}/25 teams.`);
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    // Map ballot teams into target database columns:
    // team abbreviation, numeric ranking, current week, season (year), voter
    const payload = {
      voter: voterName,
      week: week,
      year: year,
      rankings: rankedTeams.map((team, index) => ({
        team: team!.abbreviation.toUpperCase(),
        ranking: index + 1,
      })),
    };

    try {
      const response = await fetch('/api/submit-ballot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to submit ballot');
      }

      if (resData.status === 'simulated') {
        showTemporaryMessage('success', `Simulated: ${resData.message}`);
      } else {
        showTemporaryMessage('success', `Ballot successfully submitted to database for ${voterName}!`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred during submission.';
      showTemporaryMessage('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Check if team is ranked on ballot
  const isTeamSelected = (teamId: string) => {
    return rankedTeams.some((t) => t && t.id === teamId);
  };

  // Conferences list for filtering
  const conferences = ['All', 'SEC', 'Big Ten', 'Big 12', 'ACC', 'Pac-12', 'AAC', 'Mountain West', 'Sun Belt', 'MAC', 'Conference USA', 'Independent', 'Other'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top section: Title and status messages */}
      <div className="text-center mb-8">
        <h1 className="font-display font-black text-4xl sm:text-5xl text-maroon-600 tracking-tight leading-none mb-4">
          Ballot <span className="text-gold-400">Creator</span>
        </h1>
        <p className="max-w-xl mx-auto text-sm sm:text-base text-dark-900/70 leading-relaxed">
          Create and submit your Top 25 ballot. Search or filter teams on the left, click them to add, and drag to rank them.
        </p>
      </div>

      {/* Floating status message */}
      {statusMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 py-3 px-5 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-300 animate-slide-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="shrink-0">
            {statusMessage.type === 'success' ? (
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div>{statusMessage.text}</div>
        </div>
      )}

      {/* Ballot Settings Panel */}
      <form onSubmit={handleSubmit} className="bg-cream-50 border border-dark-900/10 rounded-xl p-6 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          {/* Voter Name Selection */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-dark-900/60">Voter Committee</label>
            <select
              value={voterType}
              onChange={(e) => setVoterType(e.target.value as 'jack' | 'devan' | 'custom')}
              className="bg-cream-100/50 border border-dark-900/10 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 cursor-pointer"
            >
              <option value="jack">Jack (Lead Poll Analyst)</option>
              <option value="devan">Devan (Guest Contributor)</option>
              <option value="custom">Custom Name...</option>
            </select>
          </div>

          {/* Custom Voter Name input */}
          {voterType === 'custom' ? (
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-dark-900/60">Voter Name (max 10 char)</label>
              <input
                type="text"
                maxLength={10}
                required
                placeholder="Enter name..."
                value={customVoterName}
                onChange={(e) => setCustomVoterName(e.target.value)}
                className="bg-cream-100/50 border border-dark-900/10 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500"
              />
            </div>
          ) : (
            <div className="hidden md:block"></div>
          )}

          {/* Week Selection */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-dark-900/60">Poll Week</label>
            <input
              type="number"
              min={0}
              max={20}
              required
              value={week}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setWeek(isNaN(val) ? 0 : val);
              }}
              className="bg-cream-100/50 border border-dark-900/10 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500"
            />
          </div>

          {/* Year Selection */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-dark-900/60">Season (Year)</label>
            <input
              type="number"
              min={2020}
              max={2030}
              required
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10) || 2026)}
              className="bg-cream-100/50 border border-dark-900/10 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500"
            />
          </div>
        </div>

        {/* Action button row */}
        <div className="mt-6 pt-6 border-t border-dark-900/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm font-semibold text-dark-900/70">
            Selected: <span className="text-maroon-600 font-extrabold">{rankedTeams.filter(Boolean).length}/25</span> teams
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={clearBallot}
              className="w-1/2 sm:w-auto bg-cream-200 hover:bg-cream-300/80 text-dark-900/80 py-2 px-5 rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              Clear Ballot
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`w-1/2 sm:w-auto bg-maroon-500 hover:bg-maroon-600 text-cream-50 py-2 px-6 rounded-lg text-sm font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer ${
                submitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-cream-50 border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Ballot</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Main Ballot Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Teams Library List (4 cols) */}
        <div className="lg:col-span-4 bg-cream-50 border border-dark-900/10 rounded-xl p-5 shadow-sm sticky top-[100px] max-h-[calc(100vh-140px)] flex flex-col">
          <h2 className="font-display font-bold text-lg text-dark-900 mb-4 border-b border-dark-900/10 pb-2">
            Teams Library
          </h2>

          {/* Search bar */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search by team or abbreviation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-cream-100/50 border border-dark-900/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-900/40">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Conference Filter Buttons */}
          <div className="flex flex-wrap gap-1.5 mb-4 overflow-y-auto max-h-[85px] py-1 border-b border-dark-900/10 pb-3">
            {conferences.map((conf) => (
              <button
                key={conf}
                type="button"
                onClick={() => setActiveConference(conf)}
                className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-md font-bold uppercase transition-all tracking-wider border cursor-pointer ${
                  activeConference === conf
                    ? 'bg-maroon-500 text-cream-50 border-maroon-600 shadow-sm'
                    : 'bg-cream-100 hover:bg-cream-200 text-dark-900/60 border-dark-900/5'
                }`}
              >
                {conf}
              </button>
            ))}
          </div>

          {/* Scrollable list of teams */}
          <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 min-h-[300px]">
            {displayedLibraryTeams.length === 0 ? (
              <p className="text-center py-8 text-sm text-dark-900/40 font-semibold">No teams found matching search.</p>
            ) : (
              displayedLibraryTeams.map((team) => {
                const selected = isTeamSelected(team.id);
                return (
                  <div
                    key={team.id}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', 'library');
                      setDraggedTeamFromLibrary(team);
                    }}
                    onDragEnd={() => setDraggedTeamFromLibrary(null)}
                    onClick={() => handleTeamClick(team)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200 cursor-pointer group select-none hover:-translate-y-px ${
                      selected
                        ? 'bg-maroon-55/40 border-maroon-200/60 text-maroon-900 shadow-sm'
                        : 'bg-cream-100/30 hover:bg-cream-200/40 border-dark-900/5 text-dark-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <TeamLogo teamQuery={team.displayName} className="w-6 h-6 object-contain flex-shrink-0" fallbackSize={24} />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs sm:text-sm truncate group-hover:text-maroon-700 transition-colors">
                          {team.displayName}
                        </span>
                        <span className="text-[10px] text-dark-900/50 font-medium">
                          {getConference(team)} • {team.abbreviation}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {/* Consensus Rank placeholder */}
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-cream-200 border border-cream-300/40 text-dark-900/50">
                        {getPlaceholderConsensusRank(team.id)}
                      </span>
                      {selected && (
                        <span className="bg-maroon-500 text-cream-50 rounded-full p-0.5 shadow-sm">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {filteredTeams.length > 35 && (
              <div className="text-center py-2 text-[10px] text-dark-900/40 font-semibold bg-cream-200/20 rounded">
                Showing top 35 results. Refine search.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ballot Workspace Slots (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex justify-between items-center mb-2 px-1">
            <h2 className="font-display font-black text-xl text-dark-900">
              Rankings Ballot Workspace
            </h2>
            <span className="text-xs font-semibold text-dark-900/40 bg-cream-200 border border-cream-300/40 px-2 py-0.5 rounded">
              Slots 1 - 25
            </span>
          </div>

          <div className="space-y-2.5">
            {rankedTeams.map((team, index) => {
              const rankNum = (index + 1).toString().padStart(2, '0');

              return (
                <div
                  key={index}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIndex(index);
                  }}
                  onDragLeave={() => {
                    setDragOverIndex(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverIndex(null);
                    e.dataTransfer.setData('text/plain', ''); // Workaround for basic HTML5 drop
                    
                    // Retrieve standard custom types or state directly
                    if (draggedTeamFromLibrary) {
                      const existingIdx = rankedTeams.findIndex(
                        (t) => t && t.id === draggedTeamFromLibrary.id
                      );
                      const newRanked = [...rankedTeams];
                      if (existingIdx !== -1) {
                        newRanked[existingIdx] = newRanked[index];
                        newRanked[index] = draggedTeamFromLibrary;
                      } else {
                        newRanked[index] = draggedTeamFromLibrary;
                      }
                      setRankedTeams(newRanked);
                    } else if (draggedIndex !== null && draggedIndex !== index) {
                      swapSlots(draggedIndex, index);
                    }
                  }}
                  className={`relative rounded-xl border transition-all duration-200 ${
                    dragOverIndex === index
                      ? 'border-maroon-400 bg-maroon-50/20 scale-[1.01] shadow'
                      : team
                      ? 'border-dark-900/10 bg-cream-50 shadow-sm hover:shadow-md'
                      : 'border-dashed border-dark-900/20 bg-cream-100/10'
                  }`}
                >
                  {/* Empty Slot */}
                  {!team ? (
                    <div className="flex items-center justify-between py-4 px-6 min-h-[74px]">
                      <div className="flex items-center space-x-5">
                        <span className="font-display font-extrabold text-lg text-dark-900/30">
                          {rankNum}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-dark-900/30 select-none">
                          Empty Slot — Click a team in the library or drag it here
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Filled Slot Card */
                    <div
                      draggable={true}
                      onDragStart={() => {
                        setDraggedIndex(index);
                      }}
                      onDragEnd={() => {
                        setDraggedIndex(null);
                      }}
                      style={getTeamStyle(team.displayName)}
                      className="flex items-center justify-between py-4.5 px-6 border-l-4 border-l-[var(--team-primary,#800020)] rounded-r-xl group"
                    >
                      {/* Left: Rank, Logo, Name info */}
                      <div className="flex items-center space-x-5 min-w-0">
                        {/* Drag Handle Indicator */}
                        <div className="cursor-grab active:cursor-grabbing text-dark-900/20 group-hover:text-dark-900/40 select-none px-0.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                          </svg>
                        </div>

                        {/* Rank */}
                        <span className="font-display font-extrabold text-lg sm:text-xl text-[var(--team-primary,#800020)]">
                          {rankNum}
                        </span>

                        {/* Logo and Name */}
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <TeamLogo
                            teamQuery={team.displayName}
                            className="w-7 h-7 object-contain flex-shrink-0"
                            fallbackSize={28}
                          />
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 min-w-0">
                            <span className="font-semibold text-dark-900 text-sm sm:text-base truncate group-hover:text-[var(--team-primary)] transition-colors">
                              {team.displayName}
                            </span>
                            <span className="inline-flex text-[10px] px-1.5 py-0.5 rounded font-medium bg-cream-200 border border-cream-300/50 text-dark-900/50 shrink-0 w-max">
                              {getConference(team)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions and Rank Placeholder */}
                      <div className="flex items-center space-x-4 shrink-0">
                        {/* Consensus Rank Placeholder */}
                        <span className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded bg-cream-200/60 border border-cream-300/40 font-semibold text-dark-900/55 font-mono">
                          Consensus: {getPlaceholderConsensusRank(team.id)}
                        </span>

                        {/* Reorder Buttons (Up/Down) */}
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveUp(index)}
                            title="Move Up"
                            className="p-1 hover:bg-cream-200 rounded text-dark-900/50 hover:text-maroon-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            disabled={index === 24}
                            onClick={() => moveDown(index)}
                            title="Move Down"
                            className="p-1 hover:bg-cream-200 rounded text-dark-900/50 hover:text-maroon-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSlot(index)}
                            title="Remove Team"
                            className="p-1 hover:bg-rose-50 rounded text-dark-900/40 hover:text-rose-600 cursor-pointer ml-1"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
