from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db, Team, Ranking, Voter
import logging

app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS for the frontend development server
CORS(app)

# Initialize SQLAlchemy
db.init_app(app)

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_mock_data():
    """Fallback mock data to return when database connection is not active or tables aren't setup."""
    return {
        "metadata": {
            "poll_season": "2024 Season",
            "poll_week": "Preseason",
            "last_updated": "Updated Tuesday, Sep 3",
            "hero_title": "JD Poll",
            "hero_description": "The definitive college football ranking. We combine official team records, conference alignments, and individual voter ballots to build the consensus Top 10.",
            "info_box_title": "Voter Committee Info",
            "info_box_description": "Rankings are updated every Tuesday morning. Consensus points are calculated by assigning 25 points for a 1st place vote down to 16 points for a 10th place vote.",
            "rankings_section_title": "College Football Top 10"
        },
        "voters": [
            {
                "slug": "jack",
                "name": "Jack",
                "role": "Lead Poll Analyst",
                "description": "Founder of the JDPoll. Obsessed with SEC football and advanced analytics. Believes defense wins championships but speed wins games.",
                "avatar_initials": "JD",
                "top_picks": ["Georgia", "Oregon", "Ohio State"]
            },
            {
                "slug": "devan",
                "name": "Devan",
                "role": "Guest Contributor",
                "description": "A long-time college football enthusiast who brings a West Coast bias and Big Ten appreciation to the committee.",
                "avatar_initials": "V2",
                "top_picks": ["Georgia", "Ohio State", "Oregon"]
            }
        ],
        "rankings": {
            "consensus": [
                { "rank": 1, "team": "Georgia", "record": "0-0", "previousRank": "1", "conference": "SEC", "color": "#BA0C2F", "trend": "same", "points": 50 },
                { "rank": 2, "team": "Ohio State", "record": "0-0", "previousRank": "3", "conference": "Big Ten", "color": "#BB0000", "trend": "up", "points": 47 },
                { "rank": 3, "team": "Oregon", "record": "0-0", "previousRank": "2", "conference": "Big Ten", "color": "#044A27", "trend": "down", "points": 46 },
                { "rank": 4, "team": "Texas", "record": "0-0", "previousRank": "4", "conference": "SEC", "color": "#BF5700", "trend": "same", "points": 42 },
                { "rank": 5, "team": "Alabama", "record": "0-0", "previousRank": "5", "conference": "SEC", "color": "#9E1B32", "trend": "same", "points": 40 },
                { "rank": 6, "team": "Ole Miss", "record": "0-0", "previousRank": "8", "conference": "SEC", "color": "#00205B", "trend": "up", "points": 34 },
                { "rank": 7, "team": "Notre Dame", "record": "0-0", "previousRank": "6", "conference": "Independent", "color": "#0C2340", "trend": "down", "points": 32 },
                { "rank": 8, "team": "Penn State", "record": "0-0", "previousRank": "7", "conference": "Big Ten", "color": "#001E62", "trend": "down", "points": 29 },
                { "rank": 9, "team": "Michigan", "record": "0-0", "previousRank": "9", "conference": "Big Ten", "color": "#00274C", "trend": "same", "points": 25 },
                { "rank": 10, "team": "Utah", "record": "0-0", "previousRank": "12", "conference": "Big 12", "color": "#CC0000", "trend": "up", "points": 20 }
            ],
            "jack": [
                { "rank": 1, "team": "Georgia", "record": "0-0", "previousRank": "1", "conference": "SEC", "color": "#BA0C2F", "trend": "same", "points": 25 },
                { "rank": 2, "team": "Oregon", "record": "0-0", "previousRank": "2", "conference": "Big Ten", "color": "#044A27", "trend": "same", "points": 24 },
                { "rank": 3, "team": "Ohio State", "record": "0-0", "previousRank": "3", "conference": "Big Ten", "color": "#BB0000", "trend": "same", "points": 23 },
                { "rank": 4, "team": "Texas", "record": "0-0", "previousRank": "4", "conference": "SEC", "color": "#BF5700", "trend": "same", "points": 22 },
                { "rank": 5, "team": "Alabama", "record": "0-0", "previousRank": "5", "conference": "SEC", "color": "#9E1B32", "trend": "same", "points": 21 },
                { "rank": 6, "team": "Notre Dame", "record": "0-0", "previousRank": "6", "conference": "Independent", "color": "#0C2340", "trend": "same", "points": 20 },
                { "rank": 7, "team": "Penn State", "record": "0-0", "previousRank": "7", "conference": "Big Ten", "color": "#001E62", "trend": "same", "points": 19 },
                { "rank": 8, "team": "Ole Miss", "record": "0-0", "previousRank": "8", "conference": "SEC", "color": "#00205B", "trend": "same", "points": 18 },
                { "rank": 9, "team": "Michigan", "record": "0-0", "previousRank": "9", "conference": "Big Ten", "color": "#00274C", "trend": "same", "points": 17 },
                { "rank": 10, "team": "Utah", "record": "0-0", "previousRank": "10", "conference": "Big 12", "color": "#CC0000", "trend": "same", "points": 16 }
            ],
            "devan": [
                { "rank": 1, "team": "Georgia", "record": "0-0", "previousRank": "1", "conference": "SEC", "color": "#BA0C2F", "trend": "same", "points": 25 },
                { "rank": 2, "team": "Ohio State", "record": "0-0", "previousRank": "2", "conference": "Big Ten", "color": "#BB0000", "trend": "same", "points": 24 },
                { "rank": 3, "team": "Oregon", "record": "0-0", "previousRank": "3", "conference": "Big Ten", "color": "#044A27", "trend": "same", "points": 23 },
                { "rank": 4, "team": "Texas", "record": "0-0", "previousRank": "4", "conference": "SEC", "color": "#BF5700", "trend": "same", "points": 22 },
                { "rank": 5, "team": "Alabama", "record": "0-0", "previousRank": "5", "conference": "SEC", "color": "#9E1B32", "trend": "same", "points": 21 },
                { "rank": 6, "team": "Ole Miss", "record": "0-0", "previousRank": "6", "conference": "SEC", "color": "#00205B", "trend": "same", "points": 20 },
                { "rank": 7, "team": "Notre Dame", "record": "0-0", "previousRank": "7", "conference": "Independent", "color": "#0C2340", "trend": "same", "points": 19 },
                { "rank": 8, "team": "Penn State", "record": "0-0", "previousRank": "8", "conference": "Big Ten", "color": "#001E62", "trend": "same", "points": 18 },
                { "rank": 9, "team": "Michigan", "record": "0-0", "previousRank": "9", "conference": "Big Ten", "color": "#00274C", "trend": "same", "points": 17 },
                { "rank": 10, "team": "Utah", "record": "0-0", "previousRank": "10", "conference": "Big 12", "color": "#CC0000", "trend": "same", "points": 16 }
            ]
        }
    }

