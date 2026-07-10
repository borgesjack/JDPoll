import { useState, useEffect } from 'react'
import { TeamLogo } from './components/TeamLogo'
import { getTeamStyle } from './utils/teamUtils'
import { VotePage } from './components/VotePage'
import { LoginPage } from './components/LoginPage'

interface TeamRanking {
  rank: number;
  team: string;
  record: string;
  previousRank: string;
  conference: string;
  color: string;
  trend: 'up' | 'down' | 'same' | 'new';
  trendDifference?: number;
  points: number;
}

interface Voter {
  slug: string;
  name: string;
  role: string;
  description: string;
  avatar_initials: string;
  top_picks: string[];
}

interface PollMetadata {
  poll_season: string;
  poll_week: string;
  last_updated: string;
  hero_title: string;
  hero_description: string;
  info_box_title: string;
  info_box_description: string;
  rankings_section_title: string;
  current_week?: number;
  current_year?: number;
  viewing_week?: number;
  viewing_year?: number;
  available_weeks?: { year: number; week: number }[];
}

interface PollData {
  metadata: PollMetadata;
  voters: Voter[];
  rankings: {
    consensus: TeamRanking[];
    Jack: TeamRanking[];
    Devan: TeamRanking[];
  };
}

function App() {
  const [pollData, setPollData] = useState<PollData | null>(null);
  const [activeTab, setActiveTab] = useState<'consensus' | 'Jack' | 'Devan'>('consensus');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'vote'>(() => {
    return window.location.hash === '#vote' ? 'vote' : 'home';
  });

  const [currentUser, setCurrentUser] = useState<{ username: string; token: string } | null>(() => {
    const token = localStorage.getItem('jd_poll_token');
    const username = localStorage.getItem('jd_poll_username');
    if (token && username) {
      return { username, token };
    }
    return null;
  });

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('jd_poll_token');
    const username = localStorage.getItem('jd_poll_username');
    if (token && username) {
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.logged_in && data.username === username) {
          // Token is valid, keep user logged in
        } else {
          // Token is invalid, log out
          handleLogout();
        }
      })
      .catch(() => {
        // network error, keep credentials locally
      });
    }
  }, []);

  const handleLoginSuccess = (username: string, token: string) => {
    localStorage.setItem('jd_poll_token', token);
    localStorage.setItem('jd_poll_username', username);
    setCurrentUser({ username, token });
  };

  const handleLogout = () => {
    const token = localStorage.getItem('jd_poll_token');
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).catch(err => console.error('Logout API failed:', err));
    }
    localStorage.removeItem('jd_poll_token');
    localStorage.removeItem('jd_poll_username');
    setCurrentUser(null);
  };

  // Selected week and year for historical query navigation
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentView(window.location.hash === '#vote' ? 'vote' : 'home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    let url = '/api/poll-data';
    const params: string[] = [];
    if (selectedWeek !== null) params.push(`week=${selectedWeek}`);
    if (selectedYear !== null) params.push(`year=${selectedYear}`);
    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch poll data');
        }
        return res.json();
      })
      .then((data: PollData) => {
        setPollData(data);
        // Sync selected week and year if they were not set yet
        if (selectedWeek === null || selectedYear === null) {
          setSelectedWeek(data.metadata.viewing_week ?? 0);
          setSelectedYear(data.metadata.viewing_year ?? 2026);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'An error occurred while loading data.');
        setLoading(false);
      });
  }, [currentView, selectedWeek, selectedYear]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-maroon-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-dark-900/60 font-semibold tracking-wide">Loading JDPoll...</p>
        </div>
      </div>
    );
  }

  if (error || !pollData) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
        <div className="bg-cream-50 border border-rose-200 rounded-xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="font-display font-bold text-xl text-dark-900 mb-2">Failed to Connect</h2>
          <p className="text-sm text-dark-900/70 mb-6">{error || 'Could not fetch poll data from backend.'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-maroon-500 hover:bg-maroon-600 text-cream-50 py-2.5 rounded-lg font-semibold transition-colors shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const getRankings = () => {
    switch (activeTab) {
      case 'Jack': return pollData.rankings.Jack;
      case 'Devan': return pollData.rankings.Devan;
      default: return pollData.rankings.consensus;
    }
  };

  const activeRankings = getRankings() || [];

  return (
    <div className="min-h-screen bg-cream-100 text-dark-900 pb-20 selection:bg-maroon-100 selection:text-maroon-700">
      {/* Top Bar Accent */}
      <div className="h-1.5 bg-maroon-500 w-full"></div>

      {/* Navigation */}
      <header className="border-b border-dark-900/10 py-6 px-4 sm:px-8 bg-cream-50/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-display font-black text-2xl tracking-tighter text-maroon-600">
              JD<span className="text-gold-400">POLL</span>
            </span>
          </div>
          <nav className="flex items-center space-x-6 text-sm font-semibold tracking-wide text-dark-900/80">
            <a 
              href="#" 
              className={`hover:text-maroon-500 transition-colors ${currentView === 'home' ? 'text-maroon-600 font-extrabold' : ''}`}
            >
              Rankings
            </a>
            <a 
              href="#vote" 
              className={`hover:text-maroon-500 transition-colors ${currentView === 'vote' ? 'text-maroon-600 font-extrabold' : ''}`}
            >
              Submit Ballot
            </a>
            {currentUser ? (
              <div className="flex items-center space-x-4 border-l border-dark-900/10 pl-6">
                <span className="text-dark-900/60 font-medium">
                  Hi, <span className="font-bold text-maroon-600 capitalize">{currentUser.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-cream-200/60 hover:bg-cream-300/80 text-dark-900/85 py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4 border-l border-dark-900/10 pl-6">
                <a
                  href="#vote"
                  style={{ backgroundColor: '#800020', color: '#ffffff' }}
                  className="bg-maroon-500 hover:bg-maroon-600 text-white py-1.5 px-4 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Log In
                </a>
              </div>
            )}
          </nav>
        </div>
      </header>

      {currentView === 'vote' ? (
        currentUser ? (
          <VotePage 
            defaultWeek={pollData.metadata.current_week}
            defaultYear={pollData.metadata.current_year}
            currentUser={currentUser}
          />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        )
      ) : (
        <>
          {/* Hero Section */}
          <section className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="font-display font-black text-5xl sm:text-7xl text-maroon-600 tracking-tight leading-none mb-6">
          JD <span className="font-display font-black text-5xl sm:text-7xl text-gold-400 tracking-tight leading-none mb-6">Poll</span>
        </h1>
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-dark-900/70 leading-relaxed mb-8">
          {pollData.metadata.hero_description}
        </p>
      </section>

      {/* Rankings Section */}
      <section id="rankings" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 scroll-mt-24">
        {/* Toggle Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-dark-900/10 pb-4 mb-6 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="font-display font-bold text-2xl text-dark-900 tracking-tight">
              {pollData.metadata.rankings_section_title}
            </h2>
            
            {/* Week History Selector */}
            {pollData.metadata.available_weeks && pollData.metadata.available_weeks.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-dark-900/40 font-bold uppercase tracking-wider">History:</span>
                <select
                  value={`${selectedYear}-${selectedWeek}`}
                  onChange={(e) => {
                    const [y, w] = e.target.value.split('-').map(Number);
                    setSelectedYear(y);
                    setSelectedWeek(w);
                  }}
                  className="bg-cream-50 border border-dark-900/10 rounded-lg py-1.5 px-3 text-sm font-semibold text-dark-900 hover:border-maroon-300 focus:outline-none focus:ring-1 focus:ring-maroon-500 cursor-pointer shadow-sm"
                >
                  {pollData.metadata.available_weeks.map((item) => {
                    const label = item.week === 0 ? `${item.year} Preseason` : `${item.year} Week ${item.week}`;
                    const isCurrent = item.week === pollData.metadata.current_week && item.year === pollData.metadata.current_year;
                    return (
                      <option key={`${item.year}-${item.week}`} value={`${item.year}-${item.week}`}>
                        {label} {isCurrent ? '(Current)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
          
          <div className="bg-cream-200/60 p-1 rounded-lg flex space-x-1 border border-cream-300 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('consensus')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'consensus'
                ? 'bg-maroon-500 text-white shadow'
                : 'text-dark-900/70 hover:text-dark-900 hover:bg-cream-300/40'
                }`}
            >
              Consensus
            </button>
            <button
              onClick={() => setActiveTab('Jack')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'Jack'
                ? 'bg-maroon-500 text-white shadow'
                : 'text-dark-900/70 hover:text-dark-900 hover:bg-cream-300/40'
                }`}
            >
              Jack's Ballot
            </button>
            <button
              onClick={() => setActiveTab('Devan')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'Devan'
                ? 'bg-maroon-500 text-white shadow'
                : 'text-dark-900/70 hover:text-dark-900 hover:bg-cream-300/40'
                }`}
            >
              Devan's Ballot
            </button>
          </div>
        </div>

        {/* Table / List Container */}
        <div className="bg-cream-50 border border-dark-900/10 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream-200/40 text-dark-900/60 text-xs font-bold uppercase tracking-wider border-b border-dark-900/10">
                  <th className="py-4 px-6 text-center w-20">Rank</th>
                  <th className="py-4 px-4">Team</th>
                  <th className="py-4 px-4 text-center w-28">Record</th>
                  <th className="py-4 px-4 text-center w-28">Prev. Rank</th>
                  <th className="py-4 px-4 text-center w-28">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-900/10">
                {activeRankings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-dark-900/40 font-semibold">
                      No ballot submitted for this week yet.
                    </td>
                  </tr>
                ) : (
                  activeRankings.map((ranking) => (
                    <tr
                      key={ranking.rank}
                      className="hover:bg-cream-200/30 transition-all duration-150 group"
                      style={getTeamStyle(ranking.team)}
                    >
                      {/* Rank */}
                      <td className="py-5 px-6 text-center border-l-4 border-l-[var(--team-primary,#800020)]">
                        <span className="font-display font-extrabold text-lg sm:text-xl text-[var(--team-primary,#800020)]">
                          {ranking.rank.toString().padStart(2, '0')}
                        </span>
                      </td>

                      {/* Team */}
                      <td className="py-5 px-4">
                        <div className="flex items-center space-x-3.5">
                          <TeamLogo
                            teamQuery={ranking.team}
                            className="w-8 h-8 object-contain flex-shrink-0"
                            fallbackSize={32}
                          />
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                            <span className="font-semibold text-dark-900 text-base sm:text-lg group-hover:text-[var(--team-primary)] transition-colors">
                              {ranking.team}
                            </span>
                            <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-cream-200 border border-cream-300/60 text-dark-900/60">
                              {ranking.conference}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Record */}
                      <td className="py-5 px-4 text-center">
                        <span className="font-semibold text-sm text-dark-900/70">
                          {ranking.record}
                        </span>
                      </td>

                      {/* Prev Rank */}
                      <td className="py-5 px-4 text-center">
                        <span className="font-semibold text-sm text-dark-900/70">
                          {ranking.previousRank}
                        </span>
                      </td>

                      {/* Change */}
                      <td className="py-5 px-4 text-center">
                        <div className="flex items-center justify-center">
                          {ranking.trend === 'up' && (
                            <span className="text-emerald-600 text-xs font-bold flex items-center">
                              ▲ <span className="ml-0.5">{ranking.trendDifference}</span>
                            </span>
                          )}
                          {ranking.trend === 'down' && (
                            <span className="text-rose-600 text-xs font-bold flex items-center">
                              ▼ <span className="ml-0.5">{ranking.trendDifference}</span>
                            </span>
                          )}
                          {ranking.trend === 'same' && (
                            <span className="text-dark-900/40 text-xs font-semibold flex items-center">
                              --
                            </span>
                          )}
                          {ranking.trend === 'new' && (
                            <span className="text-blue-600 text-xs font-bold flex items-center">
                              NEW
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      </>
      )}
    </div>
  );
}

export default App

