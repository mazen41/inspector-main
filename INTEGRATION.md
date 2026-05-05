# Car Inspector Dashboard - Integration Guide

This document provides detailed instructions for integrating the Car Inspector Dashboard with the Laravel backend API and other systems.

## Table of Contents

- [API Integration](#api-integration)
- [Authentication Flow](#authentication-flow)
- [Data Synchronization](#data-synchronization)
- [WebSocket Integration](#websocket-integration)
- [File Upload Integration](#file-upload-integration)
- [Notification Integration](#notification-integration)
- [Testing Integration](#testing-integration)

## API Integration

### 1. Laravel API Requirements

The dashboard expects the following API endpoints to be available:

#### Authentication Endpoints
```
POST /api/inspector/login
POST /api/inspector/logout  
POST /api/inspector/refresh
GET  /api/inspector/me
```

#### Dashboard Endpoints
```
GET /api/inspector/dashboard
GET /api/inspector/dashboard/analytics
```

#### Inspection Endpoints
```
GET    /api/inspector/inspections
GET    /api/inspector/inspections/{id}
PUT    /api/inspector/inspections/{id}/start
PUT    /api/inspector/inspections/{id}/complete
PUT    /api/inspector/inspections/{id}/cancel
POST   /api/inspector/inspections/{id}/field-values
POST   /api/inspector/inspections/{id}/upload
```

#### Payment Endpoints
```
GET /api/inspector/payments
GET /api/inspector/payments/summary
GET /api/inspector/payments/{id}
```

#### Profile Endpoints
```
GET  /api/inspector/profile
PUT  /api/inspector/profile
PUT  /api/inspector/profile/password
POST /api/inspector/profile/avatar
PUT  /api/inspector/profile/business-settings
```

### 2. API Response Format

All API responses should follow this consistent format:

#### Success Response
```json
{
  "data": {
    // Response data here
  },
  "meta": {
    "current_page": 1,
    "total": 100,
    "per_page": 10
  }
}
```

#### Error Response
```json
{
  "error": {
    "message": "Human readable error message",
    "code": "ERROR_CODE",
    "details": {
      "field": ["Validation error message"]
    }
  }
}
```

### 3. Laravel API Configuration

#### CORS Configuration

Update `config/cors.php`:

```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:3000',
        'https://inspector.samh.com',
        // Add your dashboard domains
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

#### API Rate Limiting

Update `app/Http/Kernel.php`:

```php
protected $middlewareGroups = [
    'api' => [
        'throttle:api',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],
];

protected $routeMiddleware = [
    'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
];
```

Update `config/sanctum.php`:

```php
'middleware' => [
    'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
    'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
],
```

## Authentication Flow

### 1. JWT Token Implementation

The dashboard uses JWT tokens for authentication. Ensure your Laravel API supports:

#### Token Generation
```php
// In your InspectorAuthController
public function login(Request $request)
{
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if (!Auth::attempt($credentials)) {
        return response()->json([
            'error' => [
                'message' => 'Invalid credentials',
                'code' => 'INVALID_CREDENTIALS'
            ]
        ], 401);
    }

    $user = Auth::user();
    
    // Verify user is a car inspector
    if ($user->user_type !== 'car_inspector') {
        return response()->json([
            'error' => [
                'message' => 'Access denied',
                'code' => 'FORBIDDEN'
            ]
        ], 403);
    }

    $token = $user->createToken('inspector-dashboard')->plainTextToken;

    return response()->json([
        'data' => [
            'token' => $token,
            'user' => new InspectorResource($user),
            'expires_in' => config('sanctum.expiration') * 60
        ]
    ]);
}
```

#### Token Validation Middleware
```php
// Create InspectorAuthMiddleware
class InspectorAuthMiddleware
{
    public function handle($request, Closure $next)
    {
        if (!$request->user() || $request->user()->user_type !== 'car_inspector') {
            return response()->json([
                'error' => [
                    'message' => 'Unauthorized',
                    'code' => 'UNAUTHORIZED'
                ]
            ], 401);
        }

        return $next($request);
    }
}
```

### 2. Frontend Token Management

The dashboard automatically handles:
- Token storage in localStorage
- Token refresh before expiration
- Automatic logout on token expiration
- API request authentication headers

## Data Synchronization

### 1. Real-time Updates

For real-time data synchronization, implement WebSocket connections:

#### Laravel Broadcasting Setup
```php
// Install Laravel WebSockets or use Pusher
composer require pusher/pusher-php-server

// Configure broadcasting in config/broadcasting.php
'pusher' => [
    'driver' => 'pusher',
    'key' => env('PUSHER_APP_KEY'),
    'secret' => env('PUSHER_APP_SECRET'),
    'app_id' => env('PUSHER_APP_ID'),
    'options' => [
        'cluster' => env('PUSHER_APP_CLUSTER'),
        'useTLS' => true,
    ],
],
```

#### Broadcast Events
```php
// Create events for real-time updates
class InspectionStatusChanged implements ShouldBroadcast
{
    public $inspection;
    
    public function __construct($inspection)
    {
        $this->inspection = $inspection;
    }
    
    public function broadcastOn()
    {
        return new PrivateChannel('inspector.' . $this->inspection->inspector_id);
    }
    
    public function broadcastAs()
    {
        return 'inspection.status.changed';
    }
}
```

### 2. Data Caching Strategy

Implement caching for frequently accessed data:

```php
// Cache dashboard statistics
public function getDashboardStats($inspectorId)
{
    return Cache::remember("inspector.{$inspectorId}.dashboard", 300, function () use ($inspectorId) {
        return [
            'total_inspections' => $this->getTotalInspections($inspectorId),
            'pending_inspections' => $this->getPendingInspections($inspectorId),
            'completed_inspections' => $this->getCompletedInspections($inspectorId),
            'total_earnings' => $this->getTotalEarnings($inspectorId),
        ];
    });
}
```

## WebSocket Integration

### 1. Frontend WebSocket Setup

The dashboard can connect to WebSocket for real-time updates:

```typescript
// Configure in environment variables
VITE_WEBSOCKET_URL=wss://ws.samh.com
VITE_PUSHER_APP_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=your_cluster
```

### 2. Event Handling

The dashboard listens for these events:
- `inspection.status.changed`
- `inspection.assigned`
- `payment.processed`
- `notification.received`

## File Upload Integration

### 1. Laravel File Upload Configuration

Configure file uploads in your Laravel API:

```php
// config/filesystems.php
'disks' => [
    'inspections' => [
        'driver' => 'local',
        'root' => storage_path('app/public/inspections'),
        'url' => env('APP_URL').'/storage/inspections',
        'visibility' => 'public',
    ],
],

// Validation rules
'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240', // 10MB
'document' => 'required|file|mimes:pdf|max:10240',
```

### 2. Upload Endpoint Implementation

```php
public function uploadInspectionPhoto(Request $request, $inspectionId)
{
    $request->validate([
        'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240',
        'field_id' => 'required|exists:car_inspection_fields,id',
    ]);

    $inspection = CarInspection::where('id', $inspectionId)
        ->where('inspector_id', auth()->id())
        ->firstOrFail();

    $path = $request->file('photo')->store('inspections/' . $inspectionId, 'public');

    // Save to database
    $fieldValue = CarInspectionFieldValue::updateOrCreate([
        'inspection_id' => $inspectionId,
        'field_id' => $request->field_id,
    ], [
        'value' => $path,
        'type' => 'photo',
    ]);

    return response()->json([
        'data' => [
            'path' => $path,
            'url' => Storage::disk('public')->url($path),
            'field_value' => $fieldValue,
        ]
    ]);
}
```

### 3. Frontend Upload Configuration

The dashboard handles file uploads with:
- Progress tracking
- Error handling
- File type validation
- Size limits (configurable via environment variables)

## Notification Integration

### 1. Laravel Notification Setup

Create notifications for inspector events:

```php
class InspectionAssignedNotification extends Notification
{
    public function via($notifiable)
    {
        return ['database', 'mail', 'broadcast'];
    }

    public function toArray($notifiable)
    {
        return [
            'type' => 'inspection_assigned',
            'inspection_id' => $this->inspection->id,
            'message' => 'New inspection assigned',
            'data' => [
                'car' => $this->inspection->car->name,
                'scheduled_at' => $this->inspection->scheduled_at,
            ]
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage([
            'type' => 'inspection_assigned',
            'message' => 'New inspection assigned',
            'data' => $this->toArray($notifiable)['data'],
        ]);
    }
}
```

### 2. Frontend Notification Handling

The dashboard automatically handles:
- Real-time notification display
- Notification history
- Mark as read functionality
- Push notifications (if enabled)

## Testing Integration

### 1. API Testing

Create tests for all inspector endpoints:

```php
class InspectorApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_inspector_can_login()
    {
        $inspector = User::factory()->create([
            'user_type' => 'car_inspector',
            'email' => 'inspector@test.com',
        ]);

        $response = $this->postJson('/api/inspector/login', [
            'email' => 'inspector@test.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'token',
                        'user',
                        'expires_in'
                    ]
                ]);
    }

    public function test_inspector_can_view_dashboard()
    {
        $inspector = User::factory()->create(['user_type' => 'car_inspector']);
        
        $response = $this->actingAs($inspector, 'sanctum')
                        ->getJson('/api/inspector/dashboard');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'overview' => [
                            'total_inspections_this_month',
                            'pending_inspections',
                            'completed_inspections',
                        ]
                    ]
                ]);
    }
}
```

### 2. Frontend Testing

The dashboard includes:
- Component unit tests
- Integration tests for API calls
- E2E tests for critical user flows

## Database Schema Requirements

Ensure your Laravel database includes these tables and relationships:

### Required Tables
- `users` (with `user_type` field for 'car_inspector')
- `car_inspectors` (inspector profile data)
- `car_inspections` (inspection records)
- `car_inspection_fields` (inspection form fields)
- `car_inspection_field_values` (inspection data)
- `car_inspector_payment_history` (payment records)

### Key Relationships
```php
// User model
public function carInspector()
{
    return $this->hasOne(CarInspector::class);
}

// CarInspection model
public function inspector()
{
    return $this->belongsTo(User::class, 'inspector_id');
}

public function fieldValues()
{
    return $this->hasMany(CarInspectionFieldValue::class, 'inspection_id');
}
```

## Security Considerations

### 1. API Security
- Implement rate limiting
- Validate all input data
- Use HTTPS in production
- Implement proper CORS policies
- Sanitize file uploads

### 2. Authentication Security
- Use secure JWT tokens
- Implement token refresh mechanism
- Log authentication attempts
- Implement account lockout policies

### 3. Data Protection
- Encrypt sensitive data
- Implement proper access controls
- Log data access and modifications
- Regular security audits

## Performance Optimization

### 1. API Performance
- Implement database indexing
- Use eager loading for relationships
- Cache frequently accessed data
- Optimize database queries

### 2. Frontend Performance
- Enable code splitting
- Implement lazy loading
- Optimize images and assets
- Use service workers for caching

## Troubleshooting

### Common Integration Issues

1. **CORS Errors**: Verify CORS configuration in Laravel
2. **Authentication Failures**: Check JWT token implementation
3. **File Upload Issues**: Verify file permissions and storage configuration
4. **WebSocket Connection Issues**: Check WebSocket server configuration
5. **API Response Format**: Ensure consistent response format across all endpoints

### Debug Tools

- Laravel Telescope for API debugging
- Browser DevTools for frontend debugging
- Network tab for API request inspection
- Console logs for JavaScript errors

## Support and Maintenance

### Regular Maintenance Tasks
- Monitor API performance
- Update dependencies
- Review security logs
- Backup database regularly
- Test integration points

### Monitoring
- Set up API monitoring
- Monitor error rates
- Track performance metrics
- Set up alerts for critical issues

For additional support, refer to the main deployment documentation or contact the development team.