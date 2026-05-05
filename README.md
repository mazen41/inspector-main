# Car Inspector Dashboard

A modern, responsive React SPA dashboard for car inspectors to manage their inspections, track payments, and maintain their profiles. Built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- 🔐 **Secure Authentication** - JWT-based authentication with automatic token refresh
- 📊 **Dashboard Analytics** - Real-time statistics and performance metrics
- 🚗 **Inspection Management** - Complete inspection workflow with photo uploads
- 💰 **Payment Tracking** - Payment history and earnings overview
- 👤 **Profile Management** - Inspector profile and business settings
- 📱 **Responsive Design** - Mobile-first design with accessibility compliance
- ⚡ **Performance Optimized** - Code splitting, lazy loading, and caching
- 🔄 **Real-time Updates** - WebSocket integration for live data updates

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **State Management**: Redux Toolkit with RTK Query
- **Styling**: Tailwind CSS 4.x
- **Routing**: React Router v7
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite with optimized production builds

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- Access to the Laravel API backend

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd car-inspector-dashboard

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Configure environment variables
# Edit .env with your API settings

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Environment Configuration

Configure the following environment variables in your `.env` file:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=v1

# Application Configuration
VITE_APP_NAME="Car Inspector Dashboard"
VITE_APP_VERSION=1.0.0

# Development Configuration
VITE_DEV_MODE=true
VITE_DEBUG=true
```

See `.env.example` for a complete list of available configuration options.

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run build:prod       # Build for production with optimizations
npm run build:staging    # Build for staging environment

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # Run TypeScript type checking

# Preview & Analysis
npm run preview          # Preview production build
npm run analyze          # Analyze bundle size
```

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components (Button, Input, etc.)
│   ├── dashboard/      # Dashboard-specific components
│   ├── inspections/    # Inspection management components
│   ├── payments/       # Payment-related components
│   └── profile/        # Profile management components
├── hooks/              # Custom React hooks
├── pages/              # Route-level page components
├── services/           # API client and utilities
├── store/              # Redux store configuration
│   ├── api/           # RTK Query API slices
│   └── slices/        # Redux slices
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and constants
```

### Code Style and Standards

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Configured with React and TypeScript rules
- **Prettier**: Code formatting (configure in your editor)
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile-First**: Responsive design approach

## Deployment

### Production Build

```bash
# Build for production
npm run build:prod

# Preview production build
npm run preview:prod
```

### Docker Deployment

```bash
# Build Docker image
docker build -t car-inspector-dashboard:latest .

# Run container
docker run -d -p 80:80 --name car-inspector-dashboard car-inspector-dashboard:latest

# Using Docker Compose
docker-compose --profile prod up -d
```

### Static Hosting

The built application can be deployed to any static hosting service:

- **Nginx/Apache**: See `DEPLOYMENT.md` for server configuration
- **AWS S3 + CloudFront**: Static website hosting
- **Netlify/Vercel**: Automatic deployments from Git
- **CDN**: Any CDN that supports SPA routing

## Integration

### Laravel API Integration

The dashboard integrates with a Laravel backend API. Ensure the following endpoints are available:

- Authentication: `/api/inspector/login`, `/api/inspector/logout`
- Dashboard: `/api/inspector/dashboard`
- Inspections: `/api/inspector/inspections/*`
- Payments: `/api/inspector/payments/*`
- Profile: `/api/inspector/profile/*`

See `INTEGRATION.md` for detailed API requirements and setup instructions.

### WebSocket Integration

For real-time updates, configure WebSocket connection:

```bash
VITE_WEBSOCKET_URL=wss://ws.samh.com
VITE_PUSHER_APP_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=your_cluster
```

## Features in Detail

### Authentication
- JWT token-based authentication
- Automatic token refresh
- Secure token storage
- Role-based access control

### Dashboard Analytics
- Monthly inspection statistics
- Earnings tracking and trends
- Performance metrics
- Interactive charts and graphs

### Inspection Management
- Inspection list with filtering and search
- Detailed inspection forms
- Photo upload with progress tracking
- Status management workflow

### Payment Tracking
- Payment history with filtering
- Earnings summary and analytics
- Payment status tracking
- Detailed payment information

### Profile Management
- Personal information management
- Business settings configuration
- Avatar upload
- Password change functionality

## Accessibility Features

- **WCAG 2.1 AA Compliance**: Full accessibility support
- **Keyboard Navigation**: Complete keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and live regions
- **Focus Management**: Logical focus flow and focus trapping
- **High Contrast Support**: Respects user preferences
- **Reduced Motion**: Honors prefers-reduced-motion settings

## Performance Features

- **Code Splitting**: Automatic route-based code splitting
- **Lazy Loading**: Components and routes loaded on demand
- **Image Optimization**: Optimized images and lazy loading
- **Caching Strategy**: Intelligent caching for API responses
- **Bundle Analysis**: Built-in bundle size analysis
- **Service Worker**: Optional offline support

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+
- **Progressive Enhancement**: Graceful degradation for older browsers

## Security

- **Content Security Policy**: Configured CSP headers
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: CSRF token validation
- **Secure Headers**: Security headers configuration
- **HTTPS Enforcement**: HTTPS-only in production

## Documentation

- **[Deployment Guide](DEPLOYMENT.md)**: Comprehensive deployment instructions
- **[Integration Guide](INTEGRATION.md)**: API integration and setup
- **[CORS Fix](CORS_FIX.md)**: CORS configuration troubleshooting

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Run linting and type checking: `npm run lint && npm run type-check`
5. Commit your changes: `git commit -am 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For technical support or questions:

1. Check the documentation in this repository
2. Review the troubleshooting sections in `DEPLOYMENT.md`
3. Contact the development team

## Changelog

### v1.0.0 (Current)
- Initial release with core functionality
- Authentication and authorization
- Dashboard analytics and reporting
- Inspection management workflow
- Payment tracking and history
- Profile management
- Responsive design and accessibility
- Production-ready deployment configuration
