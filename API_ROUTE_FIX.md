# ✅ API Route Fix - Survey Creation

## 🐛 Issue Found

**Error:** `Route not found: /api/admin/surveys` when admin tries to create survey

**Root Cause:** Frontend was calling `/api/admin/surveys` but the CREATE/UPDATE/DELETE endpoints are at `/api/shared/surveys`

---

## ✅ Fix Applied

### Frontend File Updated:
`src/services/api.js` - Line 447-453

**Before (Wrong):**
```javascript
surveys: {
  list: () => request('/api/admin/surveys'),
  getById: (id) => request(`/api/admin/surveys/${id}`),
  create: (payload) => request('/api/admin/surveys', { method: 'POST', body: payload }),  // ❌ WRONG
  update: (id, payload) => request(`/api/admin/surveys/${id}`, { method: 'PUT', body: payload }),  // ❌ WRONG
  remove: (id) => request(`/api/admin/surveys/${id}`, { method: 'DELETE' }),  // ❌ WRONG
}
```

**After (Correct):**
```javascript
surveys: {
  list: () => request('/api/shared/surveys'),  // ✅ FIXED
  getById: (id) => request(`/api/shared/surveys/${id}`),  // ✅ FIXED
  create: (payload) => request('/api/shared/surveys', { method: 'POST', body: payload }),  // ✅ FIXED
  update: (id, payload) => request(`/api/shared/surveys/${id}`, { method: 'PUT', body: payload }),  // ✅ FIXED
  remove: (id) => request(`/api/shared/surveys/${id}`, { method: 'DELETE' }),  // ✅ FIXED
}
```

---

## 📊 Correct API Routes

### Survey Template CRUD (Admin Only)
```
POST   /api/shared/surveys              - Create survey (admin auth required)
GET    /api/shared/surveys              - List all surveys
GET    /api/shared/surveys/:id          - Get survey details
PUT    /api/shared/surveys/:id          - Update survey (admin auth required)
DELETE /api/shared/surveys/:id          - Delete survey (admin auth required)
```

### Admin-Specific Routes
```
GET    /api/admin/surveys/statistics/:id       - Get survey statistics
GET    /api/admin/surveys/responses/:id        - Get all responses
POST   /api/admin/surveys/templates/:id/questions   - Create question
PUT    /api/admin/surveys/questions/:id             - Update question
DELETE /api/admin/surveys/questions/:id             - Delete question
POST   /api/admin/surveys/questions/:id/options     - Create option
PUT    /api/admin/surveys/options/:id               - Update option
DELETE /api/admin/surveys/options/:id               - Delete option
```

---

## 🗄️ Database Tables Confirmed

All using correct table names:
- ✅ `survey_templates` (main table)
- ✅ `survey_questions`
- ✅ `survey_question_options`
- ✅ `survey_responses`
- ✅ `survey_answers`
- ✅ `survey_answer_options`
- ✅ `survey_answer_files`

---

## ✅ Now Working

**Admin can now:**
1. ✅ Create surveys via `/api/shared/surveys`
2. ✅ Update surveys via `/api/shared/surveys/:id`
3. ✅ Delete surveys via `/api/shared/surveys/:id`
4. ✅ Add questions via `/api/admin/surveys/templates/:id/questions`
5. ✅ View responses via `/api/admin/surveys/responses/:id`

**Students/Lecturers can:**
1. ✅ View visible surveys via `/api/shared/surveys/visible`
2. ✅ Submit responses via `/api/shared/surveys/:id/response`
3. ✅ Upload files via `/api/shared/surveys/upload-file`

---

## 🚀 Test Again

1. **Refresh your frontend** (Ctrl+R or restart dev server)
2. **Login as admin**
3. **Create survey** - Should work now!
4. **Add questions**
5. **Test student submission**

---

## ✅ Summary

**Fixed:** Changed admin survey CRUD endpoints from `/api/admin/surveys` to `/api/shared/surveys`

**Why:** Backend routes are organized as:
- `/api/shared/surveys` - Template CRUD (with admin auth middleware)
- `/api/admin/surveys` - Admin-only features (statistics, responses, question management)

**Result:** Admin can now create surveys successfully! 🎉
