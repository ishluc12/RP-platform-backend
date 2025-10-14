# Survey File Upload - Quick Summary

## ✅ What I Just Created

I've added a **complete file upload system** for your surveys!

### New Files Created:
1. **`src/routes/shared/surveyFileUpload.js`** - File upload endpoints
2. **`postman/FILE_UPLOAD_TESTING_GUIDE.md`** - Complete testing guide

### Modified Files:
1. **`src/routes/shared/index.js`** - Registered the new routes

---

## 🚀 How It Works

### Two-Step Process:

```
Step 1: Upload File → Get URL
Step 2: Submit Survey → Include URL in answer
```

### New Endpoints Available:

| Endpoint | Purpose | Max Files | Max Size |
|----------|---------|-----------|----------|
| `POST /api/shared/surveys/upload-file` | Upload single file | 1 | 10MB |
| `POST /api/shared/surveys/upload-files` | Upload multiple files | 5 | 10MB each |

---

## 📝 Quick Test in Postman

### 1. Upload a File

**Endpoint:** `POST http://localhost:5000/api/shared/surveys/upload-file`

**Setup in Postman:**
- Method: POST
- Headers: Authorization Bearer token (already set)
- Body: Select **form-data** (not JSON!)
- Add key: `file`
- Change type to **File**
- Select a PDF/image/document from your computer

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/.../file.pdf",
    "name": "document.pdf",
    "type": "application/pdf",
    "size": 102400
  }
}
```

### 2. Use File URL in Survey Response

**Endpoint:** `POST http://localhost:5000/api/shared/surveys/{templateId}/response`

**Body (raw JSON):**
```json
{
  "answers": [
    {
      "question_id": "your-file-upload-question-id",
      "files": [
        {
          "url": "https://res.cloudinary.com/.../file.pdf",
          "name": "document.pdf",
          "type": "application/pdf",
          "size": 102400
        }
      ]
    }
  ]
}
```

---

## 📋 Supported File Types

✅ **Images:** JPG, PNG, GIF, WebP  
✅ **Documents:** PDF, DOC, DOCX  
✅ **Spreadsheets:** XLS, XLSX  
✅ **Text:** TXT, CSV  

❌ **Not Allowed:** EXE, ZIP, RAR, etc.

---

## 🔧 Before Testing

### 1. Ensure Cloudinary is Configured

Check your `.env` file has:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Restart Server

```bash
# Stop server (Ctrl+C)
npm start
```

### 3. Create File Upload Question

```json
POST /api/admin/surveys/templates/{templateId}/questions

{
  "question_text": "Upload your document",
  "question_type": "file_upload",
  "is_required": false,
  "order_index": 5,
  "allowed_file_types": ["pdf", "doc", "docx", "jpg", "png"],
  "max_file_size_mb": 5
}
```

---

## 🎯 Complete Test Flow

1. ✅ Create survey with file upload question
2. ✅ Upload file → Get URL
3. ✅ Submit survey response with file URL
4. ✅ Admin views responses → See uploaded files

---

## 📚 Documentation

For detailed testing instructions, see:
- **`postman/FILE_UPLOAD_TESTING_GUIDE.md`** - Complete guide with examples
- **`postman/SURVEY_API_TESTING_GUIDE.md`** - Full survey API documentation
- **`postman/QUICK_TEST_REFERENCE.md`** - Quick reference card

---

## 💡 Key Points

1. **Use form-data in Postman** for file uploads (not raw JSON)
2. **Upload file first** to get URL, then include URL in survey response
3. **Files stored in Cloudinary** at `survey_uploads/` folder
4. **Maximum 10MB per file**, up to 5 files at once
5. **Only specific file types allowed** for security

---

## 🐛 Common Issues

| Error | Solution |
|-------|----------|
| "No file uploaded" | Use form-data, not raw JSON |
| "Unsupported file type" | Check file type is in allowed list |
| "File too large" | Maximum 10MB per file |
| "Missing Cloudinary variables" | Add credentials to .env and restart |

---

## ✅ What's Next?

Now you can test the complete survey flow:

1. ✅ Admin creates survey
2. ✅ Admin adds questions (including file upload)
3. ✅ Student uploads files
4. ✅ Student submits survey with files
5. ✅ Admin views responses with file links

**Ready to test!** 🚀

See `postman/FILE_UPLOAD_TESTING_GUIDE.md` for step-by-step instructions.
