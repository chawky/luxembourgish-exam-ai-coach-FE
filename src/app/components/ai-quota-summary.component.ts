import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  AiQuotaCategoryStatus,
  AiQuotaStatus,
} from '../services/ai-quota.service';

type QuotaState = 'normal' | 'near' | 'exhausted';

@Component({
  selector: 'app-ai-quota-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card card-pad quota-card">
      <div class="quota-head">
        <div>
          <h2 class="card-title">{{ title }}</h2>
          @if (quota?.tier) {
            <p class="text-muted">{{ tierLabel(quota?.tier) }} plan limits</p>
          } @else {
            <p class="text-muted">{{ subtitle }}</p>
          }
        </div>
      </div>

      @if (loading) {
        <p class="text-muted quota-state">Loading usage limits...</p>
      } @else if (error) {
        <p class="quota-error" role="alert">{{ error }}</p>
      } @else if (quotaRows().length) {
        <div class="quota-grid">
          @for (item of quotaRows(); track item.category || $index) {
            <article class="quota-row" [class.exhausted]="state(item) === 'exhausted'">
              <div class="quota-row-head">
                <div>
                  <strong>{{ categoryLabel(item.category) }}</strong>
                  <small class="text-muted">{{ windowLabel(item.window) }}</small>
                </div>
                <span class="quota-badge" [class.warning]="state(item) === 'near'" [class.danger]="state(item) === 'exhausted'">
                  {{ remainingLabel(item) }}
                </span>
              </div>

              <div class="quota-numbers">
                <span>
                  <strong>{{ numberLabel(item.used) }}</strong>
                  <small class="text-muted">used</small>
                </span>
                <span>
                  <strong>{{ limitLabel(item.limit) }}</strong>
                  <small class="text-muted">limit</small>
                </span>
              </div>

              <div class="quota-progress" aria-hidden="true">
                <span [style.width.%]="usedPercent(item)"></span>
              </div>
            </article>
          }
        </div>
      } @else {
        <p class="text-muted quota-state">{{ emptyText }}</p>
      }
    </section>
  `,
  styles: [
    `
      .quota-card {
        margin-bottom: 22px;
        border-radius: 22px;
      }

      .quota-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }

      .quota-head p {
        margin: 4px 0 0;
      }

      .quota-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0;
        border-top: 1px solid var(--border);
      }

      .quota-row {
        border: 0;
        border-bottom: 1px solid var(--border);
        border-radius: 0;
        background: transparent;
        padding: 16px 0;
      }

      .quota-row.exhausted {
        border-color: var(--red);
      }

      .quota-row-head,
      .quota-numbers {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .quota-row-head strong,
      .quota-numbers strong {
        display: block;
        color: var(--blue-900);
      }

      .quota-row-head small,
      .quota-numbers small {
        display: block;
        margin-top: 2px;
      }

      .quota-badge {
        border-radius: 10px;
        background: #143525;
        color: var(--green);
        flex-shrink: 0;
        font-size: 12px;
        font-weight: 700;
        padding: 5px 9px;
      }

      .quota-badge.warning {
        background: #3d2b13;
        color: var(--amber);
      }

      .quota-badge.danger {
        background: var(--red-50);
        color: var(--red);
      }

      .quota-numbers {
        margin-top: 12px;
      }

      .quota-numbers span:last-child {
        text-align: right;
      }

      .quota-progress {
        height: 8px;
        overflow: hidden;
        border-radius: 999px;
        background: var(--slate-200);
        margin-top: 12px;
      }

      .quota-progress span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--blue-700);
      }

      .quota-error {
        color: var(--red);
        margin: 0;
      }

      .quota-state {
        margin: 0;
      }

      @media (min-width: 760px) {
        .quota-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .quota-row {
          padding: 16px;
          border-right: 1px solid var(--border);
        }

        .quota-row:nth-child(even) {
          border-right: 0;
        }
      }
    `,
  ],
})
export class AiQuotaSummaryComponent {
  @Input() quota: AiQuotaStatus | null = null;
  @Input() loading = false;
  @Input() error = '';
  @Input() title = 'AI usage limits';
  @Input() subtitle = 'Your current generated practice usage.';
  @Input() emptyText = 'No usage limits were returned yet.';

  quotaRows(): AiQuotaCategoryStatus[] {
    const categories = this.quota?.categories ?? [];
    const order = ['CHAT', 'TTS', 'STT', 'IMAGE'];

    return [...categories].sort((left, right) => {
      const leftIndex = order.indexOf(left.category?.toUpperCase() ?? '');
      const rightIndex = order.indexOf(right.category?.toUpperCase() ?? '');

      return this.sortIndex(leftIndex) - this.sortIndex(rightIndex);
    });
  }

  categoryLabel(category: string | undefined): string {
    const normalized = category?.toUpperCase();

    if (normalized === 'CHAT') {
      return 'AI practice';
    }

    if (normalized === 'TTS') {
      return 'Audio generation';
    }

    if (normalized === 'STT') {
      return 'Recording evaluation';
    }

    if (normalized === 'IMAGE') {
      return 'Image generation';
    }

    return this.fallbackLabel(category || 'Practice');
  }

  tierLabel(tier: string | undefined): string {
    return this.fallbackLabel(tier || 'Current');
  }

  windowLabel(window: string | undefined): string {
    const normalized = window?.toUpperCase();

    if (normalized === 'DAILY') {
      return 'Daily allowance';
    }

    if (normalized === 'MONTHLY') {
      return 'Monthly allowance';
    }

    return window ? `${this.fallbackLabel(window)} allowance` : 'Current allowance';
  }

  remainingLabel(item: AiQuotaCategoryStatus): string {
    if (item.remaining === undefined) {
      return 'Left not available';
    }

    return `${this.numberLabel(item.remaining)} left`;
  }

  limitLabel(limit: number | undefined): string {
    return limit === undefined ? 'Not set' : this.numberLabel(limit);
  }

  numberLabel(value: number | undefined): string {
    return value === undefined ? '0' : new Intl.NumberFormat().format(value);
  }

  usedPercent(item: AiQuotaCategoryStatus): number {
    const used = item.used ?? 0;
    const limit = item.limit ?? 0;

    if (limit <= 0) {
      return item.remaining !== undefined && item.remaining <= 0 ? 100 : 0;
    }

    return Math.min(100, Math.max(0, Math.round((used / limit) * 100)));
  }

  state(item: AiQuotaCategoryStatus): QuotaState {
    if (item.remaining !== undefined && item.remaining <= 0) {
      return 'exhausted';
    }

    return this.usedPercent(item) >= 80 ? 'near' : 'normal';
  }

  private fallbackLabel(value: string): string {
    return value
      .toLowerCase()
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ');
  }

  private sortIndex(index: number): number {
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  }
}
