const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log(`Response status: ${res.statusCode}`);
        console.log('Response headers:', res.headers);
        console.log('Response body:', body);
        resolve(body);
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });

    // Add a timeout
    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error('Request timed out'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('Testing GET /test');
    await makeRequest('GET', '/test');

    console.log('\nTesting POST /api/bookings');
    const newBooking = await makeRequest('POST', '/api/bookings', {
      client: {
        name: "John Doe",
        email: "john@example.com",
        phone: "1234567890"
      },
      date: "2023-06-01T10:00:00.000Z",
      duration: 60,
      location: {
        address: "123 Main St, City, Country",
        lat: 40.7128,
        lng: -74.0060
      }
    });

    console.log('\nTesting GET /api/bookings');
    await makeRequest('GET', '/api/bookings');

    if (newBooking) {
      const bookingId = JSON.parse(newBooking)._id;
      console.log(`\nTesting GET /api/bookings/${bookingId}`);
      await makeRequest('GET', `/api/bookings/${bookingId}`);

      console.log(`\nTesting PATCH /api/bookings/${bookingId}`);
      await makeRequest('PATCH', `/api/bookings/${bookingId}`, { status: "confirmed" });

      console.log(`\nTesting DELETE /api/bookings/${bookingId}`);
      await makeRequest('DELETE', `/api/bookings/${bookingId}`);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAPI();