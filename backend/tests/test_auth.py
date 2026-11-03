import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestUserRegistration:
    def test_register_success(self):
        email = f"alice_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "full_name": "Alice Wonderland",
            "email": email,
            "password": "Password123!",
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == email
        assert data["full_name"] == "Alice Wonderland"
        assert "id" in data
        assert "password" not in data
        assert "password_hash" not in data

    def test_register_duplicate_email(self):
        email = "duplicate_user@example.com"
        payload = {
            "full_name": "First User",
            "email": email,
            "password": "Password123!",
        }
        res1 = client.post("/api/auth/register", json=payload)
        assert res1.status_code in (201, 400)
        
        # Second registration with exact same email must fail
        res2 = client.post("/api/auth/register", json=payload)
        assert res2.status_code == 400
        msg = res2.json().get("message") or res2.json().get("detail") or ""
        assert "already exists" in msg.lower()

    def test_register_invalid_email(self):
        payload = {
            "full_name": "Bad Email",
            "email": "not-an-email",
            "password": "Password123!",
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 422

    def test_register_weak_password(self):
        payload = {
            "full_name": "Weak Pwd",
            "email": "weak@example.com",
            "password": "short",  # < 8 chars
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 422

    def test_register_short_name(self):
        payload = {
            "full_name": "A",
            "email": "shortname@example.com",
            "password": "Password123!",
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 422


class TestUserLogin:
    def test_login_success(self):
        email = "login_success_user@example.com"
        client.post("/api/auth/register", json={
            "full_name": "Login User",
            "email": email,
            "password": "SecurePassword123!",
        })

        res = client.post("/api/auth/login", json={
            "email": email,
            "password": "SecurePassword123!",
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == email

    def test_login_wrong_password(self):
        email = "wrong_pwd_user@example.com"
        client.post("/api/auth/register", json={
            "full_name": "Wrong Pwd User",
            "email": email,
            "password": "SecurePassword123!",
        })

        res = client.post("/api/auth/login", json={
            "email": email,
            "password": "IncorrectPassword999!",
        })
        assert res.status_code == 401
        msg = res.json().get("message") or res.json().get("detail") or ""
        assert "invalid email or password" in msg.lower()

    def test_login_nonexistent_email(self):
        res = client.post("/api/auth/login", json={
            "email": "never_existed_xyz_999@example.com",
            "password": "SecurePassword123!",
        })
        assert res.status_code == 401


class TestTokenSecurityAndProfile:
    def test_get_me_authenticated(self):
        email = "profile_tester@example.com"
        client.post("/api/auth/register", json={
            "full_name": "Profile Tester",
            "email": email,
            "password": "SecurePassword123!",
        })
        login_res = client.post("/api/auth/login", json={
            "email": email,
            "password": "SecurePassword123!",
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = client.get("/api/auth/me", headers=headers)
        assert res.status_code == 200
        assert res.json()["email"] == email

    def test_get_me_unauthenticated(self):
        res = client.get("/api/auth/me")
        assert res.status_code == 401

    def test_get_me_invalid_token(self):
        headers = {"Authorization": "Bearer completely.fake.token"}
        res = client.get("/api/auth/me", headers=headers)
        assert res.status_code == 401


class TestMultiTenantDataIsolation:
    """
    CRITICAL SECURITY & PRIVACY REQUIREMENT:
    User A cannot view User B's bookings, recommendations, or search history.
    """

    def test_cross_user_booking_and_history_isolation(self):
        # 1. Register & Login User A
        email_a = "user_a_isolation@example.com"
        client.post("/api/auth/register", json={
            "full_name": "User Alpha",
            "email": email_a,
            "password": "Password123!",
        })
        token_a = client.post("/api/auth/login", json={
            "email": email_a,
            "password": "Password123!",
        }).json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # 2. Register & Login User B
        email_b = "user_b_isolation@example.com"
        client.post("/api/auth/register", json={
            "full_name": "User Beta",
            "email": email_b,
            "password": "Password123!",
        })
        token_b = client.post("/api/auth/login", json={
            "email": email_b,
            "password": "Password123!",
        }).json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # 3. User A searches for recommendations
        rec_res_a = client.post("/api/recommendations", headers=headers_a, json={
            "departure_city": "Delhi",
            "destination_city": "Mumbai",
            "departure_date": "2026-11-10",
            "return_date": "2026-11-14",
            "adults": 1,
            "budget": 35000.0,
            "preferred_hotel_stars": 3,
            "hotel_category_is_hard": True,
        })
        assert rec_res_a.status_code == 200
        search_id_a = rec_res_a.json()["id"]
        best_pkg_a = rec_res_a.json()["best_package"]

        # 4. User A confirms a simulated booking with unique offer
        unique_offer_a = f"PKG-USERA-{search_id_a[:8]}"
        best_pkg_a["offer_id"] = unique_offer_a
        best_pkg_a["package_id"] = unique_offer_a

        book_res_a = client.post("/api/booking/confirm", headers=headers_a, json={
            "offer_id": unique_offer_a,
            "confirm": True,
            "customer": {
                "name": "User Alpha",
                "email": email_a,
                "passenger_count": 1,
            },
            "package_details": best_pkg_a,
        })
        assert book_res_a.status_code == 200
        ref_a = book_res_a.json()["booking_reference"]

        # 5. User A can retrieve their own booking and history
        a_bookings = client.get("/api/booking/history", headers=headers_a).json()
        assert any(b["booking_reference"] == ref_a for b in a_bookings)

        a_single_booking = client.get(f"/api/booking/{ref_a}", headers=headers_a)
        assert a_single_booking.status_code == 200

        # 6. User B cannot see User A's booking in their booking history
        b_bookings = client.get("/api/booking/history", headers=headers_b).json()
        assert not any(b["booking_reference"] == ref_a for b in b_bookings), "Data leak: User B saw User A's booking!"

        # 7. User B cannot access User A's booking via direct reference lookup
        b_attempt_a_booking = client.get(f"/api/booking/{ref_a}", headers=headers_b)
        assert b_attempt_a_booking.status_code == 404, "Security violation: User B accessed User A's booking by reference!"

        # 8. User B cannot access User A's recommendation search history or replay
        b_rec_history = client.get("/api/recommendations/history", headers=headers_b).json()
        assert not any(r["id"] == search_id_a for r in b_rec_history), "Data leak: User B saw User A's search history!"

        b_attempt_a_rec = client.get(f"/api/recommendations/{search_id_a}", headers=headers_b)
        assert b_attempt_a_rec.status_code == 404, "Security violation: User B replayed User A's search recommendation!"

    def test_anonymous_access_rejected_on_all_protected_endpoints(self):
        """Anonymous requests must be rejected with 401 Unauthorized across all travel endpoints."""
        assert client.post("/api/recommendations", json={}).status_code == 401
        assert client.post("/api/search-packages", json={}).status_code == 401
        assert client.get("/api/recommendations/history").status_code == 401
        assert client.post("/api/verify-offer", json={}).status_code == 401
        assert client.post("/api/booking/confirm", json={}).status_code == 401
        assert client.get("/api/booking/history").status_code == 401
        assert client.get("/api/booking/SIM-RES-12345678").status_code == 401
        assert client.get("/api/flights").status_code == 401
        assert client.get("/api/hotels").status_code == 401
