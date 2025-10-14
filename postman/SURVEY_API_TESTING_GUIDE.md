# Survey API Testing Guide

## Overview
This guide will help you test all Survey-related API endpoints using Postman.

## Prerequisites
1. **Backend Server Running**: Ensure your backend server is running on `http://localhost:5000`
2. **Postman Installed**: Download from [postman.com](https://www.postman.com/downloads/)
3. **Database Setup**: Ensure your database has the survey tables and sample data

## Setup Instructions

### 1. Import the Collection
1. Open Postman
2. Click **Import** button (top left)
3. Select the file: `Survey_API_Tests.postman_collection.json`
4. The collection will appear in your Collections sidebar

### 2. Configure Variables
The collection uses variables that are automatically set during testing:
- `base_url`: http://localhost:5000 (default)
- `auth_token`: Auto-populated after login
- `survey_template_id`: Auto-populated after creating a survey
- `question_id`: Auto-populated after creating a question
- `option_id`: Auto-populated after creating an option
- `response_id`: Auto-populated after creating a response

To manually edit variables:
1. Click on the collection name
2. Go to **Variables** tab
3. Update the **Current Value** column

## API Endpoints Summary

### Base URLs
- **Shared Routes**: `http://localhost:5000/api/shared/surveys`
- **Admin Routes**: `http://localhost:5000/api/admin/surveys`

### Authentication
All endpoints require authentication via Bearer token.

---

## Testing Workflow

### Phase 1: Authentication
**Start here to get your auth token!**

#### 1.1 Login as Admin
```
POST /api/auth/login
Body: {
  "email": "admin@example.com",
  "password": "admin123"
}
```
✅ **Success**: Token automatically saved to collection variables

#### 1.2 Login as Student (Optional)
```
POST /api/auth/login
Body: {
  "email": "student@example.com",
  "password": "student123"
}
```

---

### Phase 2: Survey Template Management

#### 2.1 Create Survey Template (Admin Only)
```
POST /api/shared/surveys
Headers: Authorization: Bearer {{auth_token}}
Body: {
  "title": "Student Satisfaction Survey 2025",
  "description": "Annual survey to gather student feedback",
  "target_audience": "student",
  "is_active": true,
  "is_anonymous": false,
  "allow_multiple_submissions": false,
  "start_date": "2025-01-01",
  "end_date": "2025-12-31"
}
```
✅ **Success**: Survey template ID automatically saved

**Field Descriptions:**
- `title` (required): Survey name
- `description`: Detailed description
- `target_audience`: "all", "student", "lecturer", "staff", "admin"
- `is_active`: Whether survey is currently active
- `is_anonymous`: Hide respondent identity
- `allow_multiple_submissions`: Allow users to submit multiple times
- `start_date`, `end_date`: Survey availability period

#### 2.2 List All Survey Templates
```
GET /api/shared/surveys
```
- **Admin**: Sees all surveys
- **Other Users**: See role-specific surveys

#### 2.3 Get Visible Templates for Current User
```
GET /api/shared/surveys/visible
```
Returns only surveys visible to the authenticated user's role.

#### 2.4 Get Survey Template Details
```
GET /api/shared/surveys/{{survey_template_id}}
```
Returns complete survey with questions and options.

#### 2.5 Update Survey Template
```
PUT /api/shared/surveys/{{survey_template_id}}
Body: {
  "title": "Updated Survey Title",
  "is_active": true
}
```
Only admin or creator can update.

#### 2.6 Delete Survey Template
```
DELETE /api/shared/surveys/{{survey_template_id}}
```
⚠️ **Warning**: Deletes survey and all associated data (cascade delete)

---

### Phase 3: Question Management (Admin Only)

#### 3.1 Create Question
```
POST /api/admin/surveys/templates/{{survey_template_id}}/questions
Body: {
  "question_text": "How would you rate the course?",
  "question_type": "rating",
  "is_required": true,
  "order_position": 1,
  "help_text": "Rate from 1 to 5",
  "min_value": 1,
  "max_value": 5
}
```

**Question Types:**
- `text`: Short or long text answer
- `textarea`: Multi-line text
- `number`: Numeric input
- `rating`: Rating scale (e.g., 1-5)
- `date`: Date picker
- `multiple_choice`: Single selection
- `checkbox`: Multiple selections
- `file_upload`: File attachment

**Common Fields:**
- `question_text` (required): The question
- `question_type` (required): Type from list above
- `is_required`: Make question mandatory
- `order_position`: Display order
- `help_text`: Additional guidance
- `min_value`, `max_value`: For number/rating types
- `max_length`: For text types
- `allowed_file_types`: For file uploads (e.g., "pdf,doc,docx")
- `max_file_size_mb`: File size limit

#### 3.2 Update Question
```
PUT /api/admin/surveys/questions/{{question_id}}
Body: {
  "question_text": "Updated question text",
  "is_required": false
}
```

#### 3.3 Delete Question
```
DELETE /api/admin/surveys/questions/{{question_id}}
```

---

### Phase 4: Question Options Management (Admin Only)

#### 4.1 Create Option (for multiple_choice or checkbox questions)
```
POST /api/admin/surveys/questions/{{question_id}}/options
Body: {
  "option_text": "Excellent",
  "order_position": 1,
  "has_custom_input": false
}
```

**Fields:**
- `option_text` (required): The option label
- `order_position`: Display order
- `has_custom_input`: Allow custom text input with this option

#### 4.2 Update Option
```
PUT /api/admin/surveys/options/{{option_id}}
Body: {
  "option_text": "Very Good",
  "order_position": 2
}
```

#### 4.3 Delete Option
```
DELETE /api/admin/surveys/options/{{option_id}}
```

---

### Phase 5: Survey Response Submission (Students/Users)

#### 5.1 Check Survey Status
```
GET /api/shared/surveys/{{survey_template_id}}/status
```
Returns whether the current user has already submitted this survey.

#### 5.2 Create Draft Response (Optional)
```
POST /api/shared/surveys/{{survey_template_id}}/responses
Body: {
  "survey_template_id": "{{survey_template_id}}",
  "is_complete": false,
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0"
}
```
Use this to create a draft response before submitting answers.

#### 5.3 Submit Complete Survey Response
```
POST /api/shared/surveys/{{survey_template_id}}/response
Body: {
  "answers": [
    {
      "question_id": 1,
      "text_answer": "Great course!"
    },
    {
      "question_id": 2,
      "rating_answer": 5
    },
    {
      "question_id": 3,
      "selected_options": [1, 2],
      "custom_text": "Additional feedback"
    },
    {
      "question_id": 4,
      "number_answer": 85
    },
    {
      "question_id": 5,
      "date_answer": "2025-01-15"
    },
    {
      "question_id": 6,
      "files": [
        {
          "url": "https://example.com/file.pdf",
          "name": "feedback.pdf",
          "type": "application/pdf",
          "size": 102400
        }
      ]
    }
  ]
}
```

**Answer Fields by Question Type:**
- **Text/Textarea**: `text_answer`
- **Number**: `number_answer`
- **Rating**: `rating_answer`
- **Date**: `date_answer`
- **Multiple Choice/Checkbox**: `selected_options` (array of option IDs)
- **File Upload**: `files` (array of file objects)

---

### Phase 6: Reports & Analytics

#### 6.1 Get Survey Report
```
GET /api/shared/surveys/{{survey_template_id}}/report
```
Returns aggregated statistics:
- Total responses
- Per-question summaries
- Rating averages, min, max
- Option selection counts
- Text answer counts

#### 6.2 Admin - Get Survey Statistics
```
GET /api/admin/surveys/statistics/{{survey_template_id}}
```
Updates and returns survey statistics.

#### 6.3 Admin - Get All Responses
```
GET /api/admin/surveys/responses/{{survey_template_id}}
```
Returns list of all responses (without detailed answers).

#### 6.4 Admin - Get Responses with Answers
```
GET /api/admin/surveys/responses/{{survey_template_id}}?includeAnswers=true
```
Returns complete response data including all answers and selected options.

---

### Phase 7: Admin Survey Management

#### 7.1 Admin - List All Surveys
```
GET /api/admin/surveys
```

#### 7.2 Admin - Filter Surveys
```
GET /api/admin/surveys?title=Student&target_audience=student&is_active=true
```

**Query Parameters:**
- `title`: Filter by title (partial match)
- `target_audience`: Filter by audience
- `is_active`: Filter by active status (true/false)
- `created_by`: Filter by creator user ID

#### 7.3 Admin - Get Survey Details
```
GET /api/admin/surveys/{{survey_template_id}}
```

---

## Complete Testing Scenarios

### Scenario 1: Create and Complete a Simple Survey

1. **Login as Admin**
   - Use "Login as Admin" request
   - Verify token is saved

2. **Create Survey Template**
   - Use "Create Survey Template" request
   - Verify survey_template_id is saved

3. **Add Rating Question**
   - Use "Admin - Create Question" with type "rating"
   - Note the question_id from response

4. **Add Text Question**
   - Use "Admin - Create Question" with type "text"

5. **View Survey as Student**
   - Login as Student
   - Use "Get Survey Template Details"
   - Verify questions are visible

6. **Submit Response**
   - Use "Submit Survey Response"
   - Include answers for both questions

7. **View Report**
   - Login as Admin
   - Use "Get Survey Report"
   - Verify statistics are calculated

### Scenario 2: Multiple Choice Survey

1. **Create Survey** (as Admin)
2. **Create Multiple Choice Question**
   ```json
   {
     "question_text": "Which topics interest you?",
     "question_type": "checkbox",
     "is_required": true,
     "order_position": 1
   }
   ```
3. **Add Options**
   - Create option: "Web Development"
   - Create option: "Mobile Apps"
   - Create option: "Data Science"
   - Create option: "AI/ML"

4. **Submit Response with Multiple Selections**
   ```json
   {
     "answers": [{
       "question_id": 1,
       "selected_options": [1, 3, 4]
     }]
   }
   ```

5. **View Report** to see option selection counts

### Scenario 3: Anonymous Survey

1. **Create Survey with Anonymous Flag**
   ```json
   {
     "title": "Anonymous Feedback",
     "is_anonymous": true,
     "allow_multiple_submissions": true
   }
   ```

2. **Add Questions and Submit Responses**
3. **View Report** - respondent IDs should be hidden

---

## Testing Tips

### 1. Use Collection Runner
- Select the collection
- Click "Run" to execute all requests in sequence
- Review results for any failures

### 2. Check Response Status Codes
- `200`: Success (GET, PUT)
- `201`: Created (POST)
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (e.g., duplicate submission)
- `500`: Server Error

### 3. Validate Response Structure
All responses follow this format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### 4. Test Error Cases
- Try creating survey without title
- Try submitting without authentication
- Try submitting survey twice (when not allowed)
- Try accessing admin endpoints as student

### 5. Use Postman Tests
The collection includes automatic tests that:
- Save IDs to variables
- Validate response codes
- Check response structure

---

## Common Issues & Solutions

### Issue 1: "Unauthorized" Error
**Solution**: Ensure you've logged in and the token is saved. Check the Authorization tab shows Bearer token.

### Issue 2: Survey Template ID Not Found
**Solution**: Run "Create Survey Template" first or manually set the `survey_template_id` variable.

### Issue 3: "Only administrators can create survey templates"
**Solution**: Login as Admin user, not Student.

### Issue 4: "You have already submitted this survey"
**Solution**: Either:
- Create a new survey with `allow_multiple_submissions: true`
- Login as a different user
- Delete and recreate the survey

### Issue 5: Question ID Not Found
**Solution**: After creating a question, manually copy the ID from the response and set it in the `question_id` variable.

---

## Sample Data for Testing

### Sample Survey Template
```json
{
  "title": "Course Evaluation Survey",
  "description": "Help us improve by providing your feedback",
  "target_audience": "student",
  "is_active": true,
  "is_anonymous": false,
  "allow_multiple_submissions": false,
  "start_date": "2025-01-01",
  "end_date": "2025-12-31"
}
```

### Sample Questions
```json
// Rating Question
{
  "question_text": "Rate the course content quality",
  "question_type": "rating",
  "is_required": true,
  "order_position": 1,
  "min_value": 1,
  "max_value": 5
}

// Text Question
{
  "question_text": "What improvements would you suggest?",
  "question_type": "textarea",
  "is_required": false,
  "order_position": 2,
  "max_length": 1000
}

// Multiple Choice
{
  "question_text": "Which teaching method did you prefer?",
  "question_type": "multiple_choice",
  "is_required": true,
  "order_position": 3
}
```

### Sample Options (for Multiple Choice)
```json
{ "option_text": "Lectures", "order_position": 1 }
{ "option_text": "Practical Labs", "order_position": 2 }
{ "option_text": "Group Projects", "order_position": 3 }
{ "option_text": "Self-Study", "order_position": 4 }
```

### Sample Response
```json
{
  "answers": [
    {
      "question_id": 1,
      "rating_answer": 4
    },
    {
      "question_id": 2,
      "text_answer": "More practical examples would be helpful"
    },
    {
      "question_id": 3,
      "selected_options": [2]
    }
  ]
}
```

---

## Advanced Testing

### Test with Different User Roles
1. Create users with different roles (student, lecturer, admin)
2. Test visibility and permissions for each role
3. Verify role-based access control

### Test Survey Lifecycle
1. Create inactive survey (`is_active: false`)
2. Add questions
3. Activate survey (`is_active: true`)
4. Collect responses
5. Deactivate survey
6. Generate final report

### Test Data Validation
- Submit empty answers for required questions
- Submit invalid rating values (e.g., 10 when max is 5)
- Submit text exceeding max_length
- Submit invalid date formats

### Performance Testing
- Create survey with 50+ questions
- Submit 100+ responses
- Generate report and measure response time

---

## API Endpoint Reference

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/api/auth/login` | Login | No | All |
| POST | `/api/shared/surveys` | Create survey | Yes | Admin |
| GET | `/api/shared/surveys` | List surveys | Yes | All |
| GET | `/api/shared/surveys/visible` | Get visible surveys | Yes | All |
| GET | `/api/shared/surveys/:id` | Get survey details | Yes | All |
| GET | `/api/shared/surveys/:id/status` | Check submission status | Yes | All |
| PUT | `/api/shared/surveys/:id` | Update survey | Yes | Admin/Creator |
| DELETE | `/api/shared/surveys/:id` | Delete survey | Yes | Admin/Creator |
| POST | `/api/shared/surveys/:id/responses` | Create draft response | Yes | All |
| POST | `/api/shared/surveys/:id/response` | Submit complete response | Yes | All |
| GET | `/api/shared/surveys/:id/report` | Get survey report | Yes | All |
| GET | `/api/admin/surveys` | Admin list surveys | Yes | Admin |
| GET | `/api/admin/surveys/:id` | Admin get survey | Yes | Admin |
| GET | `/api/admin/surveys/statistics/:id` | Get statistics | Yes | Admin |
| GET | `/api/admin/surveys/responses/:id` | Get responses | Yes | Admin |
| POST | `/api/admin/surveys/templates/:id/questions` | Create question | Yes | Admin |
| PUT | `/api/admin/surveys/questions/:id` | Update question | Yes | Admin |
| DELETE | `/api/admin/surveys/questions/:id` | Delete question | Yes | Admin |
| POST | `/api/admin/surveys/questions/:id/options` | Create option | Yes | Admin |
| PUT | `/api/admin/surveys/options/:id` | Update option | Yes | Admin |
| DELETE | `/api/admin/surveys/options/:id` | Delete option | Yes | Admin |

---

## Troubleshooting Checklist

- [ ] Backend server is running on port 5000
- [ ] Database is connected and migrations are applied
- [ ] You have logged in and token is saved
- [ ] Survey template ID is set in variables
- [ ] You're using the correct user role for the endpoint
- [ ] Request body is valid JSON
- [ ] Required fields are included
- [ ] Content-Type header is set to application/json

---

## Next Steps

After testing all endpoints:
1. Document any bugs or issues found
2. Test edge cases and error scenarios
3. Verify data integrity in the database
4. Test with real user workflows
5. Perform load testing if needed

---

## Support

If you encounter issues:
1. Check the server logs for error messages
2. Verify database schema matches expectations
3. Review the controller code for business logic
4. Check middleware for authentication/authorization issues

Happy Testing! 🚀
