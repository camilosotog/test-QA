# Returns Module - Quick Start Guide

## 📌 Overview

The **Returns Module** is used to register and track requirement analysis returns for the QA department.

**Key Features:**
- Register returns with PO name, task code, and reason
- Automatic timestamp capture
- Filter by PO and task code
- Monthly statistics by PO
- Responsive UI (desktop, tablet, mobile)

---

## 🚀 Getting Started (5 minutes)

### Step 1: Access the Module
```
http://localhost:4200/returns
```

### Step 2: Register a Return
1. Click **"📝 Register"** tab
2. Select PO name from dropdown (5 options available)
3. Enter task code (e.g., TASK-001)
4. Enter return reason (why was it returned?)
5. Click **"💾 Save"**

That's it! Your return is registered with automatic date/time.

### Step 3: View Returns
1. Click **"📋 List"** tab
2. View all returns in table format
3. Filter by PO or task code if needed
4. Click **"✏️"** to edit or **"🗑️"** to delete

### Step 4: Analyze Statistics
1. Click **"📊 Statistics"** tab
2. Select a month to view returns by PO
3. See total count and averages

---

## 📋 UI Components

### Registration Tab
```
┌─────────────────────────────────────┐
│ Register New Return                 │
├─────────────────────────────────────┤
│ PO Name *          [▼ Select PO]    │
│ Task Code *        [____________]   │
│ Return Reason *    [____________]   │
│                    [____________]   │
│                                     │
│ ℹ️  Date: automatically captured    │
│                                     │
│                 [💾 Save] [✕ Cancel]│
└─────────────────────────────────────┘
```

### List Tab
```
┌─────────────────────────────────────┐
│ Returns List                        │
├─────────────────────────────────────┤
│ Filters:                            │
│ [▼ All POs] [Search Code] [Filter] │
│                                     │
│ ┌────────────────────────────────┐ │
│ │ PO | Code | Reason | Date | ✏ 🗑│
│ ├────────────────────────────────┤ │
│ │ PO1│ TK-01│ Reason │ 10/12│✏ 🗑│
│ │ PO2│ TK-02│ Reason │ 10/12│✏ 🗑│
│ └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Statistics Tab
```
┌─────────────────────────────────────┐
│ Statistics                          │
├─────────────────────────────────────┤
│ Select a Month:                     │
│ [J] [F] [M] [A] [M] [J]            │
│ [J] [A] [S] [O] [N] [D]            │
│                                     │
│ ┌────────────────────────────────┐ │
│ │ PO | Total | Month | Year      │ │
│ ├────────────────────────────────┤ │
│ │ PO1│   5   │ Dec  │ 2025       │ │
│ │ PO2│   3   │ Dec  │ 2025       │ │
│ └────────────────────────────────┘ │
│                                     │
│ Summary:                            │
│ [Total: 8] [POs: 2] [Avg: 4.0]    │
└─────────────────────────────────────┘
```

---

## 🔑 Available POs

The system includes 5 predefined Product Owners:

1. **Juan David Jimenez**
2. **Alejandro Suarez**
3. **Sebastian Chaves**
4. **Jonnat Torres**
5. **Adalberto Salas**

---

## 📊 API Endpoints (For Developers)

### List Returns
```http
GET /api/returns
GET /api/returns?po_name=Juan%20David%20Jimenez&task_code=TASK&limit=50
```

### Get Single Return
```http
GET /api/returns/1
```

### Create Return
```http
POST /api/returns
Content-Type: application/json

{
  "po_name": "Juan David Jimenez",
  "task_code": "TASK-001",
  "return_reason": "Requirements not clear"
}
```

### Update Return
```http
PUT /api/returns/1
Content-Type: application/json

{
  "return_reason": "Updated reason"
}
```

### Delete Return
```http
DELETE /api/returns/1
```

### Get Statistics by PO
```http
GET /api/returns/statistics/by-po
```

### Get Statistics by Month
```http
GET /api/returns/statistics/by-month?year=2025&month=12
```

### Get Returns by Date Range
```http
GET /api/returns/date-range?start_date=2025-12-01&end_date=2025-12-31
```

---

## 🗄️ Database Schema

### Table: `returns`

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | INT | ❌ | Primary Key, Auto-increment |
| po_name | VARCHAR(255) | ❌ | Product Owner name |
| task_code | VARCHAR(100) | ❌ | Task identifier |
| return_reason | TEXT | ❌ | Reason for return |
| created_at | TIMESTAMP | ✅ | Auto-set to current time |
| is_active | TINYINT(1) | ✅ | 1=active, 0=deleted (soft delete) |

### Indices

- `idx_po_name` on `po_name` - Fast PO lookups
- `idx_task_code` on `task_code` - Fast task code searches
- `idx_created_at` on `created_at` - Fast date range queries

---

## ❓ FAQ

**Q: Can I edit a return after saving?**  
A: Yes! Click the **"✏️"** button next to any return in the list.

**Q: Can I delete a return?**  
A: Yes! Click the **"🗑️"** button. Data is kept in database (soft delete).

**Q: How are dates handled?**  
A: Automatically captured on server (no timezone issues).

**Q: Can I export data?**  
A: Currently visible in table. Copy to Excel manually or future API enhancement.

**Q: Is there a limit on returns?**  
A: No limit! System can handle thousands.

**Q: Are returns secure?**  
A: Yes! Requires authentication and has validation on all fields.

---

## 🛠️ Technical Details

**Frontend:**
- Angular 17
- TypeScript
- FormsModule for forms
- HttpClientModule for API calls

**Backend:**
- Node.js + Express.js
- TypeScript
- MySQL2 driver
- RESTful API design

**Database:**
- MySQL 8.0+
- InnoDB engine
- UTF-8 charset

---

## 🚨 Troubleshooting

### Module Not Loading
- [ ] Check if backend is running (port 4000)
- [ ] Check if frontend is running (port 4200)
- [ ] Clear browser cache
- [ ] Open DevTools (F12) → Console for errors

### Can't Save Returns
- [ ] Verify all fields are filled (PO, Task Code, Reason)
- [ ] Check network tab (F12) for API errors
- [ ] Ensure backend is responding

### Can't See Statistics
- [ ] Ensure returns exist in database
- [ ] Try selecting a different month
- [ ] Check console for errors

### Database Issues
- [ ] Verify MySQL is running
- [ ] Check migration ran successfully
- [ ] Verify table exists: `SHOW TABLES;`

---

## 📝 Usage Examples

### Example 1: Register Return from Code Review
1. PO Name: **Alejandro Suarez**
2. Task Code: **PR-2025-1234**
3. Reason: **Code review comments not addressed before submission**
4. Click Save → Return registered with timestamp

### Example 2: Filter by PO
1. Go to List tab
2. Select **Juan David Jimenez** from filter
3. Click Filter
4. See all returns for this PO

### Example 3: Analyze Monthly Trends
1. Go to Statistics tab
2. Click December
3. View breakdown by PO
4. Compare counts across POs

---

## 🎓 Learning Path

1. **5 min**: Read this Quick Start
2. **5 min**: Create your first return
3. **10 min**: Explore List and Statistics tabs
4. **Now**: You're ready to use the module!

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review API documentation
3. Contact development team

---

**Version**: 2.0.0 (English Edition)  
**Status**: ✅ Ready for Production  
**Last Updated**: 10 de diciembre de 2025
