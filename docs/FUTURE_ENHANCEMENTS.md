# Future Enhancements & Roadmap

## Overview
While the **Automated E-Commerce Concierge Agent** fulfills its architectural objectives as a complete, deterministic, and secure travel planning system, this roadmap outlines proposed extensions for enterprise commercialization.

---

## 1. Live GDS & Multi-Supplier Integrations
- **Amadeus Enterprise API**: Transition from the test sandbox to production Amadeus Enterprise APIs for live flight ticketing.
- **Sabre & Travelport**: Introduce additional Global Distribution System (GDS) adapters to enable cross-GDS airfare arbitrage.
- **Hotel Channel Managers**: Connect to Booking.com, Expedia Partner Solutions, or HotelBeds for real-time room inventories.

---

## 2. Monetary Settlement & Payment Gateways
- **Payment Gateway Integration**: Integrate Stripe, Razorpay, or PayPal to handle real fiat currency and UPI transactions.
- **Two-Phase Escrow Settlement**: Hold funds in escrow during provider ticketing and release them upon confirmed PNR generation.
- **Dynamic Refund & Cancellation**: Automated policy calculation and refund processing according to airline fare conditions.

---

## 3. Advanced Traveler Security & Session Management
- **Refresh Token Rotation**: Pair access tokens with long-lived, HttpOnly refresh tokens stored in Redis for granular session revocation.
- **Two-Factor Authentication (2FA)**: Introduce TOTP (Google Authenticator) or SMS/Email OTP during login and booking confirmation.
- **Password Reset & Recovery**: Time-limited cryptographic reset tokens delivered via automated transactional email (SendGrid/Amazon SES).

---

## 4. Enhanced Recommendation & Personalization
- **Collaborative Filtering**: Incorporate past booking history to subtly bias soft scores toward preferred hotel chains or frequent flyer programs.
- **Dynamic Packaging Discounts**: Model airline and hotel consortium discounts when booked jointly as a bundled package.
- **Multi-City Itinerary Optimization**: Expand beyond round-trip routes to support multi-leg journeys (e.g., Delhi $\to$ Mumbai $\to$ Goa $\to$ Delhi).

---

## 5. Deployment, Containerization & DevOps
- **Docker & Docker Compose**: Containerize the FastAPI backend and frontend server for single-command deployment.
- **CI/CD Automation**: GitHub Actions workflow running pytest and headless Chrome tests on every pull request.
- **Cloud Infrastructure**: Terraform templates for automated provisioning on AWS (ECS/Fargate) or Google Cloud Platform (Cloud Run).
