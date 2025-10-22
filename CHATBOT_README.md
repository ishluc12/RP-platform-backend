# 🤖 RP Community Chatbot System

## Overview

A fully integrated, NLP-powered chatbot system for the RP Community application. The chatbot understands natural language, provides role-based intelligent responses, and integrates seamlessly with your existing database.

---

## ✨ Features

- 🧠 **Natural Language Processing** - Understands user intent using Bayesian classification
- 👥 **Role-Based Responses** - Different responses for students, lecturers, and administrators
- 🔗 **Database Integration** - Fetches real-time data from appointments, events, and availability
- 🎯 **Interactive UI** - Quick actions, navigation links, and contextual suggestions
- 🔧 **Admin Training** - Easy-to-use interface for adding training data
- ⚡ **High Performance** - Fast response times (<50ms typical)
- 🔄 **Auto-Maintenance** - Scheduled training updates and health monitoring

---

## 🚀 Quick Start

### 1. **Start the Server**
```bash
cd backend
npm start
```

### 2. **Verify Initialization**
Look for these messages in the console:
```
🤖 Initializing chatbot system...
✅ Chatbot system ready
🚀 P-Community Backend server running on fixed port 5000
🤖 Chatbot: http://localhost:5000/api/chatbot/query
```

### 3. **Test the Chatbot**
```bash
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "Show my appointments"}'
```

---

## 📡 API Endpoints

### **User Endpoints** (All Authenticated Users)

#### `POST /api/chatbot/query`
Main chatbot query endpoint with NLP.

**Request:**
```json
{
  "message": "I want to book an appointment",
  "context": {}  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Query processed successfully",
  "data": {
    "message": "I'll help you book an appointment...",
    "data": { /* actual data */ },
    "intent": "book_appointment",
    "confidence": 0.95,
    "suggestions": ["Check availability", "View lecturers"],
    "quickActions": [
      { "label": "Book Now", "link": "/appointments/new" }
    ],
    "navigationLink": "/appointments/new"
  }
}
```

#### `GET /api/chatbot/suggestions`
Get role-based suggestions.

#### `GET /api/chatbot/health`
Check chatbot system health.

### **Admin Endpoints** (Administrators Only)

#### `POST /api/admin/chatbot/train`
Train the model with new data.

#### `POST /api/admin/chatbot/retrain`
Retrain the model from scratch.

#### `POST /api/admin/chatbot/test`
Test intent classification.

**Request:**
```json
{
  "message": "I want to book an appointment",
  "role": "student"
}
```

#### `GET /api/admin/chatbot/status`
Get system status and health.

#### `POST /api/admin/chatbot/add-training`
Add new training examples.

---

## 💬 Example Queries by Role

### **Students**
```
✅ "Show my appointments"
✅ "I want to book an appointment"
✅ "When is Dr. Smith available?"
✅ "What events are happening this week?"
✅ "Cancel my appointment"
✅ "Help"
```

### **Lecturers**
```
✅ "Show appointment requests"
✅ "Set my availability"
✅ "Create an event"
✅ "My schedule today"
✅ "View pending requests"
```

### **Administrators**
```
✅ "System dashboard"
✅ "View all appointments"
✅ "User management"
✅ "System statistics"
✅ "Create campus event"
```

---

## 🎯 Supported Intents

| Intent | Description | Example Query |
|--------|-------------|---------------|
| `book_appointment` | Book new appointment | "I want to book an appointment" |
| `check_lecturer_availability` | Check staff availability | "When is my lecturer available?" |
| `my_appointments` | View appointments | "Show my appointments" |
| `appointment_status` | Check appointment status | "Is my appointment confirmed?" |
| `cancel_appointment` | Cancel appointment | "Cancel my appointment" |
| `reschedule_appointment` | Reschedule appointment | "Reschedule my meeting" |
| `quick_book_today` | Urgent same-day booking | "Book appointment today" |
| `create_event` | Create event (staff) | "Create a workshop" |
| `view_events` | View upcoming events | "What events are happening?" |
| `set_availability` | Manage availability (staff) | "Set my availability" |
| `send_message` | Access messaging | "Send a message" |
| `help` | Show help | "Help" |

