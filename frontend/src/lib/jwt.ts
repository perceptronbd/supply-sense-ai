/**
 * JWT utility functions for client-side token handling
 */

export interface JWTPayload {
  sub: string; // user id
  username: string; // email
  roles: string[];
  firstName: string;
  lastName: string;
  branchIds: string[];
  companyId: string;
  permissions: string[];
  isSuperAdmin: boolean;
  iat: number;
  exp: number;
}

/**
 * Cross-platform base64url decode function
 * Works in both browser and Node.js environments
 */
function base64urlDecode(str: string): string {
  // Convert base64url to base64
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if necessary
  const padded = base64 + '==='.slice(0, (4 - (base64.length % 4)) % 4);
  if (typeof window !== 'undefined') {
    // Browser environment - use atob
    return atob(padded);
  }

  // Node.js environment - use Buffer
  return Buffer.from(padded, 'base64').toString('utf-8');
}

/**
 * Decode a JWT token without verification (client-side only)
 * Note: This should only be used for extracting payload data, not for security validation
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT structure: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (base64url)
    const payload = parts[1];
    const decodedPayload = base64urlDecode(payload);
    return JSON.parse(decodedPayload) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Extract user information from JWT token
 */
export function getUserFromToken(token: string): {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  branchId: string;
  isActive: boolean;
  companyId: string;
} | null {
  const payload = decodeJWT(token);
  if (!payload) return null;

  return {
    id: payload.sub,
    email: payload.username,
    firstName: payload.firstName,
    lastName: payload.lastName,
    roles: payload.roles,
    permissions: payload.permissions || [],
    branchId: payload.branchIds?.[0] || '', // Use first branch ID as primary branch
    isActive: true, // Assume active if token is valid
    companyId: payload.companyId,
  };
}
