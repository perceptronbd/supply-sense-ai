/**
 * Centralized tag types for RTK Query cache management
 *
 * This file contains all tag types used across different API slices
 * to ensure consistency and avoid typos in cache invalidation
 */

export const TAG_TYPES = {
  // Authentication
  AUTH: 'Auth',

  // Core Entities
  USER_PROFILE: 'UserProfile',
  USER: 'User',
  ROLE: 'Role',
  PERMISSION: 'Permission',

  // Chat Module
  CHAT_SESSION: 'ChatSession',
  CHAT_MESSAGE: 'ChatMessage',

  // Onboarding
  ONBOARDING: 'Onboarding',

  // Database Connection
  DATABASE_CONNECTION: 'DatabaseConnection',
  // Tables
  GET_SELECTED_ONBOARDING_TABLES: 'GetSelectedOnboardingTables',
  GET_TABLE_RELATIONSHIPS: 'GetTableRelationships',
} as const;

export const TAG_TYPES_LIST = Object.values(TAG_TYPES);

export const TAG_TYPES_KEYS = Object.keys(TAG_TYPES) as (keyof typeof TAG_TYPES)[];

export type TagTypeKeys = (typeof TAG_TYPES_KEYS)[number];
export type TagTypes = (typeof TAG_TYPES)[keyof typeof TAG_TYPES];

/**
 * Helper function to get multiple tag types
 * @param keys - Array of tag type keys
 * @returns Array of tag type values
 */
export function getTagTypes(keys: TagTypeKeys[]): TagTypes[] {
  return keys.map((key) => TAG_TYPES[key]);
}

/**
 * Common tag type combinations for different modules
 */
export const TAG_TYPE_GROUPS = {
  AUTH_MODULE: getTagTypes(['AUTH', 'USER_PROFILE']),

  USER_MODULE: getTagTypes(['USER', 'ROLE', 'PERMISSION']),

  ROLE_MODULE: getTagTypes(['ROLE', 'PERMISSION', 'USER']),

  CHAT_MODULE: getTagTypes(['CHAT_SESSION', 'CHAT_MESSAGE']),
} as const;
