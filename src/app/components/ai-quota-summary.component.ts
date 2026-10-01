import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  AiQuotaFeatureStatus,
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
            <p class="text-muted">{{ tierSummary(quota?.tier) }}</p>
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
          @for (item of quotaRows(); track item.feature || $index) {
            <article class="quota-row" [class.exhausted]="state(item) === 'exhausted'">
              <div class="quota-row-head">
                <div>
                  <strong>{{ featureLabel(item.feature) }}</strong>
                  <small class="text-muted">{{ windowLabel(item.window) }}</small>
                </div>
                <span class="quota-badge" [class.warning]="state(item) === 'near'" [class.danger]="state(item) === 'exhausted'">
                  {{ remainingLabel(item) }}
                </span>
              </div>

              @if (!isUnlimited(item)) {
                <div class="quota-numbers">
                  <span>
                    <strong>{{ numberLabel(item.used) }}</strong>
                    <small class="text-muted">used this week</small>
                  </span>
                  <span>
                    <strong>{{ limitLabel(item.weeklyLimit) }}</strong>
                    <small class="text-muted">weekly limit</small>
                  </span>
                </div>

                <div class="quota-progress" aria-hidden="true">
                  <span [style.width.%]="usedPercent(item)"></span>
                </div>
              }
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

  quotaRows(): AiQuotaFeatureStatus[] {
    const features = this.quota?.features ?? [];
    const order = [
      'SPEAKING',
      'LISTENING',
      'IMAGE_DESCRIPTION',
      'VOCABULARY',
      'TOPIC_EXERCISE',
    ];

    return [...features].sort((left, right) => {
      const leftIndex = order.indexOf(left.feature?.toUpperCase() ?? '');
      const rightIndex = order.indexOf(right.feature?.toUpperCase() ?? '');

      return this.sortIndex(leftIndex) - this.sortIndex(rightIndex);
    });
  }

  featureLabel(feature: string | undefined): string {
    return this.fallbackLabel(feature || 'Practice');
  }

  tierSummary(tier: string | undefined): string {
    const label = this.fallbackLabel(tier || 'Current');
    return tier?.toUpperCase() === 'PREMIUM'
      ? `${label} plan · Unlimited practice`
      : `${label} plan · Weekly limits`;
  }

  windowLabel(window: string | undefined): string {
    const normalized = window?.toUpperCase();

    if (
      this.quota?.tier?.toUpperCase() === 'PREMIUM' ||
      normalized === 'UNLIMITED'
    ) {
      return 'Unlimited practice';
    }

    return 'Weekly allowance';
  }

  remainingLabel(item: AiQuotaFeatureStatus): string {
    if (this.isUnlimited(item)) {
      return 'Unlimited';
    }

    if (item.remaining === undefined || item.remaining === null) {
      return 'Left not available';
    }

    return `${this.numberLabel(item.remaining)} left`;
  }

  limitLabel(limit: number | null | undefined): string {
    return limit === undefined || limit === null ? 'Unlimited' : this.numberLabel(limit);
  }

  numberLabel(value: number | null | undefined): string {
    return value === undefined || value === null
      ? '0'
      : new Intl.NumberFormat().format(value);
  }

  usedPercent(item: AiQuotaFeatureStatus): number {
    const used = item.used ?? 0;
    const limit = item.weeklyLimit ?? 0;

    if (limit <= 0) {
      return typeof item.remaining === 'number' && item.remaining <= 0 ? 100 : 0;
    }

    return Math.min(100, Math.max(0, Math.round((used / limit) * 100)));
  }

  state(item: AiQuotaFeatureStatus): QuotaState {
    if (this.isUnlimited(item)) {
      return 'normal';
    }

    if (typeof item.remaining === 'number' && item.remaining <= 0) {
      return 'exhausted';
    }

    return this.usedPercent(item) >= 80 ? 'near' : 'normal';
  }

  isUnlimited(item: AiQuotaFeatureStatus): boolean {
    return (
      this.quota?.tier?.toUpperCase() === 'PREMIUM' ||
      item.window?.toUpperCase() === 'UNLIMITED'
    );
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
