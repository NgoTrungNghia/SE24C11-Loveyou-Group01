# Game API Contract

## Endpoints

### 1. Create Game Session
- **POST** `/api/games/create`
- **Auth**: Bearer JWT
- **Body**: `{ "gameType": "WOULD_YOU_RATHER", "partnerId": 2, "matchId": 10 }`
- **Response**: `200 OK`

### 2. Get Game Session
- **GET** `/api/games/:sessionId`
- **Auth**: Bearer JWT
- **Response**: `200 OK`

### 3. Submit Answer
- **POST** `/api/games/:sessionId/answer`
- **Auth**: Bearer JWT
- **Body**: `{ "questionIndex": 0, "answer": "optionA" }`
- **Response**: `200 OK`

### 4. Get Game Result
- **GET** `/api/games/:sessionId/result`
- **Auth**: Bearer JWT
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "result": {
        "sessionId": "game_123",
        "gameType": "WOULD_YOU_RATHER",
        "compatibilityPct": 80,
        "matches": 4,
        "total": 5,
        "summary": "🔥 Hai bạn cực kỳ hợp nhau!"
      }
    }
  }
  ```
