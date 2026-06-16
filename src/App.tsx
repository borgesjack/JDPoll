import { useState } from 'react'

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

const consensusRankings: TeamRanking[] = [
  { rank: 1, team: 'Georgia', record: '0-0', previousRank: '1', conference: 'SEC', color: '#BA0C2F', trend: 'same', points: 50 },
  { rank: 2, team: 'Ohio State', record: '0-0', previousRank: '3', conference: 'Big Ten', color: '#BB0000', trend: 'up', points: 47 },
  { rank: 3, team: 'Oregon', record: '0-0', previousRank: '2', conference: 'Big Ten', color: '#044A27', trend: 'down', points: 46 },
  { rank: 4, team: 'Texas', record: '0-0', previousRank: '4', conference: 'SEC', color: '#BF5700', trend: 'same', points: 42 },
  { rank: 5, team: 'Alabama', record: '0-0', previousRank: '5', conference: 'SEC', color: '#9E1B32', trend: 'same', points: 40 },
  { rank: 6, team: 'Ole Miss', record: '0-0', previousRank: '8', conference: 'SEC', color: '#00205B', trend: 'up', points: 34 },
  { rank: 7, team: 'Notre Dame', record: '0-0', previousRank: '6', conference: 'Independent', color: '#0C2340', trend: 'down', points: 32 },
  { rank: 8, team: 'Penn State', record: '0-0', previousRank: '7', conference: 'Big Ten', color: '#001E62', trend: 'down', points: 29 },
  { rank: 9, team: 'Michigan', record: '0-0', previousRank: '9', conference: 'Big Ten', color: '#00274C', trend: 'same', points: 25 },
  { rank: 10, team: 'Utah', record: '0-0', previousRank: '12', conference: 'Big 12', color: '#CC0000', trend: 'up', points: 20 },
];

const jdRankings: TeamRanking[] = [
  { rank: 1, team: 'Georgia', record: '0-0', previousRank: '1', conference: 'SEC', color: '#BA0C2F', trend: 'same', points: 25 },
  { rank: 2, team: 'Oregon', record: '0-0', previousRank: '2', conference: 'Big Ten', color: '#044A27', trend: 'same', points: 24 },
  { rank: 3, team: 'Ohio State', record: '0-0', previousRank: '3', conference: 'Big Ten', color: '#BB0000', trend: 'same', points: 23 },
  { rank: 4, team: 'Texas', record: '0-0', previousRank: '4', conference: 'SEC', color: '#BF5700', trend: 'same', points: 22 },
  { rank: 5, team: 'Alabama', record: '0-0', previousRank: '5', conference: 'SEC', color: '#9E1B32', trend: 'same', points: 21 },
  { rank: 6, team: 'Notre Dame', record: '0-0', previousRank: '6', conference: 'Independent', color: '#0C2340', trend: 'same', points: 20 },
  { rank: 7, team: 'Penn State', record: '0-0', previousRank: '7', conference: 'Big Ten', color: '#001E62', trend: 'same', points: 19 },
  { rank: 8, team: 'Ole Miss', record: '0-0', previousRank: '8', conference: 'SEC', color: '#00205B', trend: 'same', points: 18 },
  { rank: 9, team: 'Michigan', record: '0-0', previousRank: '9', conference: 'Big Ten', color: '#00274C', trend: 'same', points: 17 },
  { rank: 10, team: 'Utah', record: '0-0', previousRank: '10', conference: 'Big 12', color: '#CC0000', trend: 'same', points: 16 },
];

const friendRankings: TeamRanking[] = [
  { rank: 1, team: 'Georgia', record: '0-0', previousRank: '1', conference: 'SEC', color: '#BA0C2F', trend: 'same', points: 25 },
  { rank: 2, team: 'Ohio State', record: '0-0', previousRank: '2', conference: 'Big Ten', color: '#BB0000', trend: 'same', points: 24 },
  { rank: 3, team: 'Oregon', record: '0-0', previousRank: '3', conference: 'Big Ten', color: '#044A27', trend: 'same', points: 23 },
  { rank: 4, team: 'Texas', record: '0-0', previousRank: '4', conference: 'SEC', color: '#BF5700', trend: 'same', points: 22 },
  { rank: 5, team: 'Alabama', record: '0-0', previousRank: '5', conference: 'SEC', color: '#9E1B32', trend: 'same', points: 21 },
  { rank: 6, team: 'Ole Miss', record: '0-0', previousRank: '6', conference: 'SEC', color: '#00205B', trend: 'same', points: 20 },
  { rank: 7, team: 'Notre Dame', record: '0-0', previousRank: '7', conference: 'Independent', color: '#0C2340', trend: 'same', points: 19 },
  { rank: 8, team: 'Penn State', record: '0-0', previousRank: '8', conference: 'Big Ten', color: '#001E62', trend: 'same', points: 18 },
  { rank: 9, team: 'Michigan', record: '0-0', previousRank: '9', conference: 'Big Ten', color: '#00274C', trend: 'same', points: 17 },
  { rank: 10, team: 'Utah', record: '0-0', previousRank: '10', conference: 'Big 12', color: '#CC0000', trend: 'same', points: 16 },
];

