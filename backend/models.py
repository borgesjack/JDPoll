from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Team(db.Model):
    __tablename__ = 'teams'
    
    name = db.Column(db.String(100), primary_key=True)
    record = db.Column(db.String(20), nullable=False, default='0-0')
    conference = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(20), nullable=False, default='#999999')
    
    # Relationship to rankings
    rankings = db.relationship('Ranking', backref='team', lazy=True)

    def to_dict(self):
        return {
            'name': self.name,
            'record': self.record,
            'conference': self.conference,
            'color': self.color
        }

class Ranking(db.Model):
    __tablename__ = 'rankings'
    
    id = db.Column(db.Integer, primary_key=True)
    team_name = db.Column(db.String(100), db.ForeignKey('teams.name'), nullable=False)
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
