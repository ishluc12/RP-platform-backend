# Survey File Upload Testing Guide

## 📁 Overview

Survey file uploads work in a **two-step process**:
1. **Upload file** → Get file URL from Cloudinary
2. **Submit survey response** → Include file URL in answer

---

## 🔧 Setup Requirements

### 1. Cloudinary Configuration

Ensure your `.env` file has Cloudinary credentials:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# OR use single URL
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

### 2. Restart Server

After adding the file upload route, restart your server:

```bash
npm start
```

---

## 🧪 Testing File Uploads in Postman

### Step 1: Create File Upload Question

**Endpoint:** `POST /api/admin/surveys/templates/:templateId/questions`

**Body:**
```json
{
  "question_text": "Upload your assignment feedback document",
  "question_type": "file_upload",
  "is_required": false,
  "order_index": 5,
  "allowed_file_types": ["pdf", "doc", "docx", "jpg", "png"],
  "max_file_size_mb": 5
}
```

**Save the question ID from the response!**

---

### Step 2: Upload a File

**Endpoint:** `POST /api/shared/surveys/upload-file`

**In Postman:**
1. Method: `POST`
2. URL: `http://localhost:5000/api/shared/surveys/upload-file`
3. Headers: Authorization Bearer token (already set)
4. Body:
   - Select **form-data** (not raw JSON!)
   - Add key: `file`
   - Change type from "Text" to **"File"**
   - Click "Select Files" and choose a file from your computer

**Expected Response (200):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/your-cloud/raw/upload/v1234567890/survey_uploads/survey_abc123.pdf",
    "name": "assignment_feedback.pdf",
    "type": "application/pdf",
    "size": 102400,
    "public_id": "survey_uploads/survey_abc123"
  }
}
```

**Copy the `url`, `name`, `type`, and `size` from the response!**

---

### Step 3: Submit Survey Response with File

**Endpoint:** `POST /api/shared/surveys/:templateId/response`

**Body (raw JSON):**
```json
{
  "answers": [
    {
      "question_id": "your-rating-question-id",
      "rating_answer": 5
    },
    {
      "question_id": "your-text-question-id",
      "text_answer": "Great course!"
    },
    {
      "question_id": "your-file-upload-question-id",
      "files": [
        {
          "url": "https://res.cloudinary.com/your-cloud/raw/upload/v1234567890/survey_uploads/survey_abc123.pdf",
          "name": "assignment_feedback.pdf",
          "type": "application/pdf",
          "size": 102400
        }
      ]
    }
  ]
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Survey response submitted successfully"
}
```

---

## 📤 Upload Multiple Files

**Endpoint:** `POST /api/shared/surveys/upload-files`

**In Postman:**
1. Method: `POST`
2. URL: `http://localhost:5000/api/shared/surveys/upload-files`
3. Body: **form-data**
4. Add key: `files` (note the plural!)
5. Change type to **"File"**
6. Click "Select Files" and choose **multiple files** (up to 5)

**Expected Response (200):**
```json
{
  "success": true,
  "message": "3 file(s) uploaded successfully",
  "data": {
    "files": [
      {
        "url": "https://res.cloudinary.com/.../file1.pdf",
        "name": "document1.pdf",
        "type": "application/pdf",
        "size": 50000
      },
      {
        "url": "https://res.cloudinary.com/.../file2.jpg",
        "name": "image1.jpg",
        "type": "image/jpeg",
        "size": 75000
      },
      {
        "url": "https://res.cloudinary.com/.../file3.docx",
        "name": "report.docx",
        "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "size": 120000
      }
    ]
  }
}
```

**Then include all files in survey response:**
```json
{
  "answers": [
    {
      "question_id": "file-upload-question-id",
      "files": [
        {
          "url": "https://res.cloudinary.com/.../file1.pdf",
          "name": "document1.pdf",
          "type": "application/pdf",
          "size": 50000
        },
        {
          "url": "https://res.cloudinary.com/.../file2.jpg",
          "name": "image1.jpg",
          "type": "image/jpeg",
          "size": 75000
        }
      ]
    }
  ]
}
```

---

## 📋 Supported File Types

| Category | MIME Type | Extensions |
|----------|-----------|------------|
| **Images** | image/jpeg, image/jpg, image/png, image/gif, image/webp | .jpg, .jpeg, .png, .gif, .webp |
| **Documents** | application/pdf | .pdf |
| **Word** | application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document | .doc, .docx |
| **Excel** | application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | .xls, .xlsx |
| **Text** | text/plain, text/csv | .txt, .csv |

**Maximum file size:** 10MB per file

---

## 🎯 Complete Test Workflow

### Scenario: Student Submits Survey with File

