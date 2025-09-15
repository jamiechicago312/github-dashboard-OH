# Historical Data Collection System

## Overview

The GitHub Dashboard now includes a comprehensive historical data collection system with automated scheduling, error handling, and data retention policies.

## 🏗️ Architecture

### Components

1. **DataCollectionScheduler** (`lib/scheduler.ts`)
   - Automated cron-based collection scheduling
   - Error handling with exponential backoff
   - Health monitoring and alerting
   - Configurable retry logic

2. **Enhanced MetricsCollector** (`lib/metrics-collector.ts`)
   - Robust data fetching with timeouts
   - Retry logic for failed API calls
   - Data validation and sanity checks
   - Health status reporting

3. **Database Configuration** (`config/database.ts`)
   - Environment-specific database setup
   - Support for SQLite, PostgreSQL, MySQL
   - Cloud database integration

4. **Scheduler API** (`app/api/scheduler/route.ts`)
   - REST endpoints for scheduler management
   - Real-time status monitoring
   - Manual collection triggers

## 📊 Database Storage Strategy

### ✅ Recommended Approach (Implemented)

**Development:**
- Local SQLite database in `./data/` directory
- Database files added to `.gitignore`
- Each developer maintains their own data

**Production Options:**

1. **Cloud Databases** (Recommended)
   ```bash
   # PostgreSQL (Vercel, Railway, Supabase)
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   
   # MySQL (PlanetScale, AWS RDS)
   DATABASE_URL=mysql://user:pass@host:3306/dbname
   ```

2. **Managed SQLite Services**
   ```bash
   # Turso
   DATABASE_URL=libsql://your-db.turso.io
   
   # LiteFS
   DATABASE_PATH=/litefs/data/metrics.db
   ```

3. **Environment-based Configuration**
   ```bash
   NODE_ENV=production
   DATABASE_PATH=/app/data/metrics.db
   DATA_DIR=/app/data
   ```

### ❌ What We Fixed

- Removed database files from Git tracking
- Added proper `.gitignore` entries
- Implemented environment-based configuration

## 🕐 Scheduling Configuration

### Default Schedule

```typescript
{
  metricsInterval: '0 */6 * * *',    // Every 6 hours
  cleanupInterval: '0 2 * * 0',      // Weekly at 2 AM Sunday
  retentionDays: 365,                // Keep 1 year of data
  maxRetries: 3,
  retryDelay: 5000,                  // 5 seconds base delay
  backoffMultiplier: 2,              // Exponential backoff
  enableErrorNotifications: true,
  errorThreshold: 5                  // Alert after 5 consecutive errors
}
```

### Custom Scheduling

```typescript
// Update scheduler configuration
const scheduler = DataCollectionScheduler.getInstance()
scheduler.updateConfig({
  metricsInterval: '0 */2 * * *',    // Every 2 hours
  retentionDays: 180,                // Keep 6 months
  maxRetries: 5
})
```

## 🔧 API Usage

### Start/Stop Scheduler

```bash
# Start automated collection
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# Stop scheduler
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

### Manual Collection

```bash
# Trigger immediate collection
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "collect"}'
```

### Check Status

```bash
# Get scheduler status and health
curl http://localhost:3000/api/scheduler
```

### Update Configuration

```bash
# Update scheduler settings
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{
    "action": "configure",
    "config": {
      "metricsInterval": "0 */4 * * *",
      "retentionDays": 180
    }
  }'
