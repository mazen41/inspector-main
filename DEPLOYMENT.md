# Car Inspector Dashboard - Deployment Guide

This document provides comprehensive instructions for deploying the Car Inspector Dashboard in various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Build Process](#build-process)
- [Deployment Methods](#deployment-methods)
- [Production Considerations](#production-considerations)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher (or yarn/pnpm equivalent)
- **Docker**: Version 20.x or higher (for containerized deployment)
- **Web Server**: Nginx, Apache, or similar (for static hosting)

### Development Tools

```bash
# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Environment Configuration

### 1. Environment Variables

Copy the example environment file and configure for your environment:

```bash
# For development
cp .env.example .env

# For production
cp .env.example .env.production
```

### 2. Required Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_BASE_URL` | Laravel API base URL | Yes | `http://localhost:8000` |
| `VITE_API_VERSION` | API version | Yes | `v1` |
| `VITE_APP_NAME` | Application name | Yes | `Car Inspector Dashboard` |
| `VITE_APP_VERSION` | Application version | Yes | `1.0.0` |

### 3. Environment-Specific Configuration

#### Development
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_DEV_MODE=true
VITE_DEBUG=true
VITE_SHOW_DEV_TOOLS=true
```

#### Staging
```bash
VITE_API_BASE_URL=https://staging-api.samh.com
VITE_DEV_MODE=false
VITE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

#### Production
```bash
VITE_API_BASE_URL=https://api.samh.com
VITE_DEV_MODE=false
VITE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

## Build Process

### 1. Install Dependencies

```bash
# Install production dependencies
npm ci --only=production

# Or install all dependencies (for development)
npm install
```

### 2. Build Commands

```bash
# Development build
npm run build

# Production build
npm run build:prod

# Staging build
npm run build:staging

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

### 3. Build Output

The build process creates a `dist/` directory with:
- `index.html` - Main HTML file
- `assets/` - JavaScript, CSS, and other static assets
- Optimized and minified files for production

## Deployment Methods

### Method 1: Static File Hosting

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name inspector.samh.com;
    root /var/www/car-inspector-dashboard/dist;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName inspector.samh.com
    DocumentRoot /var/www/car-inspector-dashboard/dist
    
    # Handle client-side routing
    <Directory "/var/www/car-inspector-dashboard/dist">
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Cache static assets
    <LocationMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </LocationMatch>
</VirtualHost>
```

### Method 2: Docker Deployment

#### Build Docker Image

```bash
# Build production image
docker build -t car-inspector-dashboard:latest .

# Build with specific build mode
docker build --build-arg BUILD_MODE=production -t car-inspector-dashboard:prod .
```

#### Run Container

```bash
# Run production container
docker run -d \
  --name car-inspector-dashboard \
  -p 80:80 \
  --restart unless-stopped \
  car-inspector-dashboard:latest

# Run with environment variables
docker run -d \
  --name car-inspector-dashboard \
  -p 80:80 \
  -e VITE_API_BASE_URL=https://api.samh.com \
  --restart unless-stopped \
  car-inspector-dashboard:latest
```

#### Docker Compose

```bash
# Development
docker-compose --profile dev up -d

# Production
docker-compose --profile prod up -d

# View logs
docker-compose logs -f car-inspector-dashboard
```

### Method 3: Cloud Deployment

#### AWS S3 + CloudFront

```bash
# Build for production
npm run build:prod

# Sync to S3 bucket
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

#### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

## Production Considerations

### 1. Performance Optimization

- **Code Splitting**: Enabled by default in Vite configuration
- **Asset Optimization**: Images and fonts are optimized during build
- **Caching Strategy**: Configure appropriate cache headers for static assets
- **CDN**: Use a CDN for global content delivery

### 2. Security

#### Content Security Policy (CSP)

```nginx
add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https: wss:;
    frame-ancestors 'none';
" always;
```

#### HTTPS Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name inspector.samh.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
}
```

### 3. Environment Validation

The application includes environment validation that runs on startup:

```typescript
import { validateEnvironment } from './utils/env';

// Validate environment on app start
validateEnvironment();
```

## Monitoring and Maintenance

### 1. Health Checks

The application provides a health check endpoint:

```bash
# Check application health
curl -f http://localhost/health

# Docker health check
docker exec car-inspector-dashboard curl -f http://localhost/health
```

### 2. Logging

#### Application Logs

```bash
# View Docker logs
docker logs car-inspector-dashboard

# Follow logs
docker logs -f car-inspector-dashboard
```

#### Nginx Logs

```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

### 3. Performance Monitoring

#### Bundle Analysis

```bash
# Analyze bundle size
npm run analyze
```

#### Lighthouse Audit

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://inspector.samh.com --output html --output-path ./lighthouse-report.html
```

### 4. Updates and Maintenance

#### Update Process

```bash
# 1. Backup current deployment
cp -r /var/www/car-inspector-dashboard /var/www/car-inspector-dashboard.backup

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
npm ci --only=production

# 4. Build application
npm run build:prod

# 5. Deploy new build
cp -r dist/* /var/www/car-inspector-dashboard/

# 6. Restart web server
sudo systemctl reload nginx
```

#### Rollback Process

```bash
# Restore from backup
rm -rf /var/www/car-inspector-dashboard
mv /var/www/car-inspector-dashboard.backup /var/www/car-inspector-dashboard

# Restart web server
sudo systemctl reload nginx
```

## Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Clear cache and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18.x or higher
```

#### 2. API Connection Issues

```bash
# Check API endpoint
curl -I https://api.samh.com/health

# Verify environment variables
echo $VITE_API_BASE_URL
```

#### 3. Routing Issues

Ensure your web server is configured to handle client-side routing by serving `index.html` for all routes.

#### 4. CORS Issues

Configure your Laravel API to allow requests from the dashboard domain:

```php
// In Laravel config/cors.php
'allowed_origins' => [
    'https://inspector.samh.com',
    'http://localhost:3000', // For development
],
```

### Debug Mode

Enable debug mode for troubleshooting:

```bash
# Set debug environment variable
VITE_DEBUG=true npm run build
```

### Log Analysis

```bash
# Check for JavaScript errors in browser console
# Check network tab for failed API requests
# Review server logs for 404 or 500 errors
```

## Support

For deployment issues or questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Review application logs
3. Verify environment configuration
4. Contact the development team

## Changelog

- **v1.0.0**: Initial deployment configuration
- **v1.0.1**: Added Docker support and improved security headers
- **v1.0.2**: Enhanced monitoring and health checks