1. **Admin creates survey with file upload question**
   ```
   POST /api/admin/surveys/templates/{id}/questions
   ```

2. **Student logs in**
   ```
   POST /api/auth/login
   Body: { "email": "student@example.com", "password": "student123" }
   ```

3. **Student views survey**
   ```
   GET /api/shared/surveys/{templateId}
   ```

4. **Student uploads file**
   ```
   POST /api/shared/surveys/upload-file
   Body: form-data with file
   ```

5. **Student submits survey with file URL**
   ```
   POST /api/shared/surveys/{templateId}/response
   Body: { answers: [...] }
   ```

6. **Admin views responses with files**
   ```
   GET /api/admin/surveys/responses/{templateId}?includeAnswers=true
   ```

---

## 🔍 Verify Files in Database

Run this query in Supabase to see uploaded files:

```sql
-- View all file uploads for a survey
SELECT 
    saf.id,
    saf.file_name,
    saf.file_url,
    saf.file_type,
    saf.file_size_bytes,
    sa.question_id,
    sr.respondent_id,
    u.name as respondent_name,
    saf.uploaded_at
FROM survey_answer_files saf
JOIN survey_answers sa ON saf.answer_id = sa.id
JOIN survey_responses sr ON sa.response_id = sr.id
JOIN users u ON sr.respondent_id = u.id
WHERE sr.survey_template_id = 'your-survey-template-id'
ORDER BY saf.uploaded_at DESC;
```

---

## 🐛 Troubleshooting

### Error: "No file uploaded"
**Solution:** Ensure you're using **form-data** in Postman, not raw JSON, and the key is named `file` (singular) or `files` (plural for multiple).

### Error: "Unsupported file type"
**Solution:** Check the file type is in the allowed list. Only specific MIME types are accepted.

### Error: "File too large"
**Solution:** Maximum file size is 10MB. Compress or reduce file size.

### Error: "Missing Cloudinary environment variables"
**Solution:** Add Cloudinary credentials to your `.env` file and restart the server.

### Error: "File upload failed"
**Solution:** Check Cloudinary credentials are correct and you have upload permissions.

---

## 📊 File Upload API Reference

| Endpoint | Method | Body Type | Max Files | Max Size |
|----------|--------|-----------|-----------|----------|
| `/api/shared/surveys/upload-file` | POST | form-data | 1 | 10MB |
| `/api/shared/surveys/upload-files` | POST | form-data | 5 | 10MB each |

---

## 💡 Testing Tips

### 1. Test Different File Types
Upload one of each type:
- PDF document
- Word document
- Excel spreadsheet
- Image (JPG, PNG)
- Text file

### 2. Test File Size Limits
- Upload a file just under 10MB ✅
- Try uploading a file over 10MB ❌ (should fail)

### 3. Test Multiple Files
- Upload 1 file
- Upload 3 files
- Upload 5 files (maximum)
- Try uploading 6 files ❌ (should fail)

### 4. Test Invalid File Types
- Try uploading .exe file ❌
- Try uploading .zip file ❌
- Should get "Unsupported file type" error

---

## 🎨 Frontend Implementation Example

```javascript
// React component for file upload
const SurveyFileUpload = ({ questionId }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/shared/surveys/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setUploadedFiles([...uploadedFiles, response.data.data]);
        toast.success('File uploaded successfully!');
      }
    } catch (error) {
      toast.error('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      
      {uploadedFiles.map((file, index) => (
        <div key={index}>
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </a>
        </div>
      ))}
    </div>
  );
};
```

---

## ✅ Testing Checklist

- [ ] Cloudinary credentials configured
- [ ] Server restarted after adding route
- [ ] Created file upload question
- [ ] Uploaded single file successfully
- [ ] Got file URL from response
- [ ] Submitted survey with file URL
- [ ] Verified file in database
- [ ] Tested multiple file upload
- [ ] Tested different file types
- [ ] Tested file size limits
- [ ] Tested invalid file types
- [ ] Admin can view uploaded files in responses

---

## 🚀 Quick Test Commands

### Upload Single File
```
POST http://localhost:5000/api/shared/surveys/upload-file
Body: form-data, key="file", type=File
```

### Upload Multiple Files
```
POST http://localhost:5000/api/shared/surveys/upload-files
Body: form-data, key="files", type=File (select multiple)
```

### Submit Survey with Files
```
POST http://localhost:5000/api/shared/surveys/{templateId}/response
Body: {
  "answers": [{
    "question_id": "...",
    "files": [{ "url": "...", "name": "...", "type": "...", "size": ... }]
  }]
}
```

---

**Ready to test file uploads!** 🎉

Start with uploading a single PDF file, then progress to multiple files and different file types.
