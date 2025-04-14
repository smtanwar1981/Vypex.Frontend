import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IEmployee } from '../../../models/employee';
import { IUpsertLeaveRequest } from '../../../models/upsert-leave-request';
import { IUpsertLeaveResponse } from '../../../models/upsert-leave-response';
import { Employee } from '../models/employee';

@Injectable({ providedIn: 'root' })
export class EmployeeApiService {
  private readonly httpClient = inject(HttpClient);

  private readonly baseUrl = 'https://localhost:7189';

  public getEmployees(): Observable<Array<Employee>> {
    return this.httpClient.get<Array<Employee>>(`${this.baseUrl}/api/employees`);
  }

  public getEmployeesWithLeaves(): Observable<IEmployee[]> {
    return this.httpClient.get<IEmployee[]>(`https://localhost:7196/Employee/getEmployeesWithLeaves`)
  }

  public deleteLeave(leaveId: string): Observable<number> {
    return this.httpClient.delete<number>(`https://localhost:7196/EmployeeLeave/deleteLeave/${leaveId}`);
  }

  public upsertLeave(request: IUpsertLeaveRequest): Observable<IUpsertLeaveResponse> {
    return this.httpClient.post<IUpsertLeaveResponse>('https://localhost:7196/EmployeeLeave/upsertLeave', request);
  }
}
