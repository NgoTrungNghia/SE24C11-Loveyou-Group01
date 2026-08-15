# Research & Decisions: 007 AI Matching & Preferences

## Rule-Based Scoring vs LLM/Embeddings API
- **Decision**: Multi-criteria weighted rule-based scoring (Interests: 40%, Distance: 25%, Age: 20%, Recency: 15%).
- **Rationale**: Operates deterministically with 0ms external latency, zero API token costs, and 100% privacy without depending on third-party AI keys (OpenAI/Gemini).

## Distance Calculation Formula
- **Decision**: Haversine Spherical Distance Formula.
  \[ d = 2R \arcsin \left( \sqrt{ \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right) } \right) \]
- **Rationale**: Accurate calculation of Great Circle distance in kilometers between two GPS coordinates on Earth.
