import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IEmployee } from '../../../models/employee';
import { IUpsertLeaveRequest } from '../../../models/upsert-leave-request';
import { IUpsertLeaveResponse } from '../../../models/upsert-leave-response';
import { Employee } from '../models/employee';
import { environment } from '../../../environments/environment'
import { AppStateService } from '../../core/state.service';

@Injectable({ providedIn: 'root' })
export class EmployeeApiService {
  private readonly httpClient = inject(HttpClient);

  private readonly employeeServiceBaseUrl = environment.employeeServiceBaseUrl;
  private readonly _appStateService = inject(AppStateService);

  public getEmployees(): Observable<Array<Employee>> {
    return this.httpClient.get<Array<Employee>>(`${this.employeeServiceBaseUrl}/api/employees`);
  }

  public getEmployeesWithLeaves(searchTerm: string): Observable<IEmployee[]> {
    let apiUrl = `${this.employeeServiceBaseUrl}/Employee/getEmployeesWithLeaves`;
    if(searchTerm)
      apiUrl = `${this.employeeServiceBaseUrl}/Employee/getEmployeesByName/${searchTerm}`
    return this.httpClient.get<IEmployee[]>(apiUrl)
  }

  public getEmployeesWithLeaves2(searchTerm: string) {
    let apiUrl = `${this.employeeServiceBaseUrl}/Employee/getEmployeesWithLeaves`;
    if(searchTerm)
      apiUrl = `${this.employeeServiceBaseUrl}/Employee/getEmployeesByName/${searchTerm}`
    this.httpClient.get<IEmployee[]>(apiUrl).subscribe(response => {
      if (response) {
        this._appStateService.setEmployeesWithLeaves(response);
      }
    });
  }

  public deleteLeave(leaveId: string): Observable<number> {
    return this.httpClient.delete<number>(`${this.employeeServiceBaseUrl}/EmployeeLeave/deleteLeave/${leaveId}`);
  }

  public upsertLeave(request: IUpsertLeaveRequest): Observable<IUpsertLeaveResponse> {
    return this.httpClient.post<IUpsertLeaveResponse>(`${this.employeeServiceBaseUrl}/EmployeeLeave/upsertLeave`, request);
  }
}
