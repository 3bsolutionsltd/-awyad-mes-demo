# Fix PostgreSQL Password Authentication

## Current Issue
```
password authentication failed for user "postgres"
```

## Solution Options

### Option 1: Find Your PostgreSQL Password (Recommended)
If you remember your PostgreSQL password from installation:

1. Edit `.env` file
2. Change `DB_PASSWORD=postgres` to your actual password
3. Restart the server: `npm run dev`

### Option 2: Reset PostgreSQL Password
If you don't remember the password:

#### Step 1: Stop PostgreSQL Service
```powershell
Stop-Service postgresql-x64-15
```

#### Step 2: Edit pg_hba.conf
```powershell
# Open pg_hba.conf (adjust path for your PostgreSQL version)
notepad "C:\Program Files\PostgreSQL\15\data\pg_hba.conf"
```

Find these lines near the bottom:
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

**Temporarily change** to `trust`:
```
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
```

Save and close.

#### Step 3: Start PostgreSQL Service
```powershell
Start-Service postgresql-x64-15
```

#### Step 4: Reset Password
```powershell
# Connect without password (trust mode)
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres

# In psql, change password:
ALTER USER postgres PASSWORD 'your_new_password';
\q
```

#### Step 5: Restore pg_hba.conf
```powershell
notepad "C:\Program Files\PostgreSQL\15\data\pg_hba.conf"
```

Change back to `scram-sha-256`:
```
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

Save and restart service:
```powershell
Restart-Service postgresql-x64-15
```

#### Step 6: Update .env
```env
DB_PASSWORD=your_new_password
```

### Option 3: Use Alternative Authentication (Quick Test)
For quick testing only, use peer/trust authentication:

Edit pg_hba.conf and change localhost connections to `trust`:
```
host    all             all             127.0.0.1/32            trust
```

Then in `.env`, you can use any password (it will be ignored).

**⚠️ WARNING:** This is insecure! Only for local testing, revert after testing.

## Verify Connection
After fixing password:
```powershell
# Test connection
$env:PGPASSWORD='your_password'; & "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "SELECT version();"; $env:PGPASSWORD=$null
```

Should output PostgreSQL version without errors.

## Then Restart Server
```powershell
npm run dev
```

Expected output:
```
✅ Database connection established
🚀 Server running at http://localhost:3001
```
