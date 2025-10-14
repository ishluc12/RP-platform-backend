# Survey API - Quick Test Reference Card

## 🚀 Quick Start (5 Minutes)

### Step 1: Import Collection
1. Open Postman
2. Import `Survey_API_Tests.postman_collection.json`

### Step 2: Start Server
```bash
cd "e:\Final year project\RP-platform-backend"
npm start
```

### Step 3: Login
Run: **"0. Authentication" → "Login as Admin"**
- Email: `admin@example.com`
- Password: `admin123`

### Step 4: Test Basic Flow
Run these in order:
1. **Create Survey Template**
2. **Admin - Create Question**
3. **Get Survey Template Details**
4. **Submit Survey Response**
5. **Get Survey Report**

---

## 📋 Essential Endpoints

### Authentication
```
POST /api/auth/login
Body: { "email": "admin@example.com", "password": "admin123" }
```

### Create Survey (Admin)
```
POST /api/shared/surveys
Body: {
  "title": "Test Survey",
  "target_audience": "student",
  "is_active": true
}
```

### Add Question (Admin)
```
POST /api/admin/surveys/templates/{templateId}/questions
Body: {
  "question_text": "Rate this course",
  "question_type": "rating",
  "is_required": true,
  "min_value": 1,
  "max_value": 5
}
```

### Submit Response (Student)
```
POST /api/shared/surveys/{templateId}/response
Body: {
  "answers": [
    { "question_id": 1, "rating_answer": 5 }
  ]
}
```

### View Report
```
GET /api/shared/surveys/{templateId}/report
```

---

## 🎯 Question Types Quick Reference

| Type | Answer Field | Example |
|------|-------------|---------|
| `text` | `text_answer` | `"Great course!"` |
| `textarea` | `text_answer` | `"Long feedback..."` |
| `number` | `number_answer` | `85` |
| `rating` | `rating_answer` | `5` |
| `date` | `date_answer` | `"2025-01-15"` |
| `multiple_choice` | `selected_options` | `[1]` |
| `checkbox` | `selected_options` | `[1, 2, 3]` |
| `file_upload` | `files` | `[{url, name, type, size}]` |

---

## 🔑 Common Variables

Set these in Postman collection variables:
- `base_url`: `http://localhost:5000`
- `auth_token`: Auto-set after login
- `survey_template_id`: Auto-set after creating survey
- `question_id`: Auto-set after creating question

---

## ⚡ Testing Scenarios

### Scenario A: Simple Rating Survey
1. Login as Admin
2. Create survey
3. Add rating question (1-5)
4. Login as Student
5. Submit rating
6. View report

### Scenario B: Multiple Choice Survey
1. Create survey
2. Add multiple_choice question
3. Add 4 options
4. Submit response with selected option
5. View report (see option counts)

### Scenario C: Anonymous Survey
1. Create survey with `"is_anonymous": true`
2. Add questions
3. Submit responses
4. View report (no respondent IDs)

---

## 🐛 Quick Troubleshooting

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Run login request first |
| 403 Forbidden | Use admin account |
| 404 Not Found | Check survey_template_id variable |
| 409 Conflict | Survey already submitted |
| 500 Server Error | Check server logs |

---

## 📊 Expected Response Codes

- `200` - Success (GET, PUT)
- `201` - Created (POST)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict

---

## 🔄 Complete Test Flow (Copy-Paste Ready)

### 1. Create Survey
```json
{
  "title": "Course Feedback",
  "description": "Rate our course",
  "target_audience": "student",
  "is_active": true,
  "is_anonymous": false,
  "allow_multiple_submissions": false
}
```

### 2. Add Rating Question
```json
{
  "question_text": "Overall rating",
  "question_type": "rating",
  "is_required": true,
  "order_position": 1,
  "min_value": 1,
  "max_value": 5
}
```

### 3. Add Text Question
```json
{
  "question_text": "Comments",
  "question_type": "textarea",
  "is_required": false,
  "order_position": 2,
  "max_length": 500
}
```

### 4. Add Multiple Choice Question
```json
{
  "question_text": "Preferred learning method",
  "question_type": "multiple_choice",
  "is_required": true,
  "order_position": 3
}
```

### 5. Add Options (run 3 times with different text)
```json
{ "option_text": "Lectures", "order_position": 1 }
{ "option_text": "Labs", "order_position": 2 }
{ "option_text": "Projects", "order_position": 3 }
```

### 6. Submit Response
```json
{
  "answers": [
    { "question_id": 1, "rating_answer": 5 },
    { "question_id": 2, "text_answer": "Excellent course!" },
    { "question_id": 3, "selected_options": [2] }
  ]
}
```

---

## 🎨 Sample Test Data

### Admin Login
```json
{ "email": "admin@example.com", "password": "admin123" }
```

### Student Login
```json
{ "email": "student@example.com", "password": "student123" }
```

### Lecturer Login
```json
{ "email": "lecturer@example.com", "password": "lecturer123" }
```

---

## 📱 All Endpoints at a Glance

### Shared Routes (`/api/shared/surveys`)
- `POST /` - Create survey (admin)
- `GET /` - List surveys
- `GET /visible` - Get visible surveys
- `GET /:id` - Get survey details
- `GET /:id/status` - Check submission status
- `GET /:id/report` - Get report
- `PUT /:id` - Update survey
- `DELETE /:id` - Delete survey
- `POST /:id/responses` - Create draft response
- `POST /:id/response` - Submit response

### Admin Routes (`/api/admin/surveys`)
- `GET /` - List all surveys
- `GET /:id` - Get survey details
- `GET /statistics/:id` - Get statistics
- `GET /responses/:id` - Get responses
- `POST /templates/:id/questions` - Create question
- `PUT /questions/:id` - Update question
- `DELETE /questions/:id` - Delete question
- `POST /questions/:id/options` - Create option
- `PUT /options/:id` - Update option
- `DELETE /options/:id` - Delete option

---

## 💡 Pro Tips

1. **Use Collection Runner** for batch testing
2. **Enable auto-save** for variables
3. **Check Console** for debug info
4. **Use Tests tab** to validate responses
5. **Save responses** for documentation

---

## 🎯 Testing Checklist

- [ ] Server running on port 5000
- [ ] Logged in as admin
- [ ] Created survey template
- [ ] Added at least one question
- [ ] Submitted response as student
- [ ] Viewed report
- [ ] Tested error cases
- [ ] Verified data in database

---

## 📞 Need Help?

1. Check server console for errors
2. Review `SURVEY_API_TESTING_GUIDE.md` for details
3. Verify database schema
4. Check authentication token
5. Validate request body JSON

---

**Ready to test? Start with "0. Authentication" folder!** 🚀
