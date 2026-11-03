# Database Design: Schema & Relationships

## Database Architecture
The application uses SQLAlchemy 2.0 ORM with SQLite for local execution and PostgreSQL support for production deployments.

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : "places (user_id)"
    USERS ||--o{ RECOMMENDATION_HISTORY : "searches (user_id)"

    USERS {
        int id PK "Autoincrement Primary Key"
        string full_name "Traveler Full Name"
        string email UK "Unique Email Address"
        string password_hash "12-round bcrypt hash"
        boolean is_active "Account status flag"
        datetime created_at "Registration timestamp"
    }

    BOOKINGS {
        string id PK "UUID string"
        string booking_reference UK "e.g. SIM-RES-XXXXXXXX"
        int user_id FK "References users.id"
        string offer_id "Package offer identifier"
        string customer_name "Traveler Name"
        string customer_email "Contact Email"
        string customer_phone "Optional Contact Phone"
        int passenger_count "Number of travelers"
        string status "CONFIRMED_SIMULATED, DUPLICATE_BOOKING, etc."
        float total_charged "Total cost in INR"
        string currency "Currency code (INR)"
        string data_source "SIMULATED or AMADEUS"
        string handoff_url "Optional external booking URL"
        string disclaimer "Academic simulation notice"
        datetime created_at "Booking timestamp"
    }

    RECOMMENDATION_HISTORY {
        string id PK "UUID string"
        int user_id FK "References users.id"
        string departure_city "Origin city"
        string destination_city "Destination city"
        string departure_date "YYYY-MM-DD"
        string return_date "YYYY-MM-DD"
        int adults "Passenger count"
        float budget "Budget ceiling in INR"
        int preferred_hotel_stars "Minimum star rating"
        json request_payload "Complete search input JSON"
        json response_data "Complete agent output JSON"
        datetime created_at "Search execution timestamp"
    }

    FLIGHTS {
        int id PK "Autoincrement Primary Key"
        string flight_number "e.g. 6E-101"
        string airline "IndiGo, Air India, SpiceJet, Vistara"
        string origin_city "Departure city"
        string origin_code "IATA Airport code (DEL, BOM, etc.)"
        string destination_city "Arrival city"
        string destination_code "IATA Airport code"
        string departure_time "HH:MM"
        string arrival_time "HH:MM"
        int duration_minutes "Total flight duration"
        int stops "0 for direct, 1 for connecting"
        float price_per_adult "Fare per passenger in INR"
        int available_seats "Available seat count"
    }

    HOTELS {
        int id PK "Autoincrement Primary Key"
        string name "Hotel Property Name"
        string city "City location"
        int stars "Rating 3, 4, or 5 stars"
        float price_per_night "Nightly room rate in INR"
        int available_rooms "Inventory room count"
        int max_guests_per_room "Occupancy limit (typically 2)"
        json amenities "Array of strings [WiFi, Pool, Breakfast, Gym]"
    }
```

## Migration & Schema Synchronization
In `backend/app/database.py`, the `init_db()` function includes automated schema inspection via SQLAlchemy's `inspect(engine)`. If existing database files lack the `user_id` foreign key columns on `bookings` or `recommendation_history`, it automatically runs:
```sql
ALTER TABLE bookings ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE recommendation_history ADD COLUMN user_id INTEGER REFERENCES users(id);
```
This guarantees seamless backward compatibility without requiring manual migration scripts.
