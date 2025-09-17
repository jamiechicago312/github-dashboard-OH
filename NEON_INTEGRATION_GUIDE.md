# Neon Database Integration Guide

This guide will walk you through integrating Neon (PostgreSQL) database with your GitHub Dashboard project.

## What is Neon?

Neon is a serverless PostgreSQL database platform that's perfect for modern web applications. It provides:
- Automatic scaling
- Branching (like Git for databases)
- Built-in connection pooling
- Generous free tier

## Step 1: Create a Neon Account and Database

1. **Sign up for Neon**
   - Go to [https://neon.tech](https://neon.tech)
   - Click "Sign Up" and create an account (you can use GitHub OAuth)

2. **Create a New Project**
   - After signing in, click "Create Project"
   - Choose a project name (e.g., "github-dashboard")
   - Select a region closest to your users
   - Choose PostgreSQL version (latest is recommended)
   - Click "Create Project"

3. **Get Your Connection Details**
   - After project creation, you'll see the connection details
   - **IMPORTANT**: Copy and save these details immediately:
     - Database URL (starts with `postgresql://`)
     - Host
     - Database name
     - Username
     - Password

## Step 2: Set Up Environment Variables

Create or update your `.env.local` file in the project root with your Neon credentials:

```env
# Neon Database Configuration
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# Alternative format (if you prefer separate variables)
NEON_HOST="your-host.neon.tech"
NEON_DATABASE="your-database-name"
NEON_USERNAME="your-username"
NEON_PASSWORD="your-password"

# GitHub Configuration (keep existing)
GITHUB_TOKEN="your-github-token"
GITHUB_OWNER="your-github-owner"
GITHUB_REPO="your-repo-name"
```

## Step 3: Install Required Dependencies

The project will automatically install these dependencies:
- `pg` - PostgreSQL client for Node.js
- `@types/pg` - TypeScript types for pg
- `@vercel/postgres` - Vercel's PostgreSQL SDK (optimized for serverless)

## Step 4: Database Schema

The system will automatically create the required table with this schema:

```sql
CREATE TABLE IF NOT EXISTS repository_metrics (
    id SERIAL PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    date DATE NOT NULL,
    stars INTEGER NOT NULL DEFAULT 0,
    forks INTEGER NOT NULL DEFAULT 0,
    contributors INTEGER NOT NULL DEFAULT 0,
    open_issues INTEGER NOT NULL DEFAULT 0,
    closed_issues INTEGER NOT NULL DEFAULT 0,
    open_prs INTEGER NOT NULL DEFAULT 0,
    closed_prs INTEGER NOT NULL DEFAULT 0,
    merged_prs INTEGER NOT NULL DEFAULT 0,
    commits INTEGER NOT NULL DEFAULT 0,
    releases INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_repository_metrics_date ON repository_metrics(date);
CREATE INDEX IF NOT EXISTS idx_repository_metrics_timestamp ON repository_metrics(timestamp);
```

## Step 5: Vercel Deployment Configuration

When deploying to Vercel:

1. **Add Environment Variables in Vercel Dashboard**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add your `DATABASE_URL` and other environment variables
   - Make sure to set them for all environments (Development, Preview, Production)

2. **Neon Integration with Vercel**
   - Neon has native Vercel integration
   - In your Neon dashboard, you can connect directly to Vercel projects
   - This automatically sets up environment variables

## Step 6: Testing the Integration

After setup, you can test the database connection:

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Test manual data collection**
   ```bash
   curl -X POST http://localhost:12000/api/scheduler \
     -H "Content-Type: application/json" \
     -d '{"action": "collect"}'
   ```

3. **Check scheduler status**
   ```bash
   curl http://localhost:12000/api/scheduler
   ```

4. **View trends data**
   ```bash
   curl "http://localhost:12000/api/github/trends?days=7"
   ```

## Step 7: Monitoring and Maintenance

### Neon Dashboard Features
- **Query Performance**: Monitor slow queries
- **Connection Pooling**: Automatic connection management
- **Branching**: Create database branches for testing
- **Backups**: Automatic point-in-time recovery

### Database Maintenance
- The system automatically handles data retention (365 days default)
- Weekly cleanup runs every Sunday at 2 AM
- You can adjust retention policies in the scheduler configuration

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Ensure your DATABASE_URL includes `?sslmode=require`
   - Check if your IP is whitelisted (Neon allows all by default)

2. **SSL Certificate Issues**
   - Make sure you're using `sslmode=require` in your connection string
   - Neon requires SSL connections

3. **Environment Variables Not Loading**
   - Restart your development server after adding .env.local
   - Check that .env.local is in your project root
   - Verify variable names match exactly

4. **Table Creation Errors**
   - The system auto-creates tables, but you can manually run the schema
   - Use Neon's SQL Editor in the dashboard to run queries

### Getting Help

- **Neon Documentation**: [https://neon.tech/docs](https://neon.tech/docs)
- **Neon Discord**: Join their community for support
- **Vercel + Neon Guide**: [https://vercel.com/guides/nextjs-prisma-neon](https://vercel.com/guides/nextjs-prisma-neon)

## Security Best Practices

1. **Never commit database credentials to Git**
   - Use environment variables only
   - Add .env.local to .gitignore (already done)

2. **Use connection pooling**
   - Neon provides built-in connection pooling
   - The @vercel/postgres package handles this automatically

3. **Monitor database usage**
   - Check Neon dashboard for usage metrics
   - Set up alerts for unusual activity

## Migration from SQLite

If you were previously using SQLite:

1. **Export existing data** (if any)
   ```bash
   # The system will automatically migrate to PostgreSQL schema
   # No manual data migration needed for new setups
   ```

2. **Update configuration**
   - The system automatically detects PostgreSQL and uses appropriate queries
   - No code changes needed in your application

3. **Test thoroughly**
   - Run a few manual collections to ensure everything works
   - Check that trends API returns expected data

## Next Steps

After successful integration:

1. **Set up automated scheduling**
   ```bash
   curl -X POST http://localhost:12000/api/scheduler \
     -H "Content-Type: application/json" \
     -d '{"action": "start"}'
   ```

2. **Deploy to Vercel**
   - Push your changes to GitHub
   - Vercel will automatically deploy with Neon integration

3. **Monitor performance**
   - Use Neon dashboard to monitor query performance
   - Set up alerts for database issues

Your GitHub Dashboard is now powered by a scalable, serverless PostgreSQL database! 🚀
