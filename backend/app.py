from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db, RawRanking, ConsensusRanking, User
import logging
import re
import json
import os
import datetime

app = Flask(__name__)
app.config.from_object(Config)

def calculate_cfb_week_for_date(dt):
    """
    Calculate the college football season year and week for a given datetime object.
    Week 1 begins on the Tuesday before Labor Day.
    Each week runs from Tuesday to the following Monday.
    Before Week 1 start, it is Preseason (Week 0).
    Capped at Week 15 (end of regular season).
    """
    year = dt.year
    # Find Labor Day (first Monday in September)
    first_sept = datetime.date(year, 9, 1)
    first_sept_wd = first_sept.weekday()
    if first_sept_wd == 0:
        labor_day = first_sept
    else:
        labor_day = first_sept + datetime.timedelta(days=(0 - first_sept_wd) % 7)
        
    # Week 1 starts on the Tuesday before Labor Day (6 days prior)
    week_1_start = labor_day - datetime.timedelta(days=6)
    
    if dt.date() < week_1_start:
        return year, 0
        
    delta = dt.date() - week_1_start
    week_num = 1 + (delta.days // 7)
    
    if week_num > 15:
        week_num = 15
        
    return year, week_num

# Enable CORS for the frontend development server
CORS(app)

# Initialize SQLAlchemy
db.init_app(app)

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Run database setup
with app.app_context():
    try:
        from sqlalchemy import text
        db.create_all()
        # Migrate existing lowercase voter entries
        db.session.execute(text("UPDATE raw_rankings SET voter = 'Jack' WHERE voter = 'jack';"))
        db.session.execute(text("UPDATE raw_rankings SET voter = 'Devan' WHERE voter = 'devan';"))
        db.session.commit()
        
        # Seed users if they don't exist
        jack_user = User.query.filter_by(username='Jack').first()
        if not jack_user:
            logger.info("Seeding user 'Jack'...")
            jack_user = User(username='Jack')
            jack_user.set_password(os.environ.get('JACK_PASSWORD', 'Jack2026'))
            db.session.add(jack_user)
            
        devan_user = User.query.filter_by(username='Devan').first()
        if not devan_user:
            logger.info("Seeding user 'Devan'...")
            devan_user = User(username='Devan')
            devan_user.set_password(os.environ.get('DEVAN_PASSWORD', 'Devan2026'))
            db.session.add(devan_user)
            
        db.session.commit()
        logger.info("Database initialized and seeded successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        db.session.rollback()


def load_teams():
    """Parse src/data/teamsData.ts to load team metadata."""
    try:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        ts_path = os.path.join(backend_dir, '../src/data/teamsData.ts')
        if os.path.exists(ts_path):
            with open(ts_path, 'r', encoding='utf-8') as f:
                content = f.read()
            match = re.search(r'export const teamsData: Team\[\] = (\[.*\]);', content, re.DOTALL)
            if match:
                return json.loads(match.group(1))
    except Exception as e:
        logger.warning(f"Failed to load teamsData.ts: {e}")
    return []

# Load teams on launch
TEAMS_LIST = load_teams()
TEAMS_BY_CODE = {t['abbreviation'].upper(): t for t in TEAMS_LIST}

# Cache file for ESPN standings/records
RECORDS_CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'records_cache.json')

def fetch_and_cache_records():
    """Fetch college football team records from ESPN and cache them locally."""
    try:
        import urllib.request
        url = "https://site.api.espn.com/apis/v2/sports/football/college-football/standings"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            
        records = {}
        children = data.get('children', [])
        for conf in children:
            entries = conf.get('standings', {}).get('entries', [])
            for entry in entries:
                team = entry.get('team', {})
                team_id = team.get('id')
                abbr = team.get('abbreviation')
                name = team.get('displayName')
                
                # Find the overall record stat
                overall_record = "0-0"
                for stat in entry.get('stats', []):
                    if stat.get('name') == 'overall':
                        overall_record = stat.get('displayValue', '0-0')
                        break
                
                if team_id:
                    records[str(team_id)] = overall_record
                if abbr:
                    records[abbr.upper()] = overall_record
                if name:
                    records[name.lower()] = overall_record
                    
        # Save to cache
        cache_data = {
            'last_updated': datetime.datetime.utcnow().isoformat(),
            'records': records
        }
        with open(RECORDS_CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, indent=2)
            
        return records
    except Exception as e:
        logger.warning(f"Failed to fetch standings from ESPN: {e}")
        return {}

def get_cached_records():
    """Get team records from local cache. Refresh if cache is older than 24 hours."""
    now = datetime.datetime.utcnow()
    refresh = True
    records = {}
    
    if os.path.exists(RECORDS_CACHE_FILE):
        try:
            with open(RECORDS_CACHE_FILE, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
            last_updated_str = cache_data.get('last_updated')
            if last_updated_str:
                last_updated = datetime.datetime.fromisoformat(last_updated_str)
                # Check if less than 24 hours old
                if (now - last_updated).total_seconds() < 86400:
                    refresh = False
                    records = cache_data.get('records', {})
        except Exception as e:
            logger.warning(f"Failed to read records cache: {e}")
            
    if refresh:
        logger.info("ESPN Team records cache expired or missing, refreshing...")
        fetched = fetch_and_cache_records()
        if fetched:
            records = fetched
            
    return records

def get_empty_fallback(season=2026, week=0):
    """Clean fallback metadata with empty rankings."""
    week_str = "Preseason" if week == 0 else f"Week {week}"
    return {
        "metadata": {
            "poll_season": f"{season} Season",
            "poll_week": week_str,
            "last_updated": "Updated recently",
            "hero_title": "JD Poll",
            "hero_description": "",
            "info_box_title": "Voter Committee Info",
            "info_box_description": "Rankings are updated every Tuesday morning. Consensus points are calculated by assigning 25 points for a 1st place vote down to 1 point for a 25th place vote.",
            "rankings_section_title": f"College Football Top 25 - {week_str}"
        },
        "voters": [
            {
                "slug": "Jack",
                "name": "Jack",
                "role": "Lead Poll Analyst",
                "description": "Founder of the JDPoll. Obsessed with SEC football and advanced analytics. Believes defense wins championships but speed wins games.",
                "avatar_initials": "JD",
                "top_picks": []
            },
            {
                "slug": "Devan",
                "name": "Devan",
                "role": "Guest Contributor",
                "description": "A long-time college football enthusiast who brings a West Coast bias and Big Ten appreciation to the committee.",
                "avatar_initials": "V2",
                "top_picks": []
            }
        ],
        "rankings": {
            "consensus": [],
            "Jack": [],
            "Devan": []
        }
    }

@app.route('/api/poll-data', methods=['GET'])
def get_poll_data():
    try:
        from flask import request
        # Get optional week and year parameters
        req_week = request.args.get('week')
        req_year = request.args.get('year')
        
        # Calculate current week and year
        now_dt = datetime.datetime.now()
        current_year, current_week = calculate_cfb_week_for_date(now_dt)
        
        # Determine target week and year to query
        if req_week is not None and req_year is not None:
            target_week = int(req_week)
            target_year = int(req_year)
        else:
            target_week = current_week
            target_year = current_year
            
        # Get list of unique weeks with any data in DB
        weeks_set = set()
        db_available = app.config.get('SQLALCHEMY_DATABASE_URI') and "username:password" not in app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if db_available:
            try:
                raw_weeks = db.session.query(RawRanking.season.label('year'), RawRanking.week).distinct().all()
                for r in raw_weeks:
                    weeks_set.add((r.year, r.week))
                consensus_weeks = db.session.query(ConsensusRanking.year, ConsensusRanking.week).distinct().all()
                for c in consensus_weeks:
                    weeks_set.add((c.year, c.week))
            except Exception as db_err:
                logger.warning(f"Failed to query available weeks: {db_err}")
                
        # Always include the current calculated week/year
        weeks_set.add((current_year, current_week))
        
        # Sort and format the list of available weeks
        available_weeks = [{"year": y, "week": w} for y, w in sorted(weeks_set, key=lambda x: (x[0], x[1]))]

        # Check if database is configured
        if not db_available:
            fallback = get_empty_fallback(target_year, target_week)
            fallback["metadata"]["current_week"] = current_week
            fallback["metadata"]["current_year"] = current_year
            fallback["metadata"]["viewing_week"] = target_week
            fallback["metadata"]["viewing_year"] = target_year
            fallback["metadata"]["available_weeks"] = available_weeks
            return jsonify(fallback)
            
        # Query consensus rankings for target week/year
        consensus_query = db.session.query(ConsensusRanking).filter(
            ConsensusRanking.year == target_year,
            ConsensusRanking.week == target_week
        ).order_by(ConsensusRanking.rank).all()
        
        # Query individual voter rankings for target week/year
        raw_query = db.session.query(RawRanking).filter(
            RawRanking.season == target_year,
            RawRanking.week == target_week
        ).order_by(RawRanking.ranking).all()
        
        # Map rankings using TEAMS_BY_CODE and compute previous week rankings/trends
        records_map = get_cached_records()
        
        # 1. Query rankings for the previous week (W - 1)
        prev_week = target_week - 1 if target_week > 0 else 0
        prev_consensus_map = {}
        prev_raw_map = {'Jack': {}, 'Devan': {}}
        
        if target_week > 0:
            try:
                prev_consensus_query = db.session.query(ConsensusRanking).filter(
                    ConsensusRanking.year == target_year,
                    ConsensusRanking.week == prev_week
                ).all()
                prev_consensus_map = {r.team.upper(): r.rank for r in prev_consensus_query}
                
                prev_raw_query = db.session.query(RawRanking).filter(
                    RawRanking.season == target_year,
                    RawRanking.week == prev_week
                ).all()
                for r in prev_raw_query:
                    v = r.voter
                    if v in prev_raw_map:
                        prev_raw_map[v][r.team.upper()] = r.ranking
            except Exception as db_err:
                logger.warning(f"Failed to query previous week rankings: {db_err}")
                
        # 2. Map consensus rankings
        consensus_list = []
        for r in consensus_query:
            team_info = TEAMS_BY_CODE.get(r.team.upper())
            if team_info:
                team_id = str(team_info.get('id', ''))
                team_abbr = team_info.get('abbreviation', '').upper()
                team_name = team_info.get('displayName', '').lower()
                record = records_map.get(team_id) or records_map.get(team_abbr) or records_map.get(team_name) or "0-0"
                
                # Compute previous rank and trend
                prev_rank = prev_consensus_map.get(r.team.upper())
                trend = 'same'
                prev_rank_str = '--'
                trend_diff = 0
                
                if target_week > 0:
                    if prev_rank is not None:
                        prev_rank_str = str(prev_rank)
                        if prev_rank > r.rank:
                            trend = 'up'
                            trend_diff = prev_rank - r.rank
                        elif prev_rank < r.rank:
                            trend = 'down'
                            trend_diff = r.rank - prev_rank
                    else:
                        trend = 'new'
                        prev_rank_str = '--'
                        
                consensus_list.append({
                    'rank': r.rank,
                    'team': team_info['displayName'],
                    'record': record,
                    'previousRank': prev_rank_str,
                    'trend': trend,
                    'trendDifference': trend_diff,
                    'conference': team_info['conference'],
                    'color': team_info['color']
                })
                
        db_rankings = {
            'consensus': consensus_list,
            'Jack': [],
            'Devan': []
        }
        
        # 3. Map individual voter rankings
        for r in raw_query:
            voter_slug = r.voter
            if voter_slug in db_rankings:
                team_info = TEAMS_BY_CODE.get(r.team.upper())
                if team_info:
                    team_id = str(team_info.get('id', ''))
                    team_abbr = team_info.get('abbreviation', '').upper()
                    team_name = team_info.get('displayName', '').lower()
                    record = records_map.get(team_id) or records_map.get(team_abbr) or records_map.get(team_name) or "0-0"
                    
                    # Compute previous rank and trend
                    prev_rank = prev_raw_map[voter_slug].get(r.team.upper())
                    trend = 'same'
                    prev_rank_str = '--'
                    trend_diff = 0
                    
                    if target_week > 0:
                        if prev_rank is not None:
                            prev_rank_str = str(prev_rank)
                            if prev_rank > r.ranking:
                                trend = 'up'
                                trend_diff = prev_rank - r.ranking
                            elif prev_rank < r.ranking:
                                trend = 'down'
                                trend_diff = r.ranking - prev_rank
                        else:
                            trend = 'new'
                            prev_rank_str = '--'
                            
                    db_rankings[voter_slug].append({
                        'rank': r.ranking,
                        'team': team_info['displayName'],
                        'record': record,
                        'previousRank': prev_rank_str,
                        'trend': trend,
                        'trendDifference': trend_diff,
                        'conference': team_info['conference'],
                        'color': team_info['color']
                    })
                    
        # Populate voters top picks
        voters_list = [
            {
                "slug": "Jack",
                "name": "Jack",
                "role": "Lead Poll Analyst",
                "description": "Founder of the JDPoll. Obsessed with SEC football and advanced analytics. Believes defense wins championships but speed wins games.",
                "avatar_initials": "JD",
                "top_picks": [item['team'] for item in db_rankings['Jack'][:3]]
            },
            {
                "slug": "Devan",
                "name": "Devan",
                "role": "Guest Contributor",
                "description": "A long-time college football enthusiast who brings a West Coast bias and Big Ten appreciation to the committee.",
                "avatar_initials": "V2",
                "top_picks": [item['team'] for item in db_rankings['Devan'][:3]]
            }
        ]
        
        week_str = "Preseason" if target_week == 0 else f"Week {target_week}"
        response_data = {
            'metadata': {
                "poll_season": f"{target_year} Season",
                "poll_week": week_str,
                "last_updated": "Updated recently",
                "hero_title": "JD Poll",
                "hero_description": "",
                "info_box_title": "Voter Committee Info",
                "info_box_description": "Rankings are updated every Tuesday morning. Consensus points are calculated by assigning 25 points for a 1st place vote down to 1 point for a 25th place vote.",
                "rankings_section_title": f"College Football Top 25 - {week_str}",
                "current_week": current_week,
                "current_year": current_year,
                "viewing_week": target_week,
                "viewing_year": target_year,
                "available_weeks": available_weeks
            },
            'voters': voters_list,
            'rankings': db_rankings
        }
        return jsonify(response_data)
        
    except Exception as e:
        logger.warning(f"Database query failed, returning fallback mock data. Error: {e}")
        t_week = target_week if 'target_week' in locals() else 0
        t_year = target_year if 'target_year' in locals() else 2026
        c_week = current_week if 'current_week' in locals() else 0
        c_year = current_year if 'current_year' in locals() else 2026
        fallback_data = get_empty_fallback(t_year, t_week)
        fallback_data["metadata"]["current_week"] = c_week
        fallback_data["metadata"]["current_year"] = c_year
        fallback_data["metadata"]["viewing_week"] = t_week
        fallback_data["metadata"]["viewing_year"] = t_year
        fallback_data["metadata"]["available_weeks"] = [{"year": c_year, "week": c_week}]
        return jsonify(fallback_data)

@app.route('/api/ballot', methods=['GET'])
def get_ballot():
    from flask import request
    voter = request.args.get('voter')
    week = request.args.get('week')
    year = request.args.get('year')
    
    if not voter or week is None or year is None:
        return jsonify({'error': 'Missing voter, week, or year'}), 400
        
    try:
        week_num = int(week)
        year_num = int(year)
        
        # Check if database is configured
        if not app.config.get('SQLALCHEMY_DATABASE_URI') or "username:password" in app.config.get('SQLALCHEMY_DATABASE_URI', ''):
            return jsonify({'rankings': []})
            
        from models import RawRanking
        
        # Query individual voter rankings
        raw_query = db.session.query(RawRanking).filter(
            RawRanking.voter == voter,
            RawRanking.week == week_num,
            RawRanking.season == year_num
        ).order_by(RawRanking.ranking).all()
        
        rankings_list = []
        for r in raw_query:
            rankings_list.append({
                'team': r.team.upper(),
                'ranking': r.ranking
            })
            
        return jsonify({'rankings': rankings_list})
        
    except Exception as e:
        logger.error(f"Failed to fetch ballot: {e}")
        return jsonify({'error': f'Database query failed: {str(e)}'}), 500

def update_consensus_rankings(week_num, year_num):
    """
    Check if both jack and devan have entries in raw_rankings for the given week and year.
    If so, calculate the consensus rankings and save/replace them in consensus_rankings table.
    """
    try:
        import random
        # Query unique voter names for this week and season
        voters = db.session.query(RawRanking.voter).filter(
            RawRanking.week == week_num,
            RawRanking.season == year_num
        ).distinct().all()
        
        voter_names = {v[0] for v in voters}
        
        if 'Jack' in voter_names and 'Devan' in voter_names:
            # Get all raw rankings for this week and season
            all_rankings = db.session.query(RawRanking).filter(
                RawRanking.week == week_num,
                RawRanking.season == year_num
            ).all()
            
            # Map individual voter ratings (26 - rank)
            voter_ratings = {'Jack': {}, 'Devan': {}}
            for r in all_rankings:
                voter_name = r.voter
                if voter_name in voter_ratings:
                    voter_ratings[voter_name][r.team.upper()] = 26 - r.ranking
                    
            # Get unique teams ranked by either voter
            teams_set = set(r.team.upper() for r in all_rankings)
            
            # Retrieve cached records for record comparison
            records_map = get_cached_records()
            
            teams_to_sort = []
            for team_code in teams_set:
                r_jack = voter_ratings['Jack'].get(team_code, 0)
                r_devan = voter_ratings['Devan'].get(team_code, 0)
                total_pts = r_jack + r_devan
                max_rate = max(r_jack, r_devan)
                
                # Fetch record string
                team_record = "0-0"
                team_info = TEAMS_BY_CODE.get(team_code)
                if team_info:
                    team_id = str(team_info.get('id', ''))
                    team_abbr = team_info.get('abbreviation', '').upper()
                    team_name = team_info.get('displayName', '').lower()
                    team_record = records_map.get(team_id) or records_map.get(team_abbr) or records_map.get(team_name) or "0-0"
                    
                # Parse record to win percentage and wins
                win_pct, win_count = 0.0, 0
                if '-' in team_record:
                    try:
                        parts = team_record.split('-')
                        w = int(parts[0])
                        l = int(parts[1])
                        tot = w + l
                        if tot > 0:
                            win_pct = w / tot
                        win_count = w
                    except Exception:
                        pass
                        
                teams_to_sort.append({
                    'team': team_code,
                    'total_points': total_pts,
                    'max_rating': max_rate,
                    'win_percentage': win_pct,
                    'wins': win_count,
                    'random_val': random.random()
                })
                
            # Sort by total points, then peak rating, then win percentage, then wins, then randomly
            teams_to_sort.sort(key=lambda x: (
                x['total_points'],
                x['max_rating'],
                x['win_percentage'],
                x['wins'],
                x['random_val']
            ), reverse=True)
            
            # Keep top 25
            top_25 = teams_to_sort[:25]
            
            # Delete existing consensus rankings for this week/year
            db.session.query(ConsensusRanking).filter(
                ConsensusRanking.week == week_num,
                ConsensusRanking.year == year_num
            ).delete()
            
            # Insert new consensus rankings
            for index, item in enumerate(top_25):
                consensus_rank = ConsensusRanking(
                    team=item['team'],
                    rank=index + 1,
                    week=week_num,
                    year=year_num
                )
                db.session.add(consensus_rank)
                
            db.session.commit()
            logger.info(f"Consensus rankings automatically updated for Week {week_num}, Year {year_num}")
    except Exception as e:
        logger.error(f"Failed to update consensus rankings: {e}")
        db.session.rollback()
        raise e

import secrets

def get_current_user():
    """Helper to verify Authorization header and return User object if valid."""
    from flask import request
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        user = User.query.filter_by(session_token=token).first()
        return user
    return None

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    from flask import request
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required.'}), 400
        
    user = User.query.filter(User.username.ilike(username)).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid username or password.'}), 401
        
    token = secrets.token_hex(32)
    user.session_token = token
    db.session.commit()
    
    return jsonify({
        'token': token,
        'username': user.username
    })

@app.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    user = get_current_user()
    if user:
        user.session_token = None
        db.session.commit()
    return jsonify({'success': True})

@app.route('/api/auth/me', methods=['GET'])
def auth_me():
    user = get_current_user()
    if user:
        return jsonify({
            'logged_in': True,
            'username': user.username
        })
    return jsonify({'logged_in': False})

@app.route('/api/submit-ballot', methods=['POST'])
def submit_ballot():
    from flask import request
    
    # Enforce authentication
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Unauthorized. Please log in.'}), 401
        
    data = request.json or {}
    
    voter = data.get('voter')
    week = data.get('week')
    year = data.get('year')
    rankings = data.get('rankings', [])
    
    if not voter or week is None or year is None:
        return jsonify({'error': 'Missing voter, week, or year'}), 400
        
    # Enforce only voting for own username
    if current_user.username.lower() != voter.lower():
        return jsonify({'error': f'Forbidden. You are logged in as {current_user.username} and cannot submit a ballot for {voter}.'}), 403
        
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
                'message': f'Ballot received for {current_user.username} (Week {week_num}, Year {year_num}). Local simulation mode: Database not configured.'
            })
            
        from models import RawRanking
        
        # Delete existing rankings for this voter, week, and season (year)
        db.session.query(RawRanking).filter(
            RawRanking.voter == current_user.username,
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
                voter=current_user.username
            )
            db.session.add(raw_ranking)
            
        db.session.commit()
        
        # Calculate/update consensus rankings if both voters submitted
        update_consensus_rankings(week_num, year_num)
        
        return jsonify({
            'status': 'success',
            'message': f'Ballot successfully submitted for {current_user.username} (Week {week_num}, Year {year_num})!'
        })
        
    except Exception as e:
        logger.error(f"Failed to submit ballot: {e}")
        db.session.rollback()
        return jsonify({'error': f'Database submission failed: {str(e)}'}), 500

@app.route('/api/team-records', methods=['GET'])
def get_team_records():
    """Endpoint returning cached college football team records."""
    try:
        records_map = get_cached_records()
        return jsonify(records_map)
    except Exception as e:
        logger.error(f"Failed to return team records: {e}")
        return jsonify({})

@app.route('/api/consensus-rankings', methods=['GET'])
def get_consensus_rankings_api():
    """Endpoint returning consensus rankings for a specific week and year."""
    try:
        from flask import request
        week = request.args.get('week')
        year = request.args.get('year')
        if week is None or year is None:
            return jsonify({})
            
        week_val = int(week)
        year_val = int(year)
        
        # Query consensus rankings for this week/year
        rankings = db.session.query(ConsensusRanking).filter(
            ConsensusRanking.week == week_val,
            ConsensusRanking.year == year_val
        ).all()
        
        # Map team abbreviation to rank
        res = {r.team.upper(): r.rank for r in rankings}
        return jsonify(res)
    except Exception as e:
        logger.error(f"Failed to query consensus rankings: {e}")
        return jsonify({})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
