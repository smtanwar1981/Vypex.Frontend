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
import { BehaviorSubject, Observable, Subject, catchError, combineLatest, debounceTime, distinctUntilChanged, of, switchMap, takeUntil, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { IEmployee } from '../../models/employee';
import { IEmployeeLeave } from '../../models/employee-leave';
import { IUpsertLeaveRequest } from '../../models/upsert-leave-request';
import { IUpsertLeaveResponse } from '../../models/upsert-leave-response';
import { EmployeeApiService } from '../api/services/employee-api.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { LeaveComponent } from './leave/leave.component';
import { AppStateService } from '../core/state.service';

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

  constructor(
    private _messageService: NzMessageService,
    private cdr: ChangeDetectorRef) {
  }

  /********* Private variables *********/

  private readonly _employeeApiService = inject(EmployeeApiService);
  private readonly _appStateService = inject(AppStateService);
  private readonly destroy$ = new Subject<void>();
  private _disabledButtonIds: string[] = [];
  private _searchTerms$ = new Subject<string>();
  private readonly Error = 'error';

  /************************************/

  /********* Public variables *********/

  public employeesWithLeaves: IEmployee[] | undefined;
  public expandSet = new Set<string>();
  public editCache: { [key: string]: { edit: boolean; data: IEmployeeLeave } } = {};
  public size: NzDatePickerSizeType = 'large';
  public searchTerm: string = '';

  /************************************/


  /********* Hooks *********/

  ngOnInit(): void {
    this.subscribeToAppState();
    this.subscribeToSearch();    
    this.initialHydration();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /************************************/


  /********* Public methods *********/

  onSearchInput(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
    this._searchTerms$.next(searchTerm);
  }

  addLeave(employeeId: string) {
    const employeesWithLeaves = this.employeesWithLeaves;
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
      this._appStateService.setEmployeesWithLeaves(updatedEmployees);
      this.updateEditCache();
      this._appStateService.setExpandChange(employeeId, true);
      this._appStateService.editRow(newLeaveId);
      this._appStateService.setDisableButtonIds(employeeId);
    }
  }

  isButtonDisabled(employeeId: string): boolean {
    return this._disabledButtonIds.includes(employeeId);
  }

  onExpandChange(employeeId: string, checked: boolean): void {
    this._appStateService.setExpandChange(employeeId, checked);
  }

  cancelEdit(leaveId: string, employeeId: string): void {
    this._appStateService.resetDisableButtonsIds(employeeId);    
    this._appStateService.cancelEditRow(leaveId);
    this.employeesWithLeaves?.forEach(employee => {
      const foundLeave = employee.employeeLeaves.find(leave => leave.leaveId === leaveId && leave.createdOn === '');
      if (foundLeave) {
        this._appStateService.adjustEmployeeLeavesOnDelete(leaveId, employee.employeeId);
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
        const employeesWithLeaves = this.employeesWithLeaves;
        this.employeesWithLeaves?.forEach(employee => {
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
        if(employeesWithLeaves)
        this._appStateService.setEmployeesWithLeaves(employeesWithLeaves);
        this._appStateService.cancelEditRow(leaveId);
        this._appStateService.resetDisableButtonsIds(employeeId);
        this._messageService.create('success', 'Leave has been added/updated successfully !');
      }
    });
  }

  updateEditCache(): void {
    this.employeesWithLeaves?.forEach(employee => {
      employee.employeeLeaves.forEach(leave => {
        this.editCache[leave.leaveId] = {
          edit: this.editCache[leave.leaveId]?.edit != undefined ? this.editCache[leave.leaveId].edit : false,
          data: { ...leave, dateRange: [new Date(leave.startDate), new Date(leave.endDate)] },
        };
        this._appStateService.setEditCache(this.editCache);
      });
    });
  }

  deleteLeave(leaveId: string, employeeId: string): void {
    this._employeeApiService.deleteLeave(leaveId).subscribe(data => {
      if (data > 0) {
        this._appStateService.adjustEmployeeLeavesOnDelete(leaveId, employeeId);
        this._messageService.create('success', 'Leave deleted successfully !');
      }
    });
  }

  /************************************/

  /********* Private methods *********/

  private initialHydration() {
    this._employeeApiService.getEmployeesWithLeaves('').subscribe((response) => {
      if (response) {
        this._appStateService.setEmployeesWithLeaves(response);
      }
    });
  }

  private subscribeToSearch() {
    this._searchTerms$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((searchTerm: string) => {
        return this._employeeApiService.getEmployeesWithLeaves(searchTerm).pipe(
          catchError((error) => {
            console.error('Error fetching employees:', error);
            return of([]);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((response) => {
      this._appStateService.setEmployeesWithLeaves(response);
    });
  }

  private subscribeToAppState() {
    combineLatest([
      this._appStateService.getEmployeesWithLeavesSub(),
      this._appStateService.getDisableButtonIdsSub(),
      this._appStateService.getExpandChangeSub(),
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe(([employeesData, disabledButtonIdsValue, expandData]) => {
      if (employeesData.length > 0) {
        this.employeesWithLeaves = employeesData;
        this.updateEditCache();
      }
      this._disabledButtonIds = disabledButtonIdsValue;
      if (expandData) {
        if (expandData.checked) {
          this.expandSet.add(expandData.employeeId);
        } else {
          this.expandSet.delete(expandData.employeeId);
        }
      }
      this.cdr.detectChanges();
    });
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
