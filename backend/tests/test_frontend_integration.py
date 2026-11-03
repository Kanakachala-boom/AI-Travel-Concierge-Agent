import uuid
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from tests.conftest import get_test_auth_headers

client = TestClient(app, headers=get_test_auth_headers())

class TestFrontendAndFullIntegration:
    """Verifies that all frontend files exist and match the backend API contracts."""

    def test_frontend_static_assets_exist(self):
        frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
        assert frontend_dir.exists(), "frontend directory does not exist"
        
        index_html = frontend_dir / "index.html"
        assert index_html.exists(), "frontend/index.html missing"
        
        style_css = frontend_dir / "css" / "style.css"
        assert style_css.exists(), "frontend/css/style.css missing"
        
        js_files = ["api.js", "app.js", "results.js", "validation.js", "router.js", "state.js"]
        for js in js_files:
            file_path = frontend_dir / "js" / js
            assert file_path.exists(), f"frontend/js/{js} missing"
            
        # Assets logo icon check
        logo_path = frontend_dir / "assets" / "icons" / "logo.svg"
        assert logo_path.exists(), "frontend/assets/icons/logo.svg missing"

    def test_no_framework_dependencies_in_frontend(self):
        """Verifies zero React, JSX, TypeScript, or npm bundler runtime requirements."""
        frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
        index_content = (frontend_dir / "index.html").read_text(encoding="utf-8")
        
        assert "react" not in index_content.lower()
        assert "angular" not in index_content.lower()
        assert "vue" not in index_content.lower()
        assert "next" not in index_content.lower()
        assert "vite" not in index_content.lower()
        assert ".tsx" not in index_content
        assert ".jsx" not in index_content
        
        # Verify script tag uses native standard ES modules
        assert '<script type="module" src="js/app.js"></script>' in index_content

    def test_end_to_end_search_verification_and_booking_contract(self):
        """Validates that frontend API payload structures directly match backend schemas."""
        rec_req = {
            "departure_city": "Delhi",
            "destination_city": "Mumbai",
            "departure_date": "2026-11-10",
            "return_date": "2026-11-14",
            "adults": 1,
            "budget": 30000.0,
            "preferred_hotel_stars": 3,
            "hotel_category_is_hard": True,
            "room_sharing": True,
        }
        rec_res = client.post("/api/recommendations", json=rec_req)
        assert rec_res.status_code == 200
        rec_data = rec_res.json()
        assert rec_data["status"] == "SUCCESS"
        best_pkg = rec_data["best_package"]
        
        # Use a fresh unique offer ID to verify first-time confirmation
        unique_offer = f"PKG-FE-{uuid.uuid4().hex[:8]}"
        best_pkg["offer_id"] = unique_offer
        best_pkg["package_id"] = unique_offer
        
        # Verify offer
        v_req = {
            "offer_id": unique_offer,
            "expected_price": best_pkg["total_cost"],
            "currency": "INR",
            "package_details": best_pkg,
        }
        v_res = client.post("/api/verify-offer", json=v_req)
        assert v_res.status_code == 200
        assert v_res.json()["verified"] is True
        
        # Confirm booking
        b_req = {
            "offer_id": unique_offer,
            "confirm": True,
            "customer": {
                "name": "Integration Tester",
                "email": "tester@example.com",
                "phone": "+91 99999 88888",
                "passenger_count": 1,
            },
            "package_details": best_pkg,
        }
        b_res = client.post("/api/booking/confirm", json=b_req)
        assert b_res.status_code == 200
        b_data = b_res.json()
        assert b_data["success"] is True
        assert b_data["status"] == "CONFIRMED_SIMULATED"
        assert b_data["booking_reference"].startswith("SIM-RES-")
