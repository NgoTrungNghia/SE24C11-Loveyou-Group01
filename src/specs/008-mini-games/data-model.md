# Data Model: 008 Mini-Games

```javascript
// In-Memory Game Session Structure (gameService.js)

{
  sessionId: "game_1723456789_abc123",
  gameType: "WOULD_YOU_RATHER" | "SPIN_THE_BOTTLE" | "GUESS_INTERESTS",
  initiatorId: 1,
  partnerId: 2,
  matchId: 10,
  status: "PENDING" | "ACTIVE" | "COMPLETED",
  gameData: {
    questions: [
      { id: 1, optionA: "☕ Cà phê", optionB: "🍵 Trà" },
      // ...5 random questions
    ],
    answers: {
      0: { 1: "optionA", 2: "optionA" }, // Question index -> { userId: answer }
      1: { 1: "optionB" }
    },
    currentQuestionIndex: 0
  },
  createdAt: "2026-08-12T10:00:00Z",
  completedAt: "2026-08-12T10:05:00Z"
}
```
