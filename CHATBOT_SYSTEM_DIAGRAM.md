# 🤖 Chatbot System Architecture Diagram

## Complete System Flow

```
USER QUERY → AUTHENTICATION → CONTROLLER → SERVICE → NLP/AI → DATABASE → RESPONSE
```

## Detailed Architecture

### Layer 1: User Interface
```
┌─────────────────────────────────────────┐
│  Student/Lecturer/Admin Frontend        │
│  ↓                                      │
│  DraggableChatbot Component             │
│  ↓                                      │
│  POST /api/chatbot/query                │
└─────────────────────────────────────────┘
```

### Layer 2: API Gateway
```
┌─────────────────────────────────────────┐
│  Authentication Middleware (JWT)         │
│  • Verify Token                         │
│  • Extract User Info                    │
│  • Check Role                           │
└─────────────────────────────────────────┘
```

### Layer 3: Controller
```
┌─────────────────────────────────────────┐
│  EnhancedChatbotController              │
│  • Validate Input                       │
│  • Log Query                            │
│  • Call Service                         │
│  • Format Response                      │
└─────────────────────────────────────────┘
```

### Layer 4: Service (Dual Path)
```
┌────────────────────┐    ┌────────────────────┐
│ Training Service   │    │ Chatbot Service    │
│ (NLP)              │    │ (Conversational)   │
│ • Classify Intent  │    │ • Keyword Match    │
│ • Confidence Score │    │ • Simple Response  │
└────────────────────┘    └────────────────────┘
         │                         │
         └──────────┬──────────────┘
                    ▼
         EnhancedChatbotService
         • Execute Action
         • Query Database
```

### Layer 5: Database
```
┌─────────────────────────────────────────┐
│  PostgreSQL Database                     │
│  • Appointments                         │
│  • Events                               │
│  • Users                                │
│  • Staff Availability                   │
└─────────────────────────────────────────┘
```

## Intent Classification Example

**Query:** "I want to book an appointment"

```
1. Tokenize → ["want", "book", "appointment"]
2. Stem → ["want", "book", "appoint"]
3. Classify → Intent: "book_appointment", Confidence: 0.95
4. Get Role Response → Student: "I'll help you book..."
5. Execute Action → show_available_staff
6. Query DB → Get staff availability
7. Format Response → Message + Data + Actions
8. Return to User
```

## File Structure

```
backend/
├── server.js (Initializes chatbot)
├── src/
│   ├── controllers/
│   │   └── enhancedChatbotController.js
│   ├── services/
│   │   ├── enhancedChatbotService.js
│   │   ├── chatbotTrainingService.js
│   │   └── chatbotService.js
│   ├── routes/
│   │   ├── chatbot.js
│   │   └── admin/chatbotTraining.js
│   ├── utils/
│   │   └── chatbotInitializer.js
│   └── data/
│       ├── training_data.json
│       └── chatbot_model.json
```

## Performance

- **Startup:** ~2-3 seconds
- **Query Processing:** <50ms
- **Classification:** <10ms
- **Database Query:** 10-30ms

## Security

✅ JWT Authentication  
✅ Role-Based Access  
✅ Input Validation  
✅ Rate Limiting  
✅ Error Handling  

---

**For complete details, see `CHATBOT_README.md`**
