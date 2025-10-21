# Troubleshooting Guide

This guide helps you diagnose and fix common issues with the GitHub Dashboard.

## Issue: "I don't see anything added to my Neon database"

### Quick Diagnosis

Run this command to check your configuration:
```bash
curl http://localhost:12000/api/database/health
```

Or check the scheduler status:
```bash
curl http://localhost:12000/api/scheduler
```

### Common Causes and Solutions

#### 1. Neon Database Not Configured ⚠️

**Symptoms:**
- API shows "Using SQLite database (fallback)"
- Data is stored locally, not in Neon
- Database health shows `usingFallback: true`

**Solution:**
1. **Create a Neon account** at [https://neon.tech](https://neon.tech)
2. **Create a new project** in your Neon dashboard
3. **Copy the DATABASE_URL** from your project's connection details
4. **Add to your environment:**
   ```bash
   # In .env.local file
   DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
   ```
5. **Restart the application:**
   ```bash
   npm run dev
   ```

#### 2. No Data Collection Happening ❌

**Symptoms:**
- Database health shows `recordCount: 0`
- `lastCollection: null`
- No entries in any database

**Solution:**
1. **Check GitHub configuration:**
   ```bash
   # Ensure these are set in .env.local
   GITHUB_TOKEN=your_token_here
   GITHUB_OWNER=your_username
   GITHUB_REPO=your_repo_name
   ```

2. **Test manual collection:**
   ```bash
   curl -X POST http://localhost:12000/api/scheduler \
     -H "Content-Type: application/json" \
     -d '{"action": "collect"}'
   ```

3. **Start automated collection:**
   ```bash
   curl -X POST http://localhost:12000/api/scheduler \
     -H "Content-Type: application/json" \
     -d '{"action": "start"}'
   ```

#### 3. GitHub API Issues 🔑

**Symptoms:**
- Collection fails with authentication errors
- API returns 401/403 errors
- No repository data retrieved

**Solution:**
1. **Verify GitHub token permissions:**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Ensure token has `public_repo` scope
   - For private repos, ensure `repo` scope

2. **Check token validity:**
   ```bash
   curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
   ```

3. **Verify repository access:**
   ```bash
   curl -H "Authorization: token YOUR_TOKEN" \
     https://api.github.com/repos/OWNER/REPO
   ```

#### 4. Environment Variables Not Loading 📝

**Symptoms:**
- Configuration shows variables as "not set"
- Application doesn't see your .env.local file

**Solution:**
1. **Check file location:**
   ```bash
   # .env.local should be in project root
   ls -la .env.local
   ```

2. **Verify file format:**
   ```bash
   # No spaces around = sign
   GITHUB_TOKEN=your_token_here
   # Not: GITHUB_TOKEN = your_token_here
   ```

3. **Restart development server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

### Step-by-Step Migration to Neon

If you're currently using SQLite and want to migrate to Neon:

1. **Backup existing data (optional):**
   ```bash
   # Your SQLite data is in ./data/metrics.db
   cp ./data/metrics.db ./data/metrics.db.backup
   ```

2. **Set up Neon database:**
   - Create Neon account and project
   - Copy DATABASE_URL
   - Add to .env.local

3. **Test connection:**
   ```bash
   curl http://localhost:12000/api/database/health
   ```

4. **Collect fresh data:**
   ```bash
   curl -X POST http://localhost:12000/api/scheduler \
     -H "Content-Type: application/json" \
     -d '{"action": "collect"}'
   ```

5. **Start scheduler:**
   ```bash
   curl -X POST http://localhost:12000/api/scheduler \
     -H "Content-Type: application/json" \
     -d '{"action": "start"}'
   ```

### Verification Commands

After making changes, verify everything is working:

```bash
# 1. Check database health
curl http://localhost:12000/api/database/health

# 2. Check scheduler status
curl http://localhost:12000/api/scheduler

# 3. Test data collection
curl -X POST http://localhost:12000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "collect"}'

# 4. View collected data
curl "http://localhost:12000/api/github/trends?days=7"
```

### Expected Healthy Output

When everything is working correctly, you should see:

```json
{
  "success": true,
  "summary": "✅ Neon database is configured and working properly (X records)",
  "data": {
    "isConfigured": true,
    "type": "postgresql",
    "isHealthy": true,
    "hasData": true,
    "recordCount": 5,
    "configDetails": {
      "usingNeon": true,
      "usingFallback": false
    },
    "issues": [],
    "recommendations": []
  }
}
```

### Still Having Issues?

1. **Check the server logs:**
   ```bash
   tail -f server.log
   ```

2. **Enable debug mode:**
   ```bash
   DEBUG=* npm run dev
   ```

3. **Test with a simple repository:**
   - Try with a public repository first
   - Ensure the repository exists and is accessible

4. **Check Neon dashboard:**
   - Verify your database is active
   - Check connection limits
   - Review query logs

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Using SQLite database (fallback)" | No DATABASE_URL set | Configure Neon DATABASE_URL |
| "No metrics data found" | No collection run | Run manual collection |
| "GitHub API rate limit" | Too many requests | Wait or use authenticated token |
| "Connection failed" | Invalid DATABASE_URL | Check Neon connection string |
| "Repository not found" | Wrong OWNER/REPO | Verify repository name |

For more detailed setup instructions, see [NEON_INTEGRATION_GUIDE.md](./NEON_INTEGRATION_GUIDE.md).