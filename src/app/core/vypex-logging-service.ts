import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class VypexLoggingService {
    log(message: string, ...data: any[]): void {
        console.log(`[INFORMATION] ${new Date().toISOString()} - ${message}`, ...data);
    }

    info(message: string, ...data: any[]): void {
        console.info(`[INFORMATION] ${new Date().toISOString()} - ${message}`, ...data);
    }

    warn(message: string, ...data: any[]): void {
        console.warn(`[WARNING] ${new Date().toISOString()} - ${message}`, ...data);
    }

    error(message: string, ...data: any[]): void {
        console.error(`[ERROR INFORMATION] ${new Date().toISOString()} - ${message}`, ...data);
    }
}
