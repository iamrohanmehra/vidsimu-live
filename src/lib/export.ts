import type { SessionExport } from '@/types';

/**
 * Sanitize admin input for use as a filename.
 * - Lowercase
 * - Replace spaces with hyphens
 * - Replace | with underscore
 * - Remove unsafe characters
 */
export function sanitizeFilename(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // spaces -> hyphens
    .replace(/\|/g, '_')            // pipe -> underscore
    .replace(/[/:?#[\]*<>\\]/g, '') // remove unsafe chars
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .replace(/^-|-$/g, '');         // trim leading/trailing hyphens
}

/**
 * Generate full export filename with timestamp.
 * Format: {sanitized-name}_{YYYY-MM-DD}_{HH-MM}.json
 */
export function generateExportFilename(exportName: string, date: Date = new Date()): string {
  const sanitized = sanitizeFilename(exportName);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${sanitized}_${year}-${month}-${day}_${hours}-${minutes}.json`;
}

/**
 * Format display name for UI (human-readable).
 * Format: "{name} — {date}, {time}"
 */
export function formatDisplayName(exportName: string, date: Date = new Date()): string {
  const dateStr = date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  return `${exportName} — ${dateStr}, ${timeStr}`;
}

/**
 * Trigger browser download of JSON data.
 */
export function downloadJSON(data: SessionExport, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Parse uploaded JSON file into SessionExport.
 * Returns null if parsing fails or structure is invalid.
 */
export async function parseExportFile(file: File): Promise<SessionExport | null> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Basic validation
    if (
      data.version === '1.0' &&
      data.session &&
      Array.isArray(data.messages) &&
      Array.isArray(data.participants) &&
      Array.isArray(data.polls)
    ) {
      return data as SessionExport;
    }
    
    console.warn('[Export] Invalid export structure');
    return null;
  } catch (error) {
    console.error('[Export] Failed to parse file:', error);
    return null;
  }
}
