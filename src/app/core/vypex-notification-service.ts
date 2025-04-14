import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class VypexNotificationService {
    private errorSubject = new Subject<string>();
    errors$ = this.errorSubject.asObservable();

    showError(message: string): void {
        this.errorSubject.next(message);
    }

    private successSubject = new Subject<string>();
    successes$ = this.successSubject.asObservable();

    showSuccess(message: string): void {
        this.successSubject.next(message);
    }
}
