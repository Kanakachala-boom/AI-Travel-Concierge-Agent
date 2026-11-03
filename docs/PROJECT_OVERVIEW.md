# Project Overview: Automated E-Commerce Concierge Agent

## Executive Summary
The **Automated E-Commerce Concierge Agent – AI Travel Planning Assistant** is an intelligent full-stack software system designed to automate end-to-end travel itinerary planning, constraint-satisfaction optimization, and booking simulation. 

Unlike traditional metasearch engines that rely on static database filters or black-box machine learning models, this system implements a formal **Goal-Based Intelligent Agent** (Russell & Norvig, *Artificial Intelligence: A Modern Approach*). It deterministically evaluates candidate combinations of flights and hotel accommodations, enforces domain constraints, calculates transparent pricing, and generates explainable recommendations.

## Background & Motivation
Modern travel planning is inherently combinatorial:
- For any round trip, travelers must balance outbound departure times, arrival times, layover durations, airline reliability, seat availability, and price.
- Simultaneously, return flights must be scheduled with proper temporal ordering.
- Hotel accommodations must align with the destination city, stay dates, guest occupancy rules, star categories, and required amenities.
- Combining $N$ outbound flights, $M$ return flights, and $H$ hotels generates $N \times M \times H$ permutations.

Manually exploring this search space across disjoint browser tabs results in fatigue, suboptimal choices, and budget overruns. The Automated E-Commerce Concierge Agent addresses this by treating travel planning as an automated constraint satisfaction and optimization task.

## Core Capabilities
1. **Goal-Based Intelligent Planning**: Translates high-level user parameters into concrete operational goals.
2. **Hard Constraint Satisfaction**: Automatically eliminates candidate itineraries that violate budget limits, route continuity, chronological order, seat availability, or room capacity.
3. **Soft Preference Optimization**: Balances secondary user preferences (preferred airline, non-stop flights, hotel amenities) through multi-criteria ranking.
4. **Transparent Explainability**: Details exact itemized costs in Indian Rupees (₹) and provides diagnostics when searches are infeasible.
5. **Two-Phase Inventory Re-Verification**: Simulates real-time pricing and availability checks (`/api/verify-offer`) prior to checkout.
6. **Simulated Booking Lifecycle**: Issues unique reservation identifiers (`SIM-RES-XXXXXXXX`) while preventing duplicate bookings.
7. **Stateless JWT Authentication**: Implements secure user registration, bcrypt password hashing, and token-based API access.
8. **Multi-Tenant Data Isolation**: Strictly restricts recommendations and booking history to the authenticated account.
9. **Zero-Framework Frontend**: Fast, accessible, and responsive user interface implemented entirely in vanilla HTML5, CSS3, and modern ES6 JavaScript.