```

## 🛡️ Error Handling

### Retry Logic

- **Exponential Backoff**: Delays increase exponentially (1s, 2s, 4s, 8s...)
- **Timeout Protection**: 30-second timeout per API call
- **Graceful Degradation**: Continues with partial data if some APIs fail

### Error Monitoring

- **Consecutive Error Tracking**: Monitors failed collection attempts
- **Health Status**: Reports system health based on recent collections
- **Alert Thresholds**: Configurable error limits before alerting

### Recovery Strategies

```typescript
// Automatic recovery features
- API rate limit handling
- Network timeout recovery
- Partial data collection
- Database connection retry
- Graceful error logging
```

## 📈 Data Retention

### Automatic Cleanup

- **Scheduled Cleanup**: Weekly cleanup of old data
- **Configurable Retention**: Default 365 days, customizable
- **Efficient Deletion**: Batch deletion to minimize database impact

### Manual Cleanup

```typescript
// Clean up data older than 90 days
const collector = MetricsCollector.getInstance()
collector.cleanupOldMetrics(90)
```

## 🚀 Deployment Considerations

### Environment Variables

```bash
# Required
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_org
GITHUB_REPO=your_repo

# Optional - Database
DATABASE_URL=postgresql://...
DATABASE_PATH=/app/data/metrics.db
DATA_DIR=/app/data

# Optional - Scheduling
NODE_ENV=production
```

### Production Setup

1. **Choose Database Strategy**
   - Cloud database (recommended for scale)
   - Managed SQLite (good for small apps)
   - Local SQLite with persistent storage

2. **Configure Scheduling**
   - Adjust collection frequency based on needs
   - Set appropriate retention policies
   - Configure error alerting

3. **Monitor Health**
   - Use `/api/scheduler` endpoint for monitoring
   - Set up external health checks
   - Configure log aggregation

### Docker Deployment

```dockerfile
# Ensure data directory exists
RUN mkdir -p /app/data
VOLUME ["/app/data"]

# Set environment
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/metrics.db
```

## 🔍 Monitoring & Debugging

### Health Checks

```typescript
// Check system health
const scheduler = DataCollectionScheduler.getInstance()
const isHealthy = scheduler.isHealthy()
const stats = scheduler.getStats()

const collector = MetricsCollector.getInstance()
const health = collector.getHealthStatus()
```

### Logging

- **Structured Logging**: All operations logged with context
- **Error Details**: Full error traces for debugging
- **Performance Metrics**: Collection timing and success rates

### Troubleshooting

Common issues and solutions:

1. **Database Locked**: Ensure proper connection cleanup
2. **API Rate Limits**: Implement proper retry delays
3. **Memory Issues**: Regular cleanup of old data
4. **Network Timeouts**: Adjust timeout configurations

## 🔄 Migration Guide

### From Manual to Automated

1. **Backup Existing Data**
   ```bash
   cp data/metrics.db data/metrics.db.backup
   ```

2. **Start Scheduler**
   ```typescript
   const scheduler = DataCollectionScheduler.getInstance()
   scheduler.start()
   ```

3. **Verify Operation**
   - Check logs for successful collections
   - Monitor API endpoint for health status
   - Validate data consistency

### Database Migration

If moving from local SQLite to cloud database:

1. **Export Data**: Use database-specific export tools
2. **Update Configuration**: Set `DATABASE_URL`
3. **Import Data**: Use cloud provider's import tools
4. **Test Collection**: Verify new setup works

## 📚 Best Practices

### Development

- Use local SQLite for development
- Keep database files out of version control
- Test scheduler with short intervals
- Monitor logs during development

### Production

- Use managed database services
- Set up proper monitoring and alerting
- Configure appropriate retention policies
- Implement backup strategies
- Use environment-specific configurations

### Security

- Store database credentials in environment variables
- Use SSL/TLS for database connections
- Implement proper access controls
- Regular security updates

## 🎯 Future Enhancements

Potential improvements:

1. **Advanced Analytics**
   - Trend analysis and predictions
   - Anomaly detection
   - Performance benchmarking

2. **Enhanced Monitoring**
   - Grafana/Prometheus integration
   - Custom alerting rules
   - Performance dashboards

3. **Data Export**
   - CSV/JSON export functionality
   - API for external integrations
   - Backup and restore tools

4. **Multi-Repository Support**
   - Track multiple repositories
   - Comparative analytics
   - Organization-wide insights