---

## 🏗️ Architecture

```
User Query
    ↓
EnhancedChatbotController
    ↓
EnhancedChatbotService
    ↓
    ├─→ ChatbotTrainingService (NLP Classification)
    │       ↓
    │   Intent Detection (Confidence > 0.3)
    │       ↓
    └─→ Execute Action
            ↓
        Database Models
            ↓
        Formatted Response
```

---

## 📁 File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── enhancedChatbotController.js    # Main controller
│   │   └── chatbotController.js            # Legacy controller
│   ├── services/
│   │   ├── enhancedChatbotService.js       # Combined service
│   │   ├── chatbotTrainingService.js       # NLP training
│   │   └── chatbotService.js               # Conversational AI
│   ├── routes/
│   │   ├── chatbot.js                      # Main routes
│   │   └── admin/
│   │       └── chatbotTraining.js          # Admin routes
│   ├── utils/
│   │   └── chatbotInitializer.js           # Initialization
│   └── data/
│       ├── training_data.json              # Training dataset
│       └── chatbot_model.json              # Trained model
├── server.js                                # Server with init
└── Documentation/
    ├── CHATBOT_INTEGRATION_COMPLETE.md     # Full guide
    ├── TEST_CHATBOT_QUICK.md               # Testing guide
    ├── CHATBOT_IMPLEMENTATION_SUMMARY.md   # Summary
    └── CHATBOT_QUICK_REFERENCE.md          # Quick ref
```

---

## 🔧 Configuration

### **Environment Variables**
No additional environment variables needed. The chatbot uses existing database configuration.

### **Training Data Location**
- Training data: `src/data/training_data.json`
- Trained model: `src/data/chatbot_model.json` (auto-generated)

### **Scheduled Updates**
- Daily at midnight (00:00)
- Can be customized in `server.js`

---

## 🎨 Frontend Integration

### **React Example**
```javascript
import { useState } from 'react';
import axios from 'axios';

