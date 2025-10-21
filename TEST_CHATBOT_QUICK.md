# Quick Chatbot Testing Guide

## 🚀 Start the Server

```bash
cd backend
npm start
```

**Expected Console Output:**
```
🤖 Initializing chatbot system...
Data directory verified/created
Starting comprehensive chatbot training...
Chatbot model trained successfully
✅ Chatbot system ready
🚀 P-Community Backend server running on fixed port 5000
🤖 Chatbot: http://localhost:5000/api/chatbot/query
```

---

## 🧪 Quick Tests

### **1. Health Check (No Auth Required)**
```bash
# Check if server is running
curl http://localhost:5000/health
```

### **2. Login First (Get Token)**
```bash
# Student login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "your_password"
  }'

# Save the token from response
```

### **3. Test Chatbot Query**
```bash
# Replace YOUR_TOKEN with actual token
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Show my appointments"
  }'
```

### **4. Test Different Queries**

**Appointments:**
```bash
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "I want to book an appointment"}'
```

**Availability:**
```bash
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "When is my lecturer available?"}'
```

**Events:**
```bash
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "What events are happening?"}'
```

**Help:**
```bash
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "help"}'
```

### **5. Get Suggestions**
```bash
curl http://localhost:5000/api/chatbot/suggestions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **6. Check Chatbot Health**
```bash
curl http://localhost:5000/api/chatbot/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Admin Tests (Administrator Only)

### **1. Test Intent Classification**
```bash
curl -X POST http://localhost:5000/api/admin/chatbot/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "message": "I want to book an appointment with my lecturer",
    "role": "student"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test completed",
  "data": {
    "message": "I want to book an appointment with my lecturer",
    "role": "student",
    "classification": {
      "success": true,
      "intent": "book_appointment",
      "confidence": 0.95,
      "message": "I'll help you book an appointment...",
      "link": "/appointments/new"
    }
  }
}
```

### **2. Check System Status**
```bash
curl http://localhost:5000/api/admin/chatbot/status \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### **3. Retrain Model**
```bash
curl -X POST http://localhost:5000/api/admin/chatbot/retrain \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 📱 Frontend Integration Example

### **React Component**
```javascript
import { useState } from 'react';
import axios from 'axios';

function Chatbot() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/chatbot/query',
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResponse(res.data.data);
    } catch (error) {
      console.error('Chatbot error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask me anything..."
      />
      <button onClick={sendMessage} disabled={loading}>
        {loading ? 'Thinking...' : 'Send'}
      </button>
      
      {response && (
        <div>
          <p>{response.message}</p>
          {response.quickActions?.map((action, i) => (
            <button key={i} onClick={() => window.location.href = action.link}>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Expected Response Format

```json
{
  "success": true,
  "message": "Query processed successfully",
  "data": {
    "success": true,
    "message": "You have 3 appointment(s):\n\n📋 Pending: 1\n✅ Accepted: 2",
    "data": {
      "total": 3,
      "grouped": {
        "pending": [...],
        "accepted": [...],
        "declined": [],
        "cancelled": [],
        "completed": []
      },
      "appointments": [...]
    },
    "intent": "my_appointments",
    "confidence": 0.98,
    "navigationLink": "/appointments",
    "suggestions": [
      "View All",
      "Book New"
    ],
    "quickActions": [
      {
        "label": "View All",
        "link": "/appointments"
      },
      {
        "label": "Book New",
        "link": "/appointments/new"
      }
    ],
    "interactive": true
  }
}
```

---

## ✅ Verification Checklist

- [ ] Server starts without errors
- [ ] Chatbot initialization message appears
- [ ] Model file created: `src/data/chatbot_model.json`
- [ ] Training data exists: `src/data/training_data.json`
- [ ] Health endpoint returns healthy status
- [ ] Query endpoint responds with proper format
- [ ] Suggestions endpoint returns role-based suggestions
- [ ] Admin endpoints work (if admin token available)
- [ ] Intent classification works correctly
- [ ] Database queries return real data

---

## 🐛 Common Issues

### **Issue: "Model not trained"**
**Solution:** Restart the server. It will auto-train on startup.

### **Issue: "401 Unauthorized"**
**Solution:** Make sure you're sending a valid JWT token in the Authorization header.

### **Issue: "Cannot find module 'natural'"**
**Solution:** Run `npm install` again to ensure all dependencies are installed.

### **Issue: "Low confidence scores"**
**Solution:** The model needs more training data. Use admin endpoints to add more examples.

### **Issue: "No data returned"**
**Solution:** Make sure you have appointments/events in your database.

---

## 📊 Testing Different Roles

### **Student Queries:**
- "Show my appointments"
- "Book an appointment"
- "When is Dr. Smith available?"
- "What events are happening?"
- "Cancel my appointment"

### **Lecturer Queries:**
- "Show appointment requests"
- "Set my availability"
- "Create an event"
- "My schedule today"
- "View pending requests"

### **Administrator Queries:**
- "System dashboard"
- "View all appointments"
- "User management"
- "System statistics"
- "Create campus event"

---

## 🎉 Success Indicators

✅ **Server logs show:**
```
🤖 Initializing chatbot system...
✅ Chatbot system ready
```

✅ **Health check returns:**
```json
{
  "healthy": true,
  "checks": {
    "modelTrained": true,
    "modelFileExists": true,
    "trainingDataExists": true
  }
}
```

✅ **Queries return structured responses with:**
- `message` - Human-readable response
- `data` - Actual data from database
- `suggestions` - Contextual suggestions
- `quickActions` - Interactive buttons
- `intent` - Detected intent
- `confidence` - Classification confidence

---

## 🚀 You're All Set!

Your chatbot is now fully operational and integrated with your application. Test it with various queries and see how it intelligently responds based on user roles and intents!
