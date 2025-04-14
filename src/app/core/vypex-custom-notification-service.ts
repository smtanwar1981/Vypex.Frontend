import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class CustomNotificationService {
    showError(message: string): void {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = `Error: ${message}`;
        errorDiv.style.backgroundColor = '#f44336';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '16px';
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '20px';
        errorDiv.style.left = '20px';
        errorDiv.style.zIndex = '9999'; // Ensure it's on top
        document.body.appendChild(errorDiv);
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                document.body.removeChild(errorDiv);
            }
        }, 3000);
    }

    showSuccess(message: string): void {
        const successDiv = document.createElement('div');
        successDiv.textContent = `Success: ${message}`;
        successDiv.style.backgroundColor = '#4CAF50';
        successDiv.style.color = 'white';
        successDiv.style.padding = '16px';
        successDiv.style.position = 'fixed';
        successDiv.style.top = '60px';
        successDiv.style.left = '20px';
        successDiv.style.zIndex = '9999'; // Ensure it's on top
        document.body.appendChild(successDiv);
        setTimeout(() => {
            if (document.body.contains(successDiv)) {
                document.body.removeChild(successDiv);
            }
        }, 3000);
    }
}
