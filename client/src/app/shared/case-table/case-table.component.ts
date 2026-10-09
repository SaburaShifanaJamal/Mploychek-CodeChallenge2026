import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { CaseRecord } from '../../core/models';
import { StatusStampComponent } from '../status-stamp/status-stamp.component';

@Component({
  selector: 'app-case-table',
  standalone: true,
  imports: [DatePipe, StatusStampComponent],
  template: `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Case</th>
            <th scope="col">Candidate</th>
            <th scope="col">Check</th>
            <th scope="col">Status</th>
            <th scope="col">Updated</th>
            @if (showAdminColumns()) {
              <th scope="col">Assigned to</th>
              <th scope="col">Internal note</th>
            }
            @if (editable()) {
              <th scope="col"><span class="sr-only">Actions</span></th>
            }
          </tr>
        </thead>
        <tbody>
          @if (loading()) {
            @for (i of skeletonRows; track i) {
              <tr><td [attr.colspan]="columns()"><span class="skeleton"></span></td></tr>
            }
          } @else {
            @for (c of cases(); track c.id) {
              <tr>
                <td class="id">{{ c.id }}</td>
                <td>{{ c.candidate }}</td>
                <td>{{ c.checkType }}</td>
                <td><app-status-stamp [status]="c.status" /></td>
                <td>{{ c.updatedAt | date: 'd MMM y' }}</td>
                @if (showAdminColumns()) {
                  <td>{{ c.ownerName }}</td>
                  <td class="note">{{ c.internalNote }}</td>
                }
                @if (editable()) {
                  <td class="actions">
                    <button type="button" class="btn small" (click)="edit.emit(c)">Edit</button>
                  </td>
                }
              </tr>
            } @empty {
              <tr><td [attr.colspan]="columns()" class="empty">{{ emptyText() }}</td></tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left;
      padding: 0.65rem 0.75rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--ink-soft);
      border-bottom: 2px solid var(--ink);
      white-space: nowrap;
    }
    td { padding: 0.75rem; border-bottom: 1px solid var(--line); vertical-align: top; }
    tbody tr:last-child td { border-bottom: 0; }
    .id { font-weight: 700; white-space: nowrap; }
    .note { max-width: 20rem; color: var(--ink-soft); }
    .empty { text-align: center; padding: 2rem 1rem; color: var(--ink-soft); }
    .actions { text-align: right; white-space: nowrap; }
    .btn.small { padding: 0.25rem 0.65rem; font-size: 0.85rem; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  `]
})
export class CaseTableComponent {
  cases = input.required<CaseRecord[]>();
  loading = input(false);
  showAdminColumns = input(false);
  editable = input(false);
  emptyText = input('No cases to show.');

  edit = output<CaseRecord>();

  skeletonRows = [1, 2, 3, 4, 5];
  columns = computed(() => 5 + (this.showAdminColumns() ? 2 : 0) + (this.editable() ? 1 : 0));
}