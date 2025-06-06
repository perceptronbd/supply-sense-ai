// Test JWT token and CurrentUser decorator
import * as jwt from 'jsonwebtoken';

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im1hbmFnZXIuYUBzdXBwbHljaGFpbi5jb20iLCJzdWIiOiI4NzBmYWZlNS01YWRmLTQ1OTMtODk5OC02NWMxOTYwNmFkZTkiLCJyb2xlIjoiQlJBTkNIX01BTkFHRVIiLCJmaXJzdE5hbWUiOiJBbGljZSIsImxhc3ROYW1lIjoiTWFuYWdlciIsImlhdCI6MTc0OTIzMDYyMywiZXhwIjoxNzQ5MzE3MDIzfQ.B2ITanG7UcQztBVn2249nRzBWqL5NJJDrwfqJZDPPmc';

try {
  // Verify without validating signature since we don't have the secret
  const decoded = jwt.decode(token);
  console.log('Decoded token:', JSON.stringify(decoded, null, 2));
} catch (error) {
  console.error('Error decoding token:', error);
}
