import { useState, useEffect } from 'react'
import { TeamLogo } from './components/TeamLogo'
import { getTeamStyle } from './utils/teamUtils'
import { VotePage } from './components/VotePage'

interface TeamRanking {
  rank: number;
  team: string;
  record: string;
  previousRank: string;
  conference: string;
  color: string;
  trend: 'up' | 'down' | 'same' | 'new';
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
}

interface PollData {
  metadata: PollMetadata;
  voters: Voter[];
  rankings: {
    consensus: TeamRanking[];
    jack: TeamRanking[];
    devan: TeamRanking[];
  };
}

function App() {
  const [pollData, setPollData] = useState<PollData | null>(null);
  const [activeTab, setActiveTab] = useState<'consensus' | 'jack' | 'devan'>('consensus');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'vote'>(() => {
    return window.location.hash === '#vote' ? 'vote' : 'home';
  });

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentView(window.location.hash === '#vote' ? 'vote' : 'home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    fetch('/api/poll-data')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch poll data');
        }
        return res.json();
      })
      .then((data: PollData) => {
        setPollData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'An error occurred while loading data.');
        setLoading(false);
      });
  }, []);

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
      case 'jack': return pollData.rankings.jack;
      case 'devan': return pollData.rankings.devan;
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
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-maroon-50 text-maroon-700 border border-maroon-100">
              {pollData.metadata.poll_week}
            </span>
          </div>
          <nav className="flex items-center space-x-6 text-sm font-semibold tracking-wide text-dark-900/80">
            <a 
              href="#" 
              className={`hover:text-maroon-500 transition-colors ${currentView === 'home' ? 'text-maroon-600 font-extrabold' : ''}`}
            >
              Home
            </a>
            {currentView === 'home' && (
              <>
                <a href="#rankings" className="hover:text-maroon-500 transition-colors">Rankings</a>
                <a href="#voters" className="hover:text-maroon-500 transition-colors">The Voters</a>
              </>
            )}
            <a 
              href="#vote" 
              className={`hover:text-maroon-500 transition-colors ${currentView === 'vote' ? 'text-maroon-600 font-extrabold' : ''}`}
            >
              Submit Ballot
            </a>
          </nav>
        </div>
      </header>

      {currentView === 'vote' ? (
        <VotePage />
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

        {/* Info Box */}
        <div className="max-w-xl mx-auto bg-cream-50 border-l-4 border-maroon-500 p-4 rounded-r-lg shadow-sm text-left">
          <div className="flex space-x-3">
            <div className="flex-shrink-0 text-maroon-500">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-maroon-700 uppercase tracking-wider">{pollData.metadata.info_box_title}</p>
              <p className="text-sm text-dark-900/80 mt-0.5">
                {pollData.metadata.info_box_description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rankings Section */}
      <section id="rankings" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 scroll-mt-24">
        {/* Toggle Bar */}
        <div className="flex items-center justify-between border-b border-dark-900/10 pb-4 mb-6">
          <h2 className="font-display font-bold text-2xl text-dark-900 tracking-tight">
            {pollData.metadata.rankings_section_title}
          </h2>
          <div className="bg-cream-200/60 p-1 rounded-lg flex space-x-1 border border-cream-300">
            <button
              onClick={() => setActiveTab('consensus')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'consensus'
                ? 'bg-maroon-500 text-cream-55 shadow'
                : 'text-dark-900/70 hover:text-dark-900 hover:bg-cream-300/40'
                }`}
            >
              Consensus
            </button>
            <button
              onClick={() => setActiveTab('jack')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'jack'
                ? 'bg-maroon-500 text-cream-55 shadow'
                : 'text-dark-900/70 hover:text-dark-900 hover:bg-cream-300/40'
                }`}
            >
              Jack's Ballot
            </button>
            <button
              onClick={() => setActiveTab('devan')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'devan'
                ? 'bg-maroon-500 text-cream-55 shadow'
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
                  {activeTab === 'consensus' && <th className="py-4 px-6 text-right w-28">Points</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-900/10">
                {activeRankings.map((ranking) => (
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
                      <span className="font-semibold font-mono text-sm text-dark-900/70">
                        {ranking.record}
                      </span>
                    </td>

                    {/* Prev Rank */}
                    <td className="py-5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {ranking.trend === 'up' && (
                          <span className="text-emerald-600 text-xs font-semibold flex items-center">
                            ▲ <span className="ml-0.5">{ranking.previousRank}</span>
                          </span>
                        )}
                        {ranking.trend === 'down' && (
                          <span className="text-rose-600 text-xs font-semibold flex items-center">
                            ▼ <span className="ml-0.5">{ranking.previousRank}</span>
                          </span>
                        )}
                        {ranking.trend === 'same' && (
                          <span className="text-dark-900/40 text-xs font-semibold flex items-center">
                            • <span className="ml-0.5">{ranking.previousRank}</span>
                          </span>
                        )}
                        {ranking.trend === 'new' && (
                          <span className="text-blue-600 text-xs font-semibold flex items-center">
                            NEW <span className="ml-0.5">{ranking.previousRank}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Points */}
                    {activeTab === 'consensus' && (
                      <td className="py-5 px-6 text-right">
                        <span className="font-bold text-dark-900/80 bg-cream-200/60 border border-cream-300/40 px-2.5 py-1 rounded text-sm">
                          {ranking.points} pts
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* The Voters Section */}
      <section id="voters" className="max-w-5xl mx-auto px-4 py-16 scroll-mt-24">
        <h2 className="font-display font-bold text-2xl text-dark-900 tracking-tight text-center mb-10">
          Meet the Voters
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {pollData.voters.map((voter) => (
            <div 
              key={voter.slug} 
              className="bg-cream-50 border border-dark-900/10 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300"
            >
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 rounded-full ${voter.slug === 'jack' ? 'bg-maroon-500' : 'bg-dark-900'} text-cream-50 font-bold flex items-center justify-center font-display`}>
                    {voter.avatar_initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-dark-900">{voter.name}</h3>
                    <p className="text-xs text-dark-900/50">{voter.role}</p>
                  </div>
                </div>
                <p className="text-sm text-dark-900/70 leading-relaxed mb-6">
                  {voter.description}
                </p>
              </div>
              <div className="border-t border-dark-900/10 pt-4">
                <span className={`text-xs font-bold ${voter.slug === 'jack' ? 'text-maroon-700' : 'text-dark-900/60'} uppercase tracking-wider`}>
                  Top 3 Ballot Picks
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {voter.top_picks.map((pick, i) => (
                    <span 
                      key={i} 
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 ${voter.slug === 'jack' ? 'bg-maroon-50/10 border-maroon-100/50 text-maroon-700' : 'bg-dark-900/5 border-dark-900/10 text-dark-900/70'} border rounded-full text-xs font-semibold hover:bg-[var(--team-primary)]/10 hover:text-[var(--team-primary)] transition-colors`}
                      style={getTeamStyle(pick)}
                    >
                      <TeamLogo teamQuery={pick} className="w-4 h-4 object-contain" fallbackSize={16} />
                      <span>{pick}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      </>
      )}
    </div>
  );
}

export default App

