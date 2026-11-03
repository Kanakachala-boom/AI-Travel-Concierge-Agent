import pytest
from datetime import date
from app.main import app
from app.database import get_db

class TestSpecialScenariosAndFailures:
    def test_empty_search_results_unknown_city(self, client):
        """Empty search results when querying cities with no inventory."""
        payload = {
            "departure_city": "Nagpur",
            "destination_city": "Bhopal",
            "departure_date": "2026-11-10",
            "return_date": "2026-11-14",
            "adults": 1,
            "budget": 50000.0,
        }
        response = client.post("/api/recommendations", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "NO_FEASIBLE_PACKAGE"
        assert data["best_package"] is None
        exp = data["explanation"].lower()
        assert "flights were not found" in exp or "no flights" in exp or "no outbound flights" in exp or "no valid travel package" in exp

    def test_insufficient_seats_edge_case(self, client):
        """Party size larger than maximum available flight seats (e.g. 15 adults)."""
        payload = {
            "departure_city": "Delhi",
            "destination_city": "Mumbai",
            "departure_date": "2026-11-10",
            "return_date": "2026-11-14",
            "adults": 15,
            "budget": 500000.0,
        }
        response = client.post("/api/recommendations", json=payload)
        assert response.status_code == 200
        data = response.json()
        # Should either filter out flights with < 15 seats or return NO_FEASIBLE_PACKAGE
        if data["status"] == "SUCCESS":
            assert data["best_package"]["outbound_flight"]["available_seats"] >= 15
            assert data["best_package"]["return_flight"]["available_seats"] >= 15
        else:
            assert data["status"] == "NO_FEASIBLE_PACKAGE"
            assert "seat" in data["explanation"].lower() or "capacity" in data["explanation"].lower()

    def test_hotel_strict_category_mismatch(self, client):
        """Strict 5-star requirement when 5-star is outside budget returns NO_FEASIBLE_PACKAGE."""
        payload = {
            "departure_city": "Delhi",
            "destination_city": "Mumbai",
            "departure_date": "2026-11-10",
            "return_date": "2026-11-14",
            "adults": 1,
            "budget": 25000.0,
            "preferred_hotel_stars": 5,
            "hotel_category_is_hard": True,  # strict
        }
        response = client.post("/api/recommendations", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "NO_FEASIBLE_PACKAGE"
        assert data["best_package"] is None
        # Explanation must mention hotel category or budget
        exp = data["explanation"].lower()
        assert "hotel" in exp or "budget" in exp or "category" in exp
