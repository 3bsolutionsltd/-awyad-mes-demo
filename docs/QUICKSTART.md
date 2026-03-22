# 🚀 Quick Start Guide

Get the AWYAD MES System running in 5 minutes!

## Prerequisites Check

```powershell
# Check Node.js (should be v18+)
node --version

# Check npm (should be v9+)
npm --version
```

Don't have Node.js? Download from: https://nodejs.org/

## Installation (3 steps)

### 1. Install Dependencies
```powershell
npm install
```
⏱️ This takes ~2-3 minutes

### 2. Copy Environment File (Optional)
```powershell
copy .env.example .env
```
Default settings work fine for local development!

### 3. Start the Server
```powershell
npm run dev
```

## ✅ Verify It's Working

Open your browser to: **http://localhost:3000**

You should see the dashboard!

### Test the API:
Open a new terminal and run:
```powershell
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-01-09T..."
}
```

## 📊 What You Can Do Now

### View Dashboard
```
http://localhost:3000/
```

### Access API
```
http://localhost:3000/api/v1/dashboard/stats
http://localhost:3000/api/v1/projects
http://localhost:3000/api/v1/activities
```

### Check Logs
```powershell
# View all logs
type logs\combined.log

# View only errors
type logs\error.log
```

## 🎯 Quick API Examples

### Get All Projects
```powershell
curl http://localhost:3000/api/v1/projects
```

### Get Dashboard Statistics
```powershell
curl http://localhost:3000/api/v1/dashboard/stats
```

### Get Activities with Filters
```powershell
curl "http://localhost:3000/api/v1/activities?status=Completed&page=1&limit=5"
```

### Create New Activity
```powershell
curl -X POST http://localhost:3000/api/v1/activities ^
  -H "Content-Type: application/json" ^
  -d "{\"thematicAreaId\":\"TA-001\",\"indicatorId\":\"IND-001\",\"projectId\":\"PRJ-001\",\"activityName\":\"Test Activity\",\"status\":\"Planned\",\"location\":\"Kampala\",\"plannedDate\":\"2026-02-01\",\"beneficiaries\":{\"direct\":{\"male\":10,\"female\":10,\"other\":0},\"indirect\":{\"male\":5,\"female\":5,\"other\":0}}}"
```

## 🛠️ Development Commands

```powershell
# Start dev server (auto-reload)
npm run dev

# Run tests
npm test

# Check code quality
npm run lint

# Format code
npm run format

# Run everything
npm run build
```

## 🔍 Troubleshooting

### Port 3000 already in use?
Edit `.env` and change:
```env
PORT=3001
```

### Can't find module 'express'?
```powershell
rm -rf node_modules package-lock.json
npm install
```

### Data not loading?
Check that mockData.js exists:
```powershell
dir mockData.js
```

### Server won't start?
Check the logs:
```powershell
type logs\error.log
```

## 📚 Next Steps

1. **Explore the Dashboard** - Navigate through all pages
2. **Test the API** - Try all endpoints
3. **Read the Docs** - Check README_NEW.md for details
4. **Review the Code** - Understand the structure

## 🎉 You're Ready!

Your professional MES system is now running!

### Resources:
- 📖 Full Documentation: [README_NEW.md](README_NEW.md)
- 🔄 Migration Guide: [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- 🌐 API Docs: http://localhost:3000/api/v1/health

---

**Need help?** Check the logs in the `logs/` directory or review the full README.
