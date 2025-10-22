# 🤖 Chatbot Quick Reference Card

## 🚀 Start Server
```bash
cd backend
npm start
```

## 📡 API Endpoints

### **User Endpoints**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/chatbot/query` | Main chatbot query (NLP) | ✅ |
| POST | `/api/chatbot/simple-query` | Simple query (legacy) | ✅ |
| GET | `/api/chatbot/suggestions` | Get suggestions | ✅ |
| GET | `/api/chatbot/health` | Health check | ✅ |

### **Admin Endpoints**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/admin/chatbot/train` | Train model | Admin |
| POST | `/api/admin/chatbot/retrain` | Retrain from scratch | Admin |
| POST | `/api/admin/chatbot/test` | Test classification | Admin |
| GET | `/api/admin/chatbot/status` | System status | Admin |
| POST | `/api/admin/chatbot/add-training` | Add training data | Admin |

## 💬 Example Queries

### **Students**
```
"Show my appointments"
"I want to book an appointment"
"When is my lecturer available?"
"What events are happening this week?"
"Help"
```

### **Lecturers**
```
"Show appointment requests"
"Set my availability"
"Create an event"
"My schedule today"
"View pending requests"
```

### **Administrators**
```
"System dashboard"
"View all appointments"
"User management"
"System statistics"
```

## 📊 Response Format
```json
{
  "success": true,
  "message": "Response text",
  "data": { /* actual data */ },
  "intent": "detected_intent",
  "confidence": 0.95,
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "quickActions": [
    { "label": "Action", "link": "/path" }
  ],
  "navigationLink": "/path"
}
```

## 🎯 Supported Intents

| Intent | Description | Roles |
|--------|-------------|-------|
| `book_appointment` | Book new appointment | Student |
| `check_lecturer_availability` | Check availability | Student |
| `my_appointments` | View appointments | All |
| `appointment_status` | Check status | All |
| `cancel_appointment` | Cancel appointment | All |
| `reschedule_appointment` | Reschedule | All |
| `quick_book_today` | Urgent booking | Student |
| `create_event` | Create event | Staff |
| `view_events` | View events | All |
| `set_availability` | Manage availability | Staff |
| `send_message` | Access messaging | All |
| `help` | Show help | All |

## 🔧 Quick Tests

### **Test Query**
```bash
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"message": "Show my appointments"}'
```

### **Health Check**
```bash
curl http://localhost:5000/api/chatbot/health \
  -H "Authorization: Bearer TOKEN"
```

### **Test Classification (Admin)**
```bash
curl -X POST http://localhost:5000/api/admin/chatbot/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"message": "book appointment", "role": "student"}'
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/services/enhancedChatbotService.js` | Main service |
| `src/services/chatbotTrainingService.js` | NLP training |
| `src/controllers/enhancedChatbotController.js` | Main controller |
| `src/utils/chatbotInitializer.js` | Initialization |
| `src/routes/chatbot.js` | Routes |
| `src/data/training_data.json` | Training data |
| `src/data/chatbot_model.json` | Trained model |

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Server won't start | Run `npm install` |
| Chatbot not responding | Check `/api/chatbot/health` |
| Low confidence | Add more training examples |
| 401 Unauthorized | Check JWT token |
| No data returned | Verify database has data |

## 📚 Documentation

- **Full Guide:** `CHATBOT_INTEGRATION_COMPLETE.md`
- **Testing:** `TEST_CHATBOT_QUICK.md`
- **Summary:** `CHATBOT_IMPLEMENTATION_SUMMARY.md`

## ✅ Health Check Response
```json
{
  "healthy": true,
  "checks": {
    "modelTrained": true,
    "modelFileExists": true,
    "trainingDataExists": true
  },
  "message": "Chatbot system is healthy"
}
```

## 🎨 Frontend Integration
```javascript
const response = await axios.post(
  'http://localhost:5000/api/chatbot/query',
  { message: userMessage },
  { headers: { Authorization: `Bearer ${token}` } }
);

const { data } = response.data;
// Use: data.message, data.suggestions, data.quickActions
```

## 🔐 Security
- ✅ All endpoints require authentication
- ✅ Admin routes restricted to administrators
- ✅ JWT token verification
- ✅ Rate limiting applied

## 📈 Performance
- Model loads on startup (~2-3s)
- Query processing: <50ms
- Scheduled updates: Daily at midnight

## 🎯 Success Indicators
✅ Server logs show: `✅ Chatbot system ready`  
✅ Health endpoint returns: `"healthy": true`  
✅ Queries return structured responses  
✅ Model file exists: `src/data/chatbot_model.json`  

---

**Need Help?** Check the full documentation in `CHATBOT_INTEGRATION_COMPLETE.md`
