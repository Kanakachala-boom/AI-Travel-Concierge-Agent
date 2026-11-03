import sys
import os
import pytest
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite:///./test_concierge.db"

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import init_db, SessionLocal
from app.seeds.run_seed import seed_database
from app.models.user import User
from app.services.security import hash_password
from app.services.jwt_service import create_access_token
from app.main import app

def ensure_test_user():
    """Helper ensuring a test user exists in the test DB and returning its token."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "test_concierge_user@example.com").first()
        if not user:
            user = User(
                full_name="Default Test Traveler",
                email="test_concierge_user@example.com",
                password_hash=hash_password("SecurePassword123!"),
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        token = create_access_token(user.id)
        return user, token
    finally:
        db.close()

def get_test_auth_headers():
    _, token = ensure_test_user()
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="session", autouse=True)
def initialize_test_database():
    """Ensure test database tables exist, are seeded, and test user exists."""
    init_db()
    seed_database(clear_existing=True)
    ensure_test_user()

@pytest.fixture(scope="session")
def default_test_user():
    user, _ = ensure_test_user()
    return user

@pytest.fixture(scope="session")
def auth_headers():
    return get_test_auth_headers()

@pytest.fixture
def client(auth_headers):
    return TestClient(app, headers=auth_headers)

@pytest.fixture
def anon_client():
    return TestClient(app)
