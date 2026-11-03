# AI Decision-Making and Optimization

## Formal Paradigm: Classical Constraint Optimization
The AI decision engine implements a **Constraint Satisfaction Problem (CSP)** coupled with a multi-criteria objective function.

### Mathematical Formulation
Let:
- $\mathcal{F}_{\text{out}}$ be the set of valid outbound flights from origin $O$ to destination $D$ on date $T_1$.
- $\mathcal{F}_{\text{ret}}$ be the set of valid return flights from destination $D$ to origin $O$ on date $T_2$.
- $\mathcal{H}$ be the set of hotels in destination $D$.
- $A \in \mathbb{N}_{\ge 1}$ be the number of adult passengers.
- $B \in \mathbb{R}_{> 0}$ be the total financial budget ceiling.
- $N = T_2 - T_1$ be the number of lodging nights.
- $C_{\text{room}} \in \{1, 2\}$ be the room sharing capacity limit.

The candidate space is:
$$\Omega = \mathcal{F}_{\text{out}} \times \mathcal{F}_{\text{ret}} \times \mathcal{H}$$

A candidate tuple $p = (f_{\text{out}}, f_{\text{ret}}, h) \in \Omega$ is **feasible** if and only if:
1. $\text{seats}(f_{\text{out}}) \ge A$
2. $\text{seats}(f_{\text{ret}}) \ge A$
3. $\text{rooms}(h) \ge R \quad \text{where } R = \lceil A / C_{\text{room}} \rceil$
4. $\text{TotalCost}(p) \le B$
5. If $\text{HardCategory}$, $\text{stars}(h) \ge S_{\text{req}}$
6. If $\text{HardStops}$, $\max(\text{stops}(f_{\text{out}}), \text{stops}(f_{\text{ret}})) \le K_{\text{max}}$

### Objective Function & Deterministic Tie-Breaking
Among all feasible candidates $p \in \Omega_{\text{feasible}}$, the agent selects the optimal package $p^*$ using a lexicographical vector:

$$\vec{V}(p) = \begin{bmatrix}
\text{TotalCost}(p) \\
\text{stops}(f_{\text{out}}) + \text{stops}(f_{\text{ret}}) \\
\text{duration}(f_{\text{out}}) + \text{duration}(f_{\text{ret}}) \\
\text{Penalty}_{\text{time}}(f_{\text{out}}, f_{\text{ret}}) \\
-\text{stars}(h) \\
\text{Hash}(p.\text{package\_id})
\end{bmatrix}$$

$$p^* = \arg\min_{p \in \Omega_{\text{feasible}}} \vec{V}(p)$$

Because every component of $\vec{V}(p)$ is deterministic and well-ordered, the agent exhibits **reproducible behavior**: identical inputs on identical inventory states will always produce the identical recommendation.

## Infeasible State Diagnosis
When $\Omega_{\text{feasible}} = \emptyset$, conventional search systems fail with generic *"No results found"* messages. This agent tracks rejection reasons:
```python
rejections = {
    "budget_exceeded": 0,
    "insufficient_seats": 0,
    "insufficient_rooms": 0,
    "hotel_star_mismatch": 0,
    "flight_stops_exceeded": 0
}
```
If all combinations failed due to budget, the agent computes the delta:
$$\Delta_{\text{budget}} = \min_{p \in \Omega} \text{TotalCost}(p) - B$$
and returns an actionable suggestion:
> *"The lowest-priced available package is ₹46,500. Increase your budget by ₹6,500 or adjust your hotel star preference from 4 stars to 3 stars."*
