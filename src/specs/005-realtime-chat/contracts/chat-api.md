# Chat API Contract

## Endpoints

### 1. Get All Conversations
- **GET** `/api/chat/conversations`
- **Auth**: Bearer JWT
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "conversations": [
        {
          "id": 1,
          "matchId": 12,
          "partner": { "id": 5, "name": "Bảo Ngọc", "photo": "..." },
          "lastMessage": { "content": "Chào bạn!", "createdAt": "..." }
        }
      ]
    }
  }
  ```

### 2. Get or Init Conversation for Match
- **GET** `/api/chat/conversations/:matchId/init`
- **Auth**: Bearer JWT
- **Response**: `200 OK`

### 3. Get Messages in Conversation
- **GET** `/api/chat/:conversationId/messages?page=1`
- **Auth**: Bearer JWT
- **Response**: `200 OK`

### 4. Send Message (HTTP Fallback)
- **POST** `/api/chat/:conversationId/messages`
- **Body**: `{ "content": "Hello", "type": "TEXT" }`
- **Response**: `200 OK`

### 5. Mark Messages Read
- **PUT** `/api/chat/:conversationId/read`
- **Response**: `200 OK`
