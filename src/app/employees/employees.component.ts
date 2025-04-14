import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { addDays, format } from 'date-fns';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule, NzDatePickerSizeType } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTableModule } from 'ng-zorro-antd/table';
import { BehaviorSubject, Observable, Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, takeUntil } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { IEmployee } from '../../models/employee';
import { IEmployeeLeave } from '../../models/employee-leave';
import { IUpsertLeaveRequest } from '../../models/upsert-leave-request';
import { IUpsertLeaveResponse } from '../../models/upsert-leave-response';
import { EmployeeApiService } from '../api/services/employee-api.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { LeaveComponent } from './leave/leave.component';

@Component({
  selector: 'app-employees',
  imports: [
    NzTableModule,
    NzButtonModule,
    NzDividerModule,
    CommonModule,
    FormsModule,
    NzInputModule,
    NzPopconfirmModule,
    NzDatePickerModule,
    NzIconModule,
    LeaveComponent
  ],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent implements OnInit, OnDestroy {

  constructor(private _messageService: NzMessageService) {
  }

  /********* Private variables *********/

  private readonly _employeeApiService = inject(EmployeeApiService);
  private _employeesWithLeavesSubject = new BehaviorSubject<IEmployee[] | null>(null);
  private readonly destroy$ = new Subject<void>();
  private _disabledButtonIds: string[] = [];
  private _searchTerms$ = new Subject<string>();
  private readonly Error = 'error';

  /************************************/

  /********* Public variables *********/

  public employeesWithLeaves: IEmployee[] | undefined;
  public expandSet = new Set<string>();
  public employeesWithLeaves$: Observable<IEmployee[] | null> = this._employeesWithLeavesSubject.asObservable();
  public editCache: { [key: string]: { edit: boolean; data: IEmployeeLeave } } = {};
  public size: NzDatePickerSizeType = 'large';
  public searchTerm: string = '';

  /************************************/


  /********* Hooks *********/

  ngOnInit(): void {
    this._employeeApiService.getEmployeesWithLeaves('').pipe(takeUntil(this.destroy$)).subscribe(data => {
      this._employeesWithLeavesSubject.next(data);
      this.updateEditCache();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._employeesWithLeavesSubject.complete();
  }

  /************************************/


  /********* Public methods *********/

  handleDeleteLeave(event: { leaveId: string; employeeId: string }) {
    this.deleteLeave(event.leaveId, event.employeeId);
  }

  handleStartEdit(leaveId: string) {
    this.startEdit(leaveId);
  }

  isDateRangeValid(leaveId: string): boolean {
    const dateRange = this.editCache[leaveId]?.data.dateRange;
    return dateRange && dateRange[0] instanceof Date && dateRange[1] instanceof Date;
  }

  searchEmployees(searchTerm: string): Observable<IEmployee[]> {
    return this._employeeApiService.getEmployeesWithLeaves(searchTerm);
  }

  onSearchChange(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this._searchTerms$.next(searchTerm);
  }

  onChange(result: Date[], leaveId: string): void {
  }

  addLeave(employeeId: string) {
    const employeesWithLeaves = this._employeesWithLeavesSubject.getValue();
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const newLeaveId = this.generateGUIDFunc();
    const updatedEmployees = employeesWithLeaves?.map(employee => {
      if (employee.employeeId === employeeId) {
        const newLeave: IEmployeeLeave = {
          createdOn: '',
          employeeId: employeeId,
          endDate: format(tomorrow, "yyyy-MM-dd'T'HH:mm:ss"),
          leaveId: newLeaveId,
          startDate: format(today, "yyyy-MM-dd'T'HH:mm:ss"),
          updatedBy: 'User',
          updatedOn: '',
          dateRange: [today, tomorrow],
        };
        employee.leavesCount = employee.leavesCount + 1;
        const updatedEmployeeLeaves = [...employee.employeeLeaves, newLeave];
        return { ...employee, employeeLeaves: updatedEmployeeLeaves };
      }
      return employee;
    });
    if (updatedEmployees) {
      this._employeesWithLeavesSubject.next(updatedEmployees);
      this.updateEditCache();
      this.onExpandChange(employeeId, true);
      this.startEdit(newLeaveId);
      this._disabledButtonIds.push(employeeId);
    }
  }

  isButtonDisabled(employeeId: string): boolean {
    return this._disabledButtonIds.includes(employeeId);
  }

  enableButton(employeeId: string): void {
    this._disabledButtonIds = this._disabledButtonIds.filter(id => id !== employeeId);
  }

  disableButton(employeeId: string): void {
    if (!this._disabledButtonIds.includes(employeeId)) {
      this._disabledButtonIds.push(employeeId);
    }
  }

  onExpandChange(employeeId: string, checked: boolean): void {
    if (checked) {
      this.expandSet.add(employeeId);
    } else {
      this.expandSet.delete(employeeId);
    }
  }

  startEdit(leaveId: string): void {
    this.editCache[leaveId].edit = true;
  }

  cancelEdit(leaveId: string, employeeId: string): void {
    this.enableButton(employeeId);
    this.editCache[leaveId].edit = false;
    const employeesWithLeaves = this._employeesWithLeavesSubject.getValue();
    employeesWithLeaves?.forEach(employee => {
      const foundLeave = employee.employeeLeaves.find(leave => leave.leaveId === leaveId && leave.createdOn === '');
      if (foundLeave) {
        this.adjustEmployeeLeavesOnDelete(leaveId, employee.employeeId);
      }
    });
  }

  saveEdit(leaveId: string, employeeId: string): void {
    if (this.editCache[leaveId].data.dateRange[0] == undefined || this.editCache[leaveId].data.dateRange[1] == undefined) {
      this._messageService.create(this.Error, 'Invalid Start or End Date');
      return;
    }
    let updatedStartDate = format((new Date(this.editCache[leaveId].data.dateRange[0])), "yyyy-MM-dd'T'HH:mm:ss");
    let updatedEndDate = format((new Date(this.editCache[leaveId].data.dateRange[1])), "yyyy-MM-dd'T'HH:mm:ss");

    let upsertLeave: IUpsertLeaveRequest = {
      employeeId: employeeId,
      employeeLeaveId: leaveId,
      startDate: updatedStartDate,
      endDate: updatedEndDate,
      updatedBy: 'User'
    };
    this._employeeApiService.upsertLeave(upsertLeave).pipe(takeUntil(this.destroy$)).subscribe((data: IUpsertLeaveResponse) => {
      if (data) {
        const employeesWithLeaves = this._employeesWithLeavesSubject.getValue();
        employeesWithLeaves?.forEach(employee => {
          employee.employeeLeaves.forEach(leave => {
            if (leave.leaveId == leaveId) {
              leave.startDate = data.startDate,
                leave.endDate = data.endDate,
                leave.updatedBy = data.updatedBy,
                leave.updatedOn = data.updatedOn,
                leave.createdOn = data.createdOn
            }
          })
        });
        employeesWithLeaves?.forEach(employee => {
          if (employee.employeeId == employeeId) {
            employee.numberOfDays = this.calculateNumberOfDays(employee.employeeLeaves),
              employee.leavesCount = employee.employeeLeaves.length
          }
        });
        this._employeesWithLeavesSubject.next(employeesWithLeaves);
        this.updateEditCache();
        this.enableButton(employeeId);
        this._messageService.create('success', 'Leave has been added/updated successfully !');
      }
    });

  }

  updateEditCache(): void {
    const employeesWithLeaves = this._employeesWithLeavesSubject.getValue();
    employeesWithLeaves?.forEach(employee => {
      employee.employeeLeaves.forEach(leave => {
        this.editCache[leave.leaveId] = {
          edit: this.editCache[leave.leaveId]?.edit != undefined ? this.editCache[leave.leaveId].edit : false,
          data: { ...leave, dateRange: [new Date(leave.startDate), new Date(leave.endDate)] },
        };
      });
    });
  }

  deleteLeave(leaveId: string, employeeId: string): void {
    this._employeeApiService.deleteLeave(leaveId).subscribe(data => {
      if (data > 0) {
        this.adjustEmployeeLeavesOnDelete(leaveId, employeeId);
        this._messageService.create('success', 'Leave deleted successfully !');
      }
    });
  }

  /************************************/

  /********* Private methods *********/

  private adjustEmployeeLeavesOnDelete(leaveId: string, employeeId: string): void {
    const employeesWithLeaves = this._employeesWithLeavesSubject.getValue();
    const updatedEmployeesWithLeaves = employeesWithLeaves?.map(employee => {
      if (employee.employeeId == employeeId) {
        const updatedLeaves = employee.employeeLeaves.filter(leave => leave.leaveId != leaveId);
        return {
          ...employee,
          employeeLeaves: updatedLeaves,
          leavesCount: updatedLeaves.length,
          numberOfDays: this.calculateNumberOfDays(updatedLeaves),
        };
      }
      return employee;
    });
    if (updatedEmployeesWithLeaves) {
      this._employeesWithLeavesSubject.next(updatedEmployeesWithLeaves);
    }
  }

  private calculateNumberOfDays(leaves: IEmployeeLeave[]): number {
    return leaves.reduce((acc, leave) => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const diffInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return acc + diffInDays;
    }, 0);
  }

  private generateGUIDFunc(): string {
    return uuidv4();
  }

  /************************************/
}
