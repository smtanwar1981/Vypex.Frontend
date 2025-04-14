import { Component, EventEmitter, Input, OnInit, Output, inject } from "@angular/core";
import { NzPopconfirmModule } from "ng-zorro-antd/popconfirm";
import { IEmployeeLeave } from "../../../models/employee-leave";
import { CommonModule } from '@angular/common';
import { IEmployee } from "../../../models/employee";
import { NzTableModule } from "ng-zorro-antd/table";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzDatePickerModule } from "ng-zorro-antd/date-picker";
import { FormsModule } from "@angular/forms";
import { AppStateService } from "../../core/state.service";

@Component({
    selector: 'app-leave',
    imports: [
        NzTableModule, NzButtonModule, NzPopconfirmModule, NzDatePickerModule, FormsModule, CommonModule
    ],
    templateUrl: './leave.component.html',
    styleUrl: './leave.component.scss'
})
export class LeaveComponent implements OnInit {
    @Input() employee!: IEmployee;
    
    @Input() size: 'large' | 'default' | 'small' = 'default';

    @Output() deleteLeave = new EventEmitter<{ leaveId: string; employeeId: string }>();
    @Output() cancelEdit = new EventEmitter<{ leaveId: string; employeeId: string }>();
    @Output() saveEdit = new EventEmitter<{ leaveId: string; employeeId: string }>();
    @Output() dateChange = new EventEmitter<{ leaveId: string, dateRange: [Date | null, Date | null] }>();

    editCache: { [key: string]: { edit: boolean; data: IEmployeeLeave } } = {};
    
    private readonly _appStateService = inject(AppStateService);

    ngOnInit(): void {
        this._appStateService.getEditCache().subscribe(editCache => {
            this.editCache = editCache
        });
    }

    startEditRow(leaveId: string) {
        this._appStateService.editRow(leaveId);
    }

    isDateRangeValid(leaveId: string): boolean {
        const dateRange = this.editCache[leaveId]?.data.dateRange;
        return dateRange && dateRange[0] instanceof Date && dateRange[1] instanceof Date;
    }

    trackByLeaveId(index: number, leave: IEmployeeLeave): string {
        return leave.leaveId;
    }
}