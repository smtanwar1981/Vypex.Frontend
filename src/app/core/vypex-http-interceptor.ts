import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { VypexLoggingService } from './vypex-logging-service';
import { VypexNotificationService } from './vypex-notification-service';

export const vypexHttpInterceptor: HttpInterceptorFn = (
    request: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const notificationService = inject(VypexNotificationService);
    const loggingService = inject(VypexLoggingService);

    return next(request).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An unexpected error occurred.';

            if (error.error instanceof ErrorEvent) {
                // Client-side or network error
                errorMessage = `Client-side/Network error: ${error.error.message}`;
                loggingService.error('Client-side error:', errorMessage);
            } else {
                // Backend returned an unsuccessful response code
                errorMessage = `Backend returned code ${error.status}, body was: ${JSON.stringify(error.error)}`;
                loggingService.error(`API Error - Status: ${error.status}`, errorMessage);

                // Optionally, you can check the error status and show specific notifications
                if (error.status === 401) {
                    notificationService.showError('Unauthorized. Please log in again.');
                    // Optionally, redirect to the login page
                } else if (error.status === 404) {
                    notificationService.showError('Resource not found.');
                } else {
                    notificationService.showError('Something went wrong. Please try again later.');
                }
            }

            // Optionally, rethrow the error so components can still handle specific cases
            return throwError(() => error);
        })
    );
};