function App() {
  const [activeTab, setActiveTab] = useState<'consensus' | 'jd' | 'friend'>('consensus');

  const getRankings = () => {
    switch (activeTab) {
      case 'jd': return jdRankings;
      case 'friend': return friendRankings;
      default: return consensusRankings;
    }
  };

  const activeRankings = getRankings();

  return (
    <div className="min-height-screen bg-cream-100 text-dark-900 pb-20 selection:bg-maroon-100 selection:text-maroon-700">
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
              <Placeholder />
            </span>
          </div>
          <nav className="flex items-center space-x-6 text-sm font-semibold tracking-wide text-dark-900/80">
            <a href="#rankings" className="hover:text-maroon-500 transition-colors">Rankings</a>
            <a href="#voters" className="hover:text-maroon-500 transition-colors">The Voters</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="font-display font-black text-5xl sm:text-7xl text-maroon-600 tracking-tight leading-none mb-6">
          JD <span className="font-display font-black text-5x1 sm:text-7x1 text-gold-400 tracking-tight leading-none mb-6">Poll</span>
        </h1>
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-dark-900/70 leading-relaxed mb-8">
          <Placeholder />
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
              <p className="text-xs font-bold text-maroon-700 uppercase tracking-wider"><Placeholder /></p>
              <p className="text-sm text-dark-900/80 mt-0.5">
                <Placeholder />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rankings Section */}
      <section id="rankings" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 scroll-mt-24">
        {/* Toggle Bar */}
        <div className="flex items-center justify-between border-b border-dark-900/10 pb-4 mb-6">
          <h2 className="font-display font-bold text-2xl text-dark-900 tracking-tight"><Placeholder /></h2>
          <div className="bg-cream-200/60 p-1 rounded-lg flex space-x-1 border border-cream-300">
            <button
              onClick={() => setActiveTab('consensus')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${activeTab === 'consensus'
                ? 'bg-maroon-500 text-cream-50 shadow'
                : 'text-dark-900/70 hover:text-dark-900 hover:bg-cream-300/40'
                }`}
            >
              Consensus
            </button>
            <button
              onClick={() => setActiveTab('jd')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${activeTab === 'jd'
                ? 'bg-maroon-500 text-cream-50 shadow'
                : 'text-dark-900/70 hover:text-dark-900 hover:bg-cream-300/40'
                }`}
            >
              JD's Ballot
            </button>
            <button
              onClick={() => setActiveTab('friend')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${activeTab === 'friend'
                ? 'bg-maroon-500 text-cream-50 shadow'
                : 'text-dark-900/70 hover:text-dark-900 hover:bg-cream-300/40'
                }`}
            >
              Friend's Ballot
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
                  >
                    {/* Rank */}
                    <td className="py-5 px-6 text-center">
                      <span className="font-display font-extrabold text-lg sm:text-xl text-maroon-500">
                        {ranking.rank.toString().padStart(2, '0')}
                      </span>
                    </td>

                    {/* Team */}
                    <td className="py-5 px-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-dark-900/20 shadow-inner flex-shrink-0"
                          style={{ backgroundColor: ranking.color }}
                        ></div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                          <span className="font-semibold text-dark-900 text-base sm:text-lg group-hover:text-maroon-500 transition-colors">
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
          <Placeholder />
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* JD Box */}
          <div className="bg-cream-50 border border-dark-900/10 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-maroon-500 text-cream-50 font-bold flex items-center justify-center font-display">
                  JD
                </div>
                <div>
                  <h3 className="font-bold text-lg text-dark-900"><Placeholder /></h3>
                  <p className="text-xs text-dark-900/50"><Placeholder /></p>
                </div>
              </div>
              <p className="text-sm text-dark-900/70 leading-relaxed mb-6">
                <Placeholder />
              </p>
            </div>
            <div className="border-t border-dark-900/10 pt-4">
              <span className="text-xs font-bold text-maroon-700 uppercase tracking-wider"><Placeholder /></span>
              <div className="flex space-x-2 mt-2">
                <span className="px-2 py-1 bg-maroon-50 border border-maroon-100 rounded text-xs text-maroon-700 font-semibold">Georgia</span>
                <span className="px-2 py-1 bg-maroon-50 border border-maroon-100 rounded text-xs text-maroon-700 font-semibold">Oregon</span>
                <span className="px-2 py-1 bg-maroon-50 border border-maroon-100 rounded text-xs text-maroon-700 font-semibold">Ohio State</span>
              </div>
            </div>
          </div>

          {/* Friend Box */}
          <div className="bg-cream-50 border border-dark-900/10 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-dark-900 text-cream-50 font-bold flex items-center justify-center font-display">
                  V2
                </div>
                <div>
                  <h3 className="font-bold text-lg text-dark-900"><Placeholder /></h3>
                  <p className="text-xs text-dark-900/50"><Placeholder /></p>
                </div>
              </div>
              <p className="text-sm text-dark-900/70 leading-relaxed mb-6">
                <Placeholder />
              </p>
            </div>
            <div className="border-t border-dark-900/10 pt-4">
              <span className="text-xs font-bold text-dark-900/60 uppercase tracking-wider"><Placeholder /></span>
              <div className="flex space-x-2 mt-2">
                <span className="px-2 py-1 bg-dark-900/5 border border-dark-900/10 rounded text-xs text-dark-900/70 font-semibold">Georgia</span>
                <span className="px-2 py-1 bg-dark-900/5 border border-dark-900/10 rounded text-xs text-dark-900/70 font-semibold">Ohio State</span>
                <span className="px-2 py-1 bg-dark-900/5 border border-dark-900/10 rounded text-xs text-dark-900/70 font-semibold">Oregon</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Simple Helper Component to render the placeholder tag
function Placeholder() {
  return <>Placeholder</>;
}

export default App
