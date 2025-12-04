/**
 * Configuration and constants
 */

export const API_BASE = '';

export const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
