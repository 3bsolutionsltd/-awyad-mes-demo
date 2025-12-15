# Deployment Guide - AWYAD MES Demo

## Option 1: GitHub Pages (Recommended - Free & Easy)

### Steps:
1. **Create GitHub repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: AWYAD MES Demo"
   ```

2. **Create repository on GitHub.com**
   - Go to https://github.com/new
   - Name it: `awyad-mes-demo`
   - Make it public (for free hosting)

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/awyad-mes-demo.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages**
   - Go to repository Settings
   - Navigate to "Pages" section
   - Source: Select "main" branch
   - Click Save
   - Your site will be live at: `https://YOUR-USERNAME.github.io/awyad-mes-demo/`

### Advantages:
✅ Free hosting
✅ HTTPS enabled
✅ Easy updates (just git push)
✅ No server management

---

## Option 2: Netlify (Alternative - Free with Drag & Drop)

### Steps:
1. **Go to Netlify**: https://www.netlify.com
2. **Sign up** (free account)
3. **Drag & drop** your project folder onto Netlify
4. **Get instant URL**: `https://random-name.netlify.app`
5. **Optional**: Set custom domain

### Advantages:
✅ No git required
✅ Instant deployment
✅ Automatic HTTPS
✅ Form handling (for future features)

---

## Option 3: Vercel (Alternative - Free & Fast)

### Steps:
1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd C:\Users\DELL\awyad-mes-demo
   vercel
   ```

3. **Follow prompts** (login, set project name)
4. **Get instant URL**: `https://awyad-mes-demo.vercel.app`

### Advantages:
✅ Extremely fast CDN
✅ Auto-deployments
✅ Analytics included

---

## Pre-Deployment Checklist

### Files to Include:
- [x] index.html
- [x] app.js
- [x] mockData.js
- [x] All render*.js files
- [x] exportFunctions.js
- [x] README.md

### Files to Exclude (Create .gitignore):
```
# Python
__pycache__/
*.py[cod]
*.pyc

# Backup files
*_backup.js
mockData_new.js

# Parsing scripts (not needed for demo)
parse_csv_to_data.py
generate_complete_data.py
parsed_data.json

# CSV source files (optional - already in mockData)
*.csv

# OS files
.DS_Store
Thumbs.db
```

### Optional: Create .gitignore file
```bash
# In your project folder
echo "*.csv" > .gitignore
echo "*_backup.js" >> .gitignore
echo "*.py" >> .gitignore
echo "parsed_data.json" >> .gitignore
```

---

## Quick GitHub Deployment (Copy-Paste)

Open PowerShell in your project folder and run:

```powershell
# Initialize git
git init

# Create .gitignore
@"
__pycache__/
*.py[cod]
*_backup.js
mockData_new.js
parse_csv_to_data.py
generate_complete_data.py
parsed_data.json
*.csv
"@ | Out-File -FilePath .gitignore -Encoding UTF8

# Add all files
git add .

# Commit
git commit -m "Initial commit: AWYAD MES Demo v1.0"

# Connect to GitHub (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/awyad-mes-demo.git

# Push
git branch -M main
git push -u origin main
```

Then enable GitHub Pages in repository settings.

---

## Custom Domain (Optional)

### For GitHub Pages:
1. Buy domain (e.g., Namecheap, GoDaddy)
2. Add CNAME file to repository:
   ```
   demo.awyad.org
   ```
3. Configure DNS records:
   ```
   Type: CNAME
   Name: demo
   Value: YOUR-USERNAME.github.io
   ```

### For Netlify/Vercel:
- Follow platform-specific domain connection guide
- Usually just update DNS nameservers

---

## Sharing the Demo

### Share Links:
After deployment, share:
- **Live Demo**: `https://YOUR-USERNAME.github.io/awyad-mes-demo/`
- **Documentation**: `https://YOUR-USERNAME.github.io/awyad-mes-demo/README.md`
- **Source Code**: `https://github.com/YOUR-USERNAME/awyad-mes-demo`

### Demo Email Template:
```
Subject: AWYAD MES System Demo - Live Preview

Dear [Name],

I'm pleased to share a live demonstration of the AWYAD Monitoring, Evaluation, 
and Learning (MES) System:

🌐 Live Demo: [Your URL]
📖 User Guide: [Your URL]/README.md
💻 Source Code: [GitHub URL]

Key Features:
- Real-time activity tracking with disaggregation
- Indicator performance monitoring
- Monthly and quarterly reporting
- CSV export capabilities
- Case management system

The demo uses real data from our current tracking tools and demonstrates how 
the system can streamline M&E workflows while maintaining data quality.

Please explore and let me know if you have any questions or feedback.

Best regards,
[Your Name]
```

---

## Updating the Demo

### After deployment, to update:

**GitHub Pages:**
```bash
# Make changes to files
git add .
git commit -m "Update: [describe changes]"
git push
# Changes live in ~1 minute
```

**Netlify:**
- Drag & drop updated folder, or
- Connect to GitHub for auto-deployments

**Vercel:**
```bash
vercel --prod
# Instant deployment
```

---

## Troubleshooting

### Issue: Files not loading
**Solution**: Check file paths are relative (no `C:\` or absolute paths)

### Issue: Module import errors
**Solution**: Ensure all `.js` files use `.js` extension in imports

### Issue: Data not showing
**Solution**: Check browser console (F12) for errors, verify mockData.js syntax

### Issue: Slow loading
**Solution**: Use CDN hosting (GitHub Pages, Netlify, Vercel all have fast CDN)

---

## Security Notes

### For Public Demo:
✅ No sensitive data in mockData.js
✅ No authentication credentials
✅ No API keys
✅ All data is mock/anonymized

### For Production:
⚠️ Add authentication
⚠️ Use backend API
⚠️ Implement role-based access
⚠️ Add data encryption
⚠️ Use environment variables for secrets

---

## Next Steps

1. ✅ Deploy to GitHub Pages
2. ✅ Share with stakeholders
3. 📊 Gather feedback
4. 🔄 Iterate based on feedback
5. 🚀 Plan production implementation

---

**Need Help?**
- GitHub Pages Guide: https://pages.github.com/
- Netlify Docs: https://docs.netlify.com/
- Vercel Docs: https://vercel.com/docs
