import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  /**
   * Converts an array of objects to a CSV string and triggers a download.
   * @param data The array of data to be exported.
   * @param filename The name for the downloaded file (without extension).
   * @param headers An optional array of keys to determine the column order and inclusion.
   */
  downloadCsv<T extends object>(data: T[], filename: string = 'export', headers?: (keyof T)[]): void {
    if (!data || data.length === 0) {
      // You could add a user-facing notification here, e.g., using a snackbar.
      console.warn('No data available to export.');
      return;
    }

    // Use provided headers or infer from the first object's keys
    const columnHeaders = headers || Object.keys(data[0]) as (keyof T)[];
    const csvContent = this.convertToCsv(data, columnHeaders);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  private convertToCsv<T extends object>(data: T[], headers: (keyof T)[]): string {
    const headerRow = headers.join(',') + '\r\n';

    const rows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        let stringValue = (value === null || value === undefined) ? '' : String(value);

        // Escape double quotes by doubling them as per RFC 4180
        stringValue = stringValue.replace(/"/g, '""');

        // If the value contains a comma, a double quote, or a newline,
        // it must be enclosed in double quotes.
        if (/[",\r\n]/.test(stringValue)) {
          stringValue = `""`;
        }
        return stringValue;
      }).join(',');
    }).join('\r\n');

    return headerRow + rows;
  }
}
