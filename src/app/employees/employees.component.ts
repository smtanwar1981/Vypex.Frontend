import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { addDays, format } from 'date-fns';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule, NzDatePickerSizeType } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTableModule } from 'ng-zorro-antd/table';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { IEmployee } from '../../models/employee';
import { IEmployeeLeave } from '../../models/employee-leave';
import { IUpsertLeaveRequest } from '../../models/upsert-leave-request';
import { IUpsertLeaveResponse } from '../../models/upsert-leave-response';
import { EmployeeApiService } from '../api/services/employee-api.service';

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
    NzDatePickerModule
  ],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent implements OnInit, OnDestroy {

  constructor(private cdr: ChangeDetectorRef) { }

  public employeesWithLeaves: IEmployee[] | undefined;

  expandSet = new Set<string>();
  private readonly employeeApiService = inject(EmployeeApiService);

  private employeesWithLeavesSubject = new BehaviorSubject<IEmployee[] | null>(null);
  employeesWithLeaves$: Observable<IEmployee[] | null> = this.employeesWithLeavesSubject.asObservable();
  private readonly destroy$ = new Subject<void>();

  editCache: { [key: string]: { edit: boolean; data: IEmployeeLeave } } = {};
  size: NzDatePickerSizeType = 'large';
  disabledButtonIds: string[] = [];

  ngOnInit(): void {
    this.employeeApiService.getEmployeesWithLeaves().pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.employeesWithLeavesSubject.next(data);
      this.updateEditCache();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onChange(result: Date[], leaveId: string): void {
  }

  addLeave(employeeId: string) {
    const employeesWithLeaves = this.employeesWithLeavesSubject.getValue();
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
      this.employeesWithLeavesSubject.next(updatedEmployees);
      this.updateEditCache();
      this.onExpandChange(employeeId, true);
      this.startEdit(newLeaveId);
      this.disabledButtonIds.push(employeeId);
    }
  }

  isButtonDisabled(employeeId: string): boolean {
    return this.disabledButtonIds.includes(employeeId);
  }

  enableButton(employeeId: string): void {
    this.disabledButtonIds = this.disabledButtonIds.filter(id => id !== employeeId);
  }

  disableButton(employeeId: string): void {
    if (!this.disabledButtonIds.includes(employeeId)) {
      this.disabledButtonIds.push(employeeId);
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
    this.adjustEmployeeLeavesOnDelete(leaveId, employeeId);
  }

  saveEdit(leaveId: string, employeeId: string): void {
    let updatedStartDate = format((new Date(this.editCache[leaveId].data.dateRange[0])), "yyyy-MM-dd'T'HH:mm:ss");
    let updatedEndDate = format((new Date(this.editCache[leaveId].data.dateRange[1])), "yyyy-MM-dd'T'HH:mm:ss");

    let upsertLeave: IUpsertLeaveRequest = {
      employeeId: employeeId,
      employeeLeaveId: leaveId,
      startDate: updatedStartDate,
      endDate: updatedEndDate,
      updatedBy: 'User'
    };
    this.employeeApiService.upsertLeave(upsertLeave).pipe(takeUntil(this.destroy$)).subscribe((data: IUpsertLeaveResponse) => {
      if (data) {
        const employeesWithLeaves = this.employeesWithLeavesSubject.getValue();
        employeesWithLeaves?.forEach(employee => {
          employee.employeeLeaves.forEach(leave => {
            if (leave.leaveId == leaveId) {
              leave.startDate = data.startDate,
                leave.endDate = data.endDate,
                leave.updatedBy = data.updatedBy,
                leave.updatedOn = data.updatedOn
            }
          })
        });
        employeesWithLeaves?.forEach(employee => {
          if (employee.employeeId == employeeId) {
            employee.numberOfDays = this.calculateNumberOfDays(employee.employeeLeaves),
              employee.leavesCount = employee.employeeLeaves.length
          }
        });
        this.employeesWithLeavesSubject.next(employeesWithLeaves);
        this.updateEditCache();
        this.enableButton(employeeId);
      }
    });

  }

  updateEditCache(): void {
    const employeesWithLeaves = this.employeesWithLeavesSubject.getValue();
    employeesWithLeaves?.forEach(employee => {
      employee.employeeLeaves.forEach(leave => {
        this.editCache[leave.leaveId] = {
          edit: false,
          data: { ...leave, dateRange: [new Date(leave.startDate), new Date(leave.endDate)] },
        };
      });
    });
  }

  deleteLeave(leaveId: string, employeeId: string): void {
    this.employeeApiService.deleteLeave(leaveId).subscribe(data => {
      if (data > 0) {
        this.adjustEmployeeLeavesOnDelete(leaveId, employeeId);
      }
    });
  }

  private adjustEmployeeLeavesOnDelete(leaveId: string, employeeId: string): void {
    const employeesWithLeaves = this.employeesWithLeavesSubject.getValue();
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
      this.employeesWithLeavesSubject.next(updatedEmployeesWithLeaves);
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
}