@app.route('/api/poll-data', methods=['GET'])
def get_poll_data():
    try:
        # Check if database connection config exists
        if not app.config.get('SQLALCHEMY_DATABASE_URI') or "username:password" in app.config.get('SQLALCHEMY_DATABASE_URI', ''):
            # No database configured, return mock data
            return jsonify(get_mock_data())
            
        # Try to query rankings and join them with teams on team_code
        # Order by rank
        rankings_query = db.session.query(Ranking, Team).join(Team, Ranking.team_code == Team.code).order_by(Ranking.poll_type, Ranking.rank).all()
        
        if not rankings_query:
            # Tables exist but are empty, return fallback mock
            return jsonify(get_mock_data())
            
        # Group by poll type
        db_rankings = {'consensus': [], 'jack': [], 'devan': []}
        for ranking, team in rankings_query:
            pt = ranking.poll_type.lower()
            if pt in db_rankings:
                db_rankings[pt].append({
                    'rank': ranking.rank,
                    'team': team.name,
                    'record': team.record,
                    'previousRank': ranking.previous_rank,
                    'conference': team.conference,
                    'color': team.color,
                    'trend': ranking.trend,
                    'points': ranking.points or 0
                })
                
        # Query voters
        voters_query = Voter.query.all()
        voters_list = []
        for v in voters_query:
            top_picks = [r['team'] for r in db_rankings.get(v.slug, [])[:3]]
            voters_list.append({
                'slug': v.slug,
                'name': v.name,
                'role': v.role,
                'description': v.description,
                'avatar_initials': v.avatar_initials,
                'top_picks': top_picks
            })
            
        if not voters_list:
            voters_list = get_mock_data()['voters']
            
        response_data = {
            'metadata': get_mock_data()['metadata'],
            'voters': voters_list,
            'rankings': db_rankings
        }
        return jsonify(response_data)
        
    except Exception as e:
        logger.warning(f"Database query failed, returning fallback mock data. Error: {e}")
        return jsonify(get_mock_data())

@app.route('/api/submit-ballot', methods=['POST'])
def submit_ballot():
    from flask import request
    data = request.json or {}
    
    voter = data.get('voter')
    week = data.get('week')
    year = data.get('year')
    rankings = data.get('rankings', [])
    
    if not voter or week is None or year is None:
        return jsonify({'error': 'Missing voter, week, or year'}), 400
        
    if not rankings or len(rankings) != 25:
        return jsonify({'error': 'A ballot must contain exactly 25 teams'}), 400
        
    try:
        week_num = int(week)
        year_num = int(year)
        
        # Check if database connection config exists
        if not app.config.get('SQLALCHEMY_DATABASE_URI') or "username:password" in app.config.get('SQLALCHEMY_DATABASE_URI', ''):
            # No database configured, return mock/simulated response
            return jsonify({
                'status': 'simulated',
                'message': f'Ballot received for {voter} (Week {week_num}, Year {year_num}). Local simulation mode: Database not configured.'
            })
            
        from models import RawRanking
        
        # Delete existing rankings for this voter, week, and season (year)
        db.session.query(RawRanking).filter(
            RawRanking.voter == voter,
            RawRanking.week == week_num,
            RawRanking.season == year_num
        ).delete()
        
        # Insert the new rankings
        for item in rankings:
            team_code = item.get('team')      # e.g., 'UGA'
            ranking_num = item.get('ranking')  # e.g., 1
            
            raw_ranking = RawRanking(
                team=team_code,
                ranking=ranking_num,
                week=week_num,
                season=year_num,
                voter=voter
            )
            db.session.add(raw_ranking)
            
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': f'Ballot successfully submitted for {voter} (Week {week_num}, Year {year_num})!'
        })
        
    except Exception as e:
        logger.error(f"Failed to submit ballot: {e}")
        db.session.rollback()
        return jsonify({'error': f'Database submission failed: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)

