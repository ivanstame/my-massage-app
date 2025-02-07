# Testing and Development Setup

## Testing Strategy

### Unit Tests
- **Test Framework**: Jest
- **Coverage**: Minimum 80% coverage
- **Focus Areas**:
  - Business logic (pricing, availability)
  - Data validation
  - State transitions

### Integration Tests
- **Test Framework**: Jest + Supertest
- **Focus Areas**:
  - API endpoints
  - Database interactions
  - External service integrations (MapService)
  
#### Example Test: Multi-session Booking
```javascript
describe('Booking Flow', () => {
  it('handles multi-session bookings with travel time', async () => {
    // Create test provider
    const provider = await createTestProvider();
    
    // Create test client
    const client = await createTestClient(provider.id);
    
    // Create availability
    await createAvailability(provider.id, '2025-01-25', [
      { start: '09:00', end: '18:00' }
    ]);
    
    // Create booking requests
    const bookings = [
      {
        date: '2025-01-25',
        time: '10:00',
        duration: 60,
        location: '123 Main St'
      },
      {
        date: '2025-01-25',
        time: '11:30', // Includes travel buffer
        duration: 90,
        location: '456 Elm St'
      }
    ];
    
    // Make bulk booking request
    const response = await request(app)
      .post('/api/bookings/bulk')
      .set('Authorization', `Bearer ${client.token}`)
      .send(bookings);
    
    // Assertions
    expect(response.status).toBe(201);
    expect(response.body).toHaveLength(2);
    
    // Verify bookings were created with correct times
    const [firstBooking, secondBooking] = response.body;
    expect(firstBooking.startTime).toBe('10:00');
    expect(secondBooking.startTime).toBe('11:30');
    
    // Verify travel buffer was respected
    const firstEnd = new Date(`2025-01-25T${firstBooking.endTime}`);
    const secondStart = new Date(`2025-01-25T${secondBooking.startTime}`);
    const timeBetween = (secondStart - firstEnd) / (1000 * 60); // minutes
    expect(timeBetween).toBeGreaterThanOrEqual(30); // Minimum buffer
  });
});
```

### End-to-End Tests
- **Test Framework**: Cypress
- **Focus Areas**:
  - User flows (booking, cancellation)
  - Authentication
  - Error scenarios

## Local Development Setup

### Prerequisites
- Node.js v18+
- MongoDB 6.0+
- Redis 7.0+

### Environment Variables
```bash
# .env.example
MONGODB_URI=mongodb://localhost:27017/massage_booking_app
SESSION_SECRET=your-secret-key
GOOGLE_MAPS_API_KEY=your-api-key
PORT=5000
```

### Setup Steps
1. Clone repository
2. Install dependencies
```bash
npm install
```
3. Set up environment variables
```bash
cp .env.example .env
```
4. Start development server
```bash
npm run dev
```
5. Run tests
```bash
npm test
```

## Deployment Requirements

### Production Environment
- **Node.js**: v18 LTS
- **Database**: MongoDB Atlas
- **Cache**: Redis Cloud
- **Storage**: AWS S3

### Configuration
- Enable HTTPS
- Set up rate limiting
- Configure CORS
- Enable logging and monitoring

## Debugging and Maintenance

### First Failure Debugging Checklist
1. **Check Logs**
   - Search for error stack traces
   - Look for recent changes in the logs
   - Check correlation IDs for request tracing

2. **Verify Dependencies**
   - Check database connection status
   - Verify external service availability
   - Confirm required environment variables

3. **Reproduce Issue**
   - Run failing test in isolation
   - Try to reproduce in development environment
   - Check for recent code changes

4. **Analyze Metrics**
   - Check error rate spikes
   - Review response time trends
   - Monitor resource utilization

### CI/CD Pipeline Example
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
    - run: npm ci
    - run: npm test
    - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
    - run: npm ci
    - run: npm run build
    - uses: actions/upload-artifact@v3
      with:
        name: build
        path: build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
    - uses: actions/download-artifact@v3
      with:
        name: build
        path: build
    - run: npm run deploy
```

## Monitoring and Logging

### Key Metrics
- API response times
- Error rates
- Booking success rate
- Resource utilization
- Travel time accuracy
- Multi-session booking success rate

### Metric Implementation
```javascript
// Travel time accuracy
const travelTimeAccuracy = new prometheus.Histogram({
  name: 'travel_time_accuracy_seconds',
  help: 'Difference between predicted and actual travel times',
  labelNames: ['route'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

// Multi-session booking success rate
const multiSessionBookings = new prometheus.Counter({
  name: 'multi_session_bookings_total',
  help: 'Total multi-session booking attempts',
  labelNames: ['sessions', 'success']
});

// Example usage
const recordTravelTime = (predicted, actual, route) => {
  const difference = Math.abs(predicted - actual);
  travelTimeAccuracy.observe({ route }, difference);
};

const recordBookingAttempt = (sessions, success) => {
  multiSessionBookings.inc({ sessions, success: success ? 'true' : 'false' });
};
```

### Tools
- Winston for logging
- Prometheus for metrics
- Grafana for visualization
- Sentry for error tracking
- OpenTelemetry for distributed tracing
