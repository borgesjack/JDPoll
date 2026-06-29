import os
from dotenv import load_dotenv

# Explicitly load environment variables from backend/.env
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'jd-poll-secret-key-change-me')
    
    # SQLAlchemy Configuration
    database_url = os.environ.get('DATABASE_URL')
    if database_url and database_url.startswith('postgres://'):
        # SQLAlchemy 1.4+ requires 'postgresql://' instead of 'postgres://'
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
        
    SQLALCHEMY_DATABASE_URI = database_url or 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Optional Supabase API keys (if you plan to use the supabase-py client later)
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_KEY = os.environ.get('SUPABASE_KEY')
    
    # Flask CORS config
    CORS_HEADERS = 'Content-Type'
