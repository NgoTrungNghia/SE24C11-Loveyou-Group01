# AI Matching API Contract

## Endpoints

### 1. Get AI Sorted Candidates
- **GET** `/api/ai/ai-candidates`
- **Auth**: Bearer JWT
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "candidates": [
        {
          "id": 2,
          "name": "Mai Phương",
          "age": 22,
          "aiScore": 92,
          "distanceKm": 3,
          "location": "TP. Hồ Chí Minh • 3 km",
          "tags": ["🎵 Music", "☕ Coffee"]
        }
      ]
    }
  }
  ```

### 2. Get Search Preferences
- **GET** `/api/ai/preferences`
- **Auth**: Bearer JWT
- **Response**: `200 OK`

### 3. Update Search Preferences
- **PUT** `/api/ai/preferences`
- **Auth**: Bearer JWT
- **Body**: `{ "genderPreference": "FEMALE", "minAge": 20, "maxAge": 30, "maxDistance": 25 }`
- **Response**: `200 OK`
