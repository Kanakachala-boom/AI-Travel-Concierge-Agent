from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Construct engine based on DB dialect
engine_kwargs = {}
if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """FastAPI dependency to yield database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables and run safe schema migrations."""
    from app.models import flight, hotel, recommendation, booking, user  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Safe migration for existing SQLite or relational databases: ensure user_id column exists
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        if "bookings" in table_names:
            cols = [c["name"] for c in inspector.get_columns("bookings")]
            if "user_id" not in cols:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE bookings ADD COLUMN user_id INTEGER REFERENCES users(id)"))
        if "recommendation_histories" in table_names:
            cols = [c["name"] for c in inspector.get_columns("recommendation_histories")]
            if "user_id" not in cols:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE recommendation_histories ADD COLUMN user_id INTEGER REFERENCES users(id)"))
    except Exception as e:
        # If columns already exist or dialect handles differently, continue gracefully
        pass
