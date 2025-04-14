import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse, HttpStatusCode } from "@angular/common/http";
import { inject } from "@angular/core";
import { NzMessageService } from "ng-zorro-antd/message";
import { Observable, catchError, finalize, tap, throwError } from "rxjs";
import { v4 as uuidv4 } from 'uuid';

export const VypexHttpInterceptor: HttpInterceptorFn = (
    req: HttpRequest<any>,
    next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
    const message = inject(NzMessageService);
    let activeRequests = 0;

    const requestId = uuidv4();
    console.log(`[${requestId}] Request: ${req.method} ${req.url}`);

    activeRequests++;
    if (activeRequests === 1) {
        message.loading('Loading...', { nzDuration: 0 });
    }

    return next(req).pipe(
        tap(
            (event: HttpEvent<any>) => {
                if (event instanceof HttpResponse) {
                    console.log(
                        `[${requestId}] Response: ${req.method} ${req.url}`,
                        event.body
                    );
                    if(event.status == HttpStatusCode.Ok)
                        message.remove();
                }
            },
            (error: any) => {
                if (error instanceof HttpErrorResponse) {
                    console.error(
                        `[${requestId}] Error: ${req.method} ${req.url}`,
                        error
                    );
                    let errorMessage = error.message;
                    if (error.error && error.error.message) {
                        errorMessage = error.error.message;
                    } else if (error.statusText) {
                        errorMessage = error.statusText;
                    } else {
                        errorMessage = "Request Failed"
                    }
                    message.error(`Error: ${errorMessage}`, { nzDuration: 5000 });
                }
            }
        ),
        finalize(() => {
            activeRequests--;
            if (activeRequests === 0) {
                setTimeout(() => {
                    message.remove();
                }, 2000);
            }
        }),
        catchError((error: HttpErrorResponse) => {
            return throwError(error);
        })
    );
};
