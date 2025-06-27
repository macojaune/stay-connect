# Docker Setup for StayConnect

This guide explains how to run the StayConnect application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

## Quick Start

### Production Setup

1. **Clone the repository and navigate to the project directory:**
   ```bash
   git clone <repository-url>
   cd stayConnect
   ```

2. **Create environment file:**
   ```bash
   cp .env.docker .env
   ```

3. **Generate APP_KEY for AdonisJS:**
   ```bash
   # Generate a secure 32-character key
   openssl rand -base64 32
   ```
   Update the `APP_KEY` in your `.env` file with the generated key.

4. **Start the application:**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations:**
   ```bash
   docker-compose exec adonis_app node ace migration:run
   ```

6. **Access the application:**
   - Application: http://localhost:3333
   - Database Admin (Adminer): http://localhost:8080

### Development Setup

1. **Use the development compose file:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **The development setup includes:**
   - Hot reloading for code changes
   - Node.js debugger on port 9229
   - Redis for caching
   - Volume mounting for live code editing

## Services

### Production (`docker-compose.yml`)

- **postgres**: PostgreSQL 16 database
- **adonis_app**: AdonisJS application (production build)
- **adminer**: Database administration interface (optional, use `--profile dev`)

### Development (`docker-compose.dev.yml`)

- **postgres**: PostgreSQL 16 database (development)
- **adonis_dev**: AdonisJS application (development mode with hot reload)
- **adminer**: Database administration interface
- **redis**: Redis cache server

## Environment Variables

### Required Variables

- `APP_KEY`: 32-character secret key for AdonisJS
- `DB_PASSWORD`: Database password
- `DB_USER`: Database username
- `DB_DATABASE`: Database name

### Optional Variables

- `SPOTIFY_CLIENT_ID`: Spotify API client ID
- `SPOTIFY_CLIENT_SECRET`: Spotify API client secret
- `SMTP_*`: Email configuration
- `REDIS_*`: Redis configuration

## Common Commands

### Production

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Run migrations
docker-compose exec adonis_app node ace migration:run

# Access application shell
docker-compose exec adonis_app sh
```

### Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View application logs
docker-compose -f docker-compose.dev.yml logs -f adonis_dev

# Install new npm packages
docker-compose -f docker-compose.dev.yml exec adonis_dev npm install <package>

# Run tests
docker-compose -f docker-compose.dev.yml exec adonis_dev npm test

# Access development shell
docker-compose -f docker-compose.dev.yml exec adonis_dev sh
```

## Database Management

### Using Adminer

1. Access Adminer at http://localhost:8080
2. Login with:
   - System: PostgreSQL
   - Server: postgres
   - Username: stayconnect_user
   - Password: stayconnect_password
   - Database: stayconnect_db (or stayconnect_dev for development)

### Direct Database Access

```bash
# Connect to PostgreSQL directly
docker-compose exec postgres psql -U stayconnect_user -d stayconnect_db
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3333, 5433, and 8080 are not in use
2. **Permission issues**: Check file permissions and Docker daemon access
3. **Database connection**: Verify database is healthy before starting the app

### Health Checks

```bash
# Check service health
docker-compose ps

# View detailed service status
docker-compose exec postgres pg_isready -U stayconnect_user
```

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs adonis_app
docker-compose logs postgres
```

## Data Persistence

- Database data is persisted in Docker volumes
- Uploaded files are stored in `./stayConnect_adonis/uploads`
- To reset data, remove volumes: `docker-compose down -v`

## Security Notes

- Change default passwords in production
- Use strong APP_KEY
- Configure proper CORS origins
- Use environment-specific configurations
- Keep Docker images updated

## Performance Optimization

- Use multi-stage builds for smaller production images
- Configure resource limits in production
- Use Redis for session storage and caching
- Enable gzip compression
- Configure proper logging levels