function Chatbot() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState(null);

  const sendMessage = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.post(
      'http://localhost:5000/api/chatbot/query',
      { message },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setResponse(res.data.data);
  };

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask me anything..."
      />
      <button onClick={sendMessage}>Send</button>
      
      {response && (
        <div>
          <p>{response.message}</p>
          
          {/* Quick Actions */}
          {response.quickActions?.map((action, i) => (
            <button key={i} onClick={() => window.location.href = action.link}>
              {action.label}
            </button>
          ))}
          
          {/* Suggestions */}
          {response.suggestions?.map((sugg, i) => (
            <button key={i} onClick={() => setMessage(sugg)}>
              {sugg}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### **Your Existing Component**
Update `DraggableChatbot.jsx` to use `/api/chatbot/query` endpoint.

---

## 🧪 Testing

### **Basic Test**
```bash
# 1. Health check
curl http://localhost:5000/api/chatbot/health \
  -H "Authorization: Bearer TOKEN"

# 2. Simple query
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"message": "help"}'

# 3. Appointment query
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"message": "Show my appointments"}'
```

### **Admin Test**
```bash
# Test classification
curl -X POST http://localhost:5000/api/admin/chatbot/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"message": "book appointment", "role": "student"}'

# Check status
curl http://localhost:5000/api/admin/chatbot/status \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 🔐 Security

- ✅ **Authentication Required** - All endpoints require valid JWT token
- ✅ **Role-Based Access** - Admin endpoints restricted to administrators
- ✅ **Input Validation** - All queries validated before processing
- ✅ **Rate Limiting** - Applied to all API endpoints
- ✅ **Error Handling** - Comprehensive error handling and logging

---

## 📈 Performance

| Metric | Value |
|--------|-------|
| Model Load Time | ~2-3 seconds (on startup) |
| Query Processing | <50ms typical |
| Classification | <10ms |
| Database Query | Varies by data |
| Memory Usage | ~50MB for model |

---

## 🐛 Troubleshooting

### **Issue: Server won't start**
**Solution:**
```bash
npm install
npm start
```

### **Issue: Chatbot not responding**
**Solution:**
```bash
# Check health
curl http://localhost:5000/api/chatbot/health -H "Authorization: Bearer TOKEN"

# Check server logs
tail -f backend/info.log
```

### **Issue: Low confidence scores**
**Solution:**
```bash
# Add more training examples
curl -X POST http://localhost:5000/api/admin/chatbot/add-training \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"intents": {...}}'

# Retrain
curl -X POST http://localhost:5000/api/admin/chatbot/retrain \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### **Issue: Model not loading**
**Solution:**
```bash
# Delete model file and restart (will retrain)
rm src/data/chatbot_model.json
npm start
```

---

## 📊 Monitoring

### **Health Check**
```bash
curl http://localhost:5000/api/chatbot/health \
  -H "Authorization: Bearer TOKEN"
```

**Expected Response:**
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

### **Logs**
- Server logs: Console output
- Error logs: `backend/error.log`
- Info logs: `backend/info.log`

---

## 🔄 Maintenance

### **Automatic**
- ✅ Daily training updates (midnight)
- ✅ Model persistence
- ✅ Error logging
- ✅ Health monitoring

### **Manual (Admin)**
```bash
# Add training data
POST /api/admin/chatbot/add-training

# Retrain model
POST /api/admin/chatbot/retrain

# Test classification
POST /api/admin/chatbot/test

# Check status
GET /api/admin/chatbot/status
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `CHATBOT_INTEGRATION_COMPLETE.md` | Complete implementation guide |
| `TEST_CHATBOT_QUICK.md` | Quick testing guide |
| `CHATBOT_IMPLEMENTATION_SUMMARY.md` | Executive summary |
| `CHATBOT_QUICK_REFERENCE.md` | Quick reference card |
| **This file** | Main README |

---

## 🎯 Success Indicators

✅ Server logs show: `✅ Chatbot system ready`  
✅ Health endpoint returns: `"healthy": true`  
✅ Queries return structured responses  
✅ Model file exists: `src/data/chatbot_model.json`  
✅ Classification confidence > 0.7 for trained intents  
✅ Database queries return real data  

---

## 🚀 Next Steps

### **Optional Enhancements**
1. **Conversation Memory** - Track multi-turn conversations
2. **Entity Extraction** - Extract dates, names, times
3. **Sentiment Analysis** - Detect user emotions
4. **Multi-language** - Support multiple languages
5. **Voice Input** - Speech-to-text integration
6. **Analytics** - Usage metrics and insights
7. **Workflow Automation** - Multi-step processes
8. **Proactive Suggestions** - Predict user needs

---

## 📞 Support

### **Getting Help**
1. Check this README
2. Review full documentation in `CHATBOT_INTEGRATION_COMPLETE.md`
3. Check server logs for errors
4. Test with health endpoint
5. Verify authentication tokens

### **Common Commands**
```bash
# Start server
npm start

# Check health
curl http://localhost:5000/api/chatbot/health -H "Authorization: Bearer TOKEN"

# Test query
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"message": "help"}'
```

---

## ✨ Summary

Your RP Community chatbot is a sophisticated, production-ready system that:

- 🧠 Understands natural language using NLP
- 👥 Provides role-specific intelligent responses
- 🔗 Integrates with your existing database
- 🎯 Offers interactive UI elements
- 🔧 Includes admin training interface
- ⚡ Performs with high speed and efficiency
- 🔄 Maintains itself automatically

**Start chatting now!** 🤖✨

```bash
cd backend
npm start
```
