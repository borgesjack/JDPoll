from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Team(db.Model):
    __tablename__ = 'teams'
    
    code = db.Column(db.String(10), primary_key=True) # e.g. 'UGA', 'OSU', 'UCONN'
    name = db.Column(db.String(100), nullable=False, unique=True) # e.g. 'Georgia'
    record = db.Column(db.String(20), nullable=False, default='0-0')
    conference = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(20), nullable=False, default='#999999')
    
    # Relationship to rankings
    rankings = db.relationship('Ranking', backref='team', lazy=True)

    def to_dict(self):
        return {
            'code': self.code,
            'name': self.name,
            'record': self.record,
            'conference': self.conference,
            'color': self.color
        }

class Ranking(db.Model):
    __tablename__ = 'rankings'
    
    id = db.Column(db.Integer, primary_key=True)
    team_code = db.Column(db.String(10), db.ForeignKey('teams.code'), nullable=False)
    rank = db.Column(db.Integer, nullable=False)
    poll_type = db.Column(db.String(20), nullable=False)  # 'consensus', 'jack', 'devan'
    previous_rank = db.Column(db.String(20), nullable=False, default='-')
    trend = db.Column(db.String(20), nullable=False, default='same')  # 'up', 'down', 'same', 'new'
    points = db.Column(db.Integer, nullable=True)  # Mainly for consensus

    def to_dict(self):
        return {
            'id': self.id,
            'team_name': self.team_name,
            'rank': self.rank,
            'poll_type': self.poll_type,
            'previous_rank': self.previous_rank,
            'trend': self.trend,
            'points': self.points
        }

class Voter(db.Model):
    __tablename__ = 'voters'
    
    slug = db.Column(db.String(20), primary_key=True)  # 'jack', 'devan'
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    avatar_initials = db.Column(db.String(5), nullable=False)

    def to_dict(self):
        return {
            'slug': self.slug,
            'name': self.name,
            'role': self.role,
            'description': self.description,
            'avatar_initials': self.avatar_initials
        }

class RawRanking(db.Model):
    __tablename__ = 'raw_rankings'
    
    team = db.Column(db.String(5), primary_key=True)
    ranking = db.Column(db.SmallInteger, nullable=False)
    week = db.Column(db.SmallInteger, primary_key=True)
    season = db.Column(db.SmallInteger, primary_key=True)
    voter = db.Column(db.String(10), primary_key=True)

    def to_dict(self):
        return {
            'team': self.team,
            'ranking': self.ranking,
            'week': self.week,
            'season': self.season,
            'voter': self.voter
        }

class ConsensusRanking(db.Model):
    __tablename__ = 'consensus_rankings'
    
    team = db.Column(db.String(5), primary_key=True)
    rank = db.Column(db.SmallInteger, nullable=False)
    week = db.Column(db.SmallInteger, primary_key=True)
    year = db.Column(db.SmallInteger, primary_key=True)

    def to_dict(self):
        return {
            'team': self.team,
            'rank': self.rank,
            'week': self.week,
            'year': self.year
        }


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    session_token = db.Column(db.String(255), nullable=True)
    
    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username
        }


