import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiQuotaSummaryComponent } from '../../components/ai-quota-summary.component';
import { IconComponent } from '../../components/icon.component';
import { friendlyErrorMessage } from '../../error-message';
import { formatPracticeLabel } from '../../practice-options';
import {
  AdminAiUsage,
  AdminAuditLog,
  AdminExerciseConfig,
  AdminExerciseTypeOption,
  AdminLevelOption,
  AdminPrompt,
  AdminService,
  AdminTopicOption,
  AdminUser,
  AdminUserDetail,
  AdminUserProgress,
  PageResponse,
} from '../../services/admin.service';

type AdminSection = 'users' | 'prompts' | 'exercise-config' | 'audit';
type ConfigKind = 'level' | 'topic' | 'type';

@Component({
  selector: 'app-admin-profiles',
  standalone: true,
  imports: [CommonModule, FormsModule, AiQuotaSummaryComponent, IconComponent],
  template: `
    <header class="page-head">
      <div>
        <span class="eyebrow">Admin</span>
        <h1>Admin dashboard</h1>
        <p class="text-muted">
          Manage learner accounts, prompt overlays, exercise options, and audit
          activity from focused sections.
        </p>
      </div>
    </header>

    <nav class="admin-tabs" aria-label="Admin sections">
      <button
        type="button"
        class="admin-tab"
        [class.active]="activeSection() === 'users'"
        (click)="showSection('users')"
      >
        Users
      </button>
      <button
        type="button"
        class="admin-tab"
        [class.active]="activeSection() === 'prompts'"
        (click)="showSection('prompts')"
      >
        Prompts
      </button>
      <button
        type="button"
        class="admin-tab"
        [class.active]="activeSection() === 'exercise-config'"
        (click)="showSection('exercise-config')"
      >
        Exercise config
      </button>
      <button
        type="button"
        class="admin-tab"
        [class.active]="activeSection() === 'audit'"
        (click)="showSection('audit')"
      >
        Audit trail
      </button>
    </nav>

    @if (errorMsg()) {
      <section class="admin-error" role="alert">{{ errorMsg() }}</section>
    }

    @if (activeSection() === 'users') {
      <section class="card card-pad filters">
        <label class="field">
          <span>Search users</span>
          <input
            class="input"
            type="search"
            [(ngModel)]="search"
            placeholder="Search by name or email"
            (keyup.enter)="loadUsers()"
          />
        </label>
        <label class="field compact">
          <span>Status</span>
          <select class="input" [(ngModel)]="statusFilter">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>
        <button class="btn btn-primary" type="button" (click)="loadUsers()">
          <app-icon name="search" [size]="18"></app-icon>
          Search
        </button>
      </section>

      <div class="admin-layout">
        <section class="card users-panel">
          <div class="panel-head">
            <h2>Users</h2>
            <span class="badge">{{ usersPage().totalItems || users().length }}</span>
            <button
              class="btn btn-outline"
              type="button"
              [disabled]="usersLoading()"
              (click)="loadUsers(true)"
            >
              Refresh users
            </button>
          </div>

          @if (usersLoading()) {
            <div class="loading-row">
              <app-icon class="inline-loading-icon" name="sparkles" [size]="18"></app-icon>
              Loading users...
            </div>
          } @else if (users().length) {
            <div class="user-list">
              @for (user of users(); track user.id || user.email) {
                <button
                  type="button"
                  class="user-row"
                  [class.active]="selectedUserId() === user.id"
                  (click)="selectUser(user.id)"
                >
                  <span class="avatar">{{ initials(user) }}</span>
                  <span class="user-main">
                    <strong>{{ displayName(user) }}</strong>
                    <small class="text-muted">{{ user.email }}</small>
                  </span>
                  <span class="user-badges">
                    <span
                      class="badge"
                      [class.badge-red]="user.adminDisabled"
                      [class.badge-amber]="!user.adminDisabled && user.emailVerified === false"
                      [class.badge-green]="!user.adminDisabled && user.emailVerified !== false"
                    >
                      {{ accountStatusLabel(user) }}
                    </span>
                    <span
                      class="badge"
                      [class.badge-green]="isPremium(user)"
                      [class.badge-sky]="!isPremium(user)"
                    >
                      {{ subscriptionPlanLabel(user) }}
                    </span>
                  </span>
                </button>
              }
            </div>
          } @else {
            <div class="empty-state">
              <span class="stat-icon sky">
                <app-icon name="shield" [size]="20"></app-icon>
              </span>
              <h3>No users found</h3>
              <p class="text-muted">Adjust the filters and search again.</p>
            </div>
          }
        </section>

        <section class="detail-stack">
          @if (detailLoading()) {
            <section class="card card-pad loading-panel">
              <span class="stat-icon sky loading-icon">
                <app-icon name="sparkles" [size]="20"></app-icon>
              </span>
              <div>
                <strong>Loading profile...</strong>
                <p class="text-muted">Fetching account, progress, and usage data.</p>
              </div>
            </section>
          } @else {
            @if (detail(); as profile) {
              <section class="card card-pad profile-card">
                <div class="profile-head">
                  <div>
                    <span class="eyebrow">Profile</span>
                    <h2>{{ displayName(profile.user) }}</h2>
                    <p class="text-muted">{{ profile.user?.email }}</p>
                  </div>
                  <span class="profile-badges">
                    <span
                      class="badge"
                      [class.badge-red]="profile.user?.adminDisabled"
                      [class.badge-amber]="!profile.user?.adminDisabled && profile.user?.emailVerified === false"
                      [class.badge-green]="!profile.user?.adminDisabled && profile.user?.emailVerified !== false"
                    >
                      {{ accountStatusLabel(profile.user) }}
                    </span>
                    <span
                      class="badge"
                      [class.badge-green]="isPremium(profile.user)"
                      [class.badge-sky]="!isPremium(profile.user)"
                    >
                      {{ subscriptionPlanLabel(profile.user) }}
                    </span>
                  </span>
                </div>

                <div class="stats-grid">
                  <div class="stat-card">
                    <strong>{{ profile.progress?.totalActivities ?? 0 }}</strong>
                    <span class="text-muted">Generated</span>
                  </div>
                  <div class="stat-card">
                    <strong>{{ profile.progress?.completedActivities ?? 0 }}</strong>
                    <span class="text-muted">Completed</span>
                  </div>
                  <div class="stat-card">
                    <strong>{{ profile.progress?.evaluatedActivities ?? 0 }}</strong>
                    <span class="text-muted">Evaluated</span>
                  </div>
                  <div class="stat-card">
                    <strong>{{ cost(profile.aiUsage?.totalEstimatedCostUsd) }}</strong>
                    <span class="text-muted">Estimated AI cost</span>
                  </div>
                </div>

                <div class="status-actions">
                  <input
                    class="input"
                    [(ngModel)]="statusReason"
                    placeholder="Reason for audit log"
                  />
                  <button
                    class="btn"
                    [class.btn-accent]="!profile.user?.adminDisabled"
                    [class.btn-outline]="profile.user?.adminDisabled"
                    type="button"
                    [disabled]="statusLoading() || deleteLoading()"
                    (click)="toggleStatus(profile)"
                  >
                    {{ profile.user?.adminDisabled ? 'Enable account' : 'Disable account' }}
                  </button>
                </div>

                <div class="danger-zone">
                  <div>
                    <strong>Delete account</strong>
                    <p class="text-muted">
                      Permanently remove this learner and their linked app records.
                    </p>
                  </div>
                  <button
                    class="btn btn-danger"
                    type="button"
                    [disabled]="statusLoading() || deleteLoading()"
                    (click)="deleteAccount(profile)"
                  >
                    {{ deleteLoading() ? 'Deleting...' : 'Delete account' }}
                  </button>
                </div>
              </section>

              <app-ai-quota-summary
                [quota]="profile.aiQuota ?? null"
                title="Learner quota"
                subtitle="Current usage and remaining allowance for this learner."
                emptyText="No quota data was returned for this learner."
              ></app-ai-quota-summary>

              <section class="card card-pad">
                <div class="panel-head">
                  <h2>Recent progress</h2>
                  <span class="badge">{{ progressPage().totalItems || 0 }}</span>
                </div>
                @if (progressItems().length) {
                  <div class="table-list">
                    @for (item of progressItems(); track item.id) {
                      <div class="table-row">
                        <span>
                          <strong>{{ formatLabel(item.exerciseName || item.exerciseType || 'Practice') }}</strong>
                          <small class="text-muted">
                            {{ item.level }} &middot; {{ formatLabel(item.topic || '') }}
                          </small>
                        </span>
                        <span class="badge">{{ formatLabel(item.status || '') }}</span>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-muted">No exercise attempts recorded yet.</p>
                }
              </section>

              <section class="card card-pad">
                <div class="panel-head">
                  <h2>Recent AI usage</h2>
                  <span class="badge">{{ aiUsagePage().totalItems || 0 }}</span>
                </div>
                @if (aiUsageItems().length) {
                  <div class="table-list">
                    @for (item of aiUsageItems(); track item.id) {
                      <div class="table-row">
                        <span>
                          <strong>{{ item.requestName || item.provider || 'AI request' }}</strong>
                          <small class="text-muted">
                            {{ item.provider || 'Provider' }} &middot; {{ item.model || 'Model' }}
                          </small>
                        </span>
                        <span class="usage-meta">
                          <strong>{{ usageAmount(item) }}</strong>
                          <small class="text-muted">{{ cost(item.estimatedCostUsd) }}</small>
                        </span>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-muted">No AI usage recorded yet.</p>
                }
              </section>
            } @else {
              <section class="card card-pad empty-state">
                <span class="stat-icon sky">
                  <app-icon name="shield" [size]="20"></app-icon>
                </span>
                <h3>Select a user</h3>
                <p class="text-muted">Choose a learner profile to review admin details.</p>
              </section>
            }
          }
        </section>
      </div>
    }

    @if (activeSection() === 'prompts') {
      <section class="card card-pad admin-section">
        <div class="panel-head inline">
          <div>
            <span class="eyebrow">Prompt management</span>
            <h2>Exercise prompts</h2>
            <p class="text-muted">
              Edit the admin guidance overlay for exercise prompts. Locked
              technical rules stay in backend prompt files.
            </p>
          </div>
          <button class="btn btn-outline" type="button" (click)="loadPrompts()">
            Refresh prompts
          </button>
        </div>

        <div class="editor-grid">
          <div class="list-card">
            @if (promptsLoading()) {
              <div class="loading-row">
                <app-icon class="inline-loading-icon" name="sparkles" [size]="18"></app-icon>
                Loading prompts...
              </div>
            } @else if (prompts().length) {
              @for (prompt of prompts(); track prompt.key || prompt.id) {
                <button
                  type="button"
                  class="config-row"
                  [class.active]="selectedPrompt()?.key === prompt.key"
                  (click)="editPrompt(prompt)"
                  >
                    <span>
                      <strong>{{ prompt.title || promptTitleFallback(prompt) }}</strong>
                    </span>
                  <span
                    class="badge"
                    [class.badge-green]="prompt.enabled"
                    [class.badge-red]="prompt.enabled === false"
                  >
                    {{ prompt.enabled === false ? 'Disabled' : 'Enabled' }}
                  </span>
                </button>
              }
            } @else {
              <p class="text-muted">No prompt overlays found.</p>
            }
          </div>

          <form class="editor-card" (ngSubmit)="savePrompt()">
            <label class="field">
              <span>Title</span>
              <input class="input" [(ngModel)]="promptTitle" name="promptTitle" />
            </label>
            <label class="field">
              <span>Teaching guidance</span>
              <textarea
                class="input editor-textarea"
                [(ngModel)]="promptContent"
                name="promptContent"
                placeholder="Add learner-facing teaching guidance for this exercise surface."
              ></textarea>
            </label>
            <label class="check-field">
              <input type="checkbox" [(ngModel)]="promptEnabled" name="promptEnabled" />
              <span>Enabled</span>
            </label>
            <div class="button-row">
              <button class="btn btn-primary" type="submit" [disabled]="promptSaving()">
                Save prompt
              </button>
              <button class="btn btn-ghost" type="button" (click)="newPrompt()">
                New overlay
              </button>
              @if (selectedPrompt()?.key) {
                <button class="btn btn-outline" type="button" (click)="deleteSelectedPrompt()">
                  Delete overlay
                </button>
              }
            </div>
          </form>
        </div>
      </section>
    }

    @if (activeSection() === 'exercise-config') {
      <section class="card card-pad admin-section">
        <div class="panel-head inline">
          <div>
            <span class="eyebrow">Exercise config</span>
            <h2>Levels, topics and types</h2>
            <p class="text-muted">
              Open a config tab, select a row, adjust its parameters, then save.
              New items are prepared automatically from the label you enter.
            </p>
          </div>
          <button class="btn btn-outline" type="button" (click)="loadExerciseConfig()">
            Refresh config
          </button>
        </div>

        <div class="config-tabs" role="tablist" aria-label="Exercise config">
          <button
            type="button"
            class="config-tab"
            [class.active]="configKind === 'level'"
            (click)="showConfigKind('level')"
          >
            Levels
          </button>
          <button
            type="button"
            class="config-tab"
            [class.active]="configKind === 'topic'"
            (click)="showConfigKind('topic')"
          >
            Topics
          </button>
          <button
            type="button"
            class="config-tab"
            [class.active]="configKind === 'type'"
            (click)="showConfigKind('type')"
          >
            Exercise types
          </button>
        </div>

        <div class="editor-grid">
          <div class="list-card config-lists">
            <div class="list-head">
              <div>
                <h3>{{ configKindTitle() }}</h3>
                <p class="text-muted">{{ configKindHelp() }}</p>
              </div>
              <button class="btn btn-ghost" type="button" (click)="newConfigItem(configKind)">
                New
              </button>
            </div>

            @if (configLoading()) {
              <div class="loading-row">
                <app-icon class="inline-loading-icon" name="sparkles" [size]="18"></app-icon>
                Loading config...
              </div>
            } @else {
              @if (configKind === 'level') {
                @for (level of exerciseConfig().levels ?? []; track level.code) {
                  <button
                    type="button"
                    class="config-row"
                    [class.active]="isEditingConfig('level', level.code)"
                    (click)="editLevel(level)"
                  >
                    <span>
                      <strong>{{ level.label || 'Untitled level' }}</strong>
                      @if (level.description) {
                        <small class="text-muted">{{ level.description }}</small>
                      }
                    </span>
                    <span
                      class="badge"
                      [class.badge-green]="level.enabled !== false"
                      [class.badge-red]="level.enabled === false"
                    >
                      {{ level.enabled === false ? 'Disabled' : 'Enabled' }}
                    </span>
                  </button>
                } @empty {
                  <p class="text-muted">No levels configured yet.</p>
                }
              } @else if (configKind === 'topic') {
                @for (topic of exerciseConfig().topics ?? []; track topic.code) {
                  <button
                    type="button"
                    class="config-row"
                    [class.active]="isEditingConfig('topic', topic.code)"
                    (click)="editTopic(topic)"
                  >
                    <span>
                      <strong>{{ topic.label || 'Untitled topic' }}</strong>
                      <small class="text-muted">{{ levelLabel(topic.levelCode) }}</small>
                    </span>
                    <span
                      class="badge"
                      [class.badge-green]="topic.enabled !== false"
                      [class.badge-red]="topic.enabled === false"
                    >
                      {{ topic.enabled === false ? 'Disabled' : 'Enabled' }}
                    </span>
                  </button>
                } @empty {
                  <p class="text-muted">No topics configured yet.</p>
                }
              } @else {
                @for (type of exerciseConfig().exerciseTypes ?? []; track type.code) {
                  <button
                    type="button"
                    class="config-row"
                    [class.active]="isEditingConfig('type', type.code)"
                    (click)="editExerciseType(type)"
                  >
                    <span>
                      <strong>{{ type.label || 'Untitled exercise type' }}</strong>
                    </span>
                    <span
                      class="badge"
                      [class.badge-green]="type.enabled !== false"
                      [class.badge-red]="type.enabled === false"
                    >
                      {{ type.enabled === false ? 'Disabled' : 'Enabled' }}
                    </span>
                  </button>
                } @empty {
                  <p class="text-muted">No exercise types configured yet.</p>
                }
              }
            }
          </div>

          <form class="editor-card" (ngSubmit)="saveConfigItem()">
            <div class="editor-card-head">
              <div>
                <span class="eyebrow">{{ editingConfigCode ? 'Editing' : 'New' }}</span>
                <h3>{{ configKindSingularTitle() }}</h3>
              </div>
            </div>

            <label class="field">
              <span>Label</span>
              <input class="input" [(ngModel)]="configLabel" name="configLabel" />
            </label>
            @if (configKind === 'level') {
              <label class="field">
                <span>Description</span>
                <input class="input" [(ngModel)]="configDescription" name="configDescription" />
              </label>
            }
            @if (configKind === 'topic') {
              <label class="field">
                <span>Level</span>
                <select class="input" [(ngModel)]="configLevelCode" name="configLevelCode">
                  @for (level of exerciseConfig().levels ?? []; track level.code) {
                    <option [value]="level.code">{{ level.label || 'Untitled level' }}</option>
                  }
                </select>
              </label>
            }
            <label class="check-field">
              <input type="checkbox" [(ngModel)]="configEnabled" name="configEnabled" />
              <span>Enabled</span>
            </label>
            <div class="button-row">
              <button class="btn btn-primary" type="submit" [disabled]="configSaving()">
                Save {{ configKindSingularTitle().toLowerCase() }}
              </button>
              <button class="btn btn-ghost" type="button" (click)="newConfigItem(configKind)">
                New {{ configKindSingularTitle().toLowerCase() }}
              </button>
              @if (editingConfigCode) {
                <button class="btn btn-outline" type="button" (click)="deleteConfigItem()">
                  Delete item
                </button>
              }
            </div>
          </form>
        </div>
      </section>
    }

    @if (activeSection() === 'audit') {
      <section class="card card-pad admin-section">
        <div class="panel-head inline">
          <div>
            <span class="eyebrow">Audit trail</span>
            <h2>Recent admin actions</h2>
          </div>
          <button class="btn btn-outline" type="button" (click)="loadAuditLogs()">
            Refresh logs
          </button>
        </div>

        @if (auditLogs().length) {
          <div class="table-list">
            @for (log of auditLogs(); track log.id) {
              <div class="table-row">
                <span>
                  <strong>{{ auditActionLabel(log) }}</strong>
                  <small class="text-muted">
                    {{ auditTargetLabel(log) }}
                  </small>
                  @if (auditChangeSummary(log)) {
                    <small class="text-muted">{{ auditChangeSummary(log) }}</small>
                  }
                </span>
                <span class="usage-meta">
                  <strong>{{ auditActorLabel(log) }}</strong>
                  <small class="text-muted">{{ dateTime(log.createdAt) }}</small>
                </span>
              </div>
            }
          </div>
        } @else {
          <p class="text-muted">No audit logs loaded yet.</p>
        }
      </section>
    }
  `,
  styleUrl: './admin-profiles.component.css',
})
export class AdminProfilesComponent implements OnInit {
  private admin = inject(AdminService);

  activeSection = signal<AdminSection>('users');
  search = '';
  statusFilter: 'all' | 'active' | 'disabled' = 'all';
  statusReason = '';

  usersLoading = signal(false);
  detailLoading = signal(false);
  statusLoading = signal(false);
  deleteLoading = signal(false);
  promptsLoading = signal(false);
  promptSaving = signal(false);
  configLoading = signal(false);
  configSaving = signal(false);
  auditLoading = signal(false);
  errorMsg = signal('');
  selectedUserId = signal<number | null>(null);
  usersPage = signal<PageResponse<AdminUser>>({});
  detail = signal<AdminUserDetail | null>(null);
  progressPage = signal<PageResponse<AdminUserProgress>>({});
  aiUsagePage = signal<PageResponse<AdminAiUsage>>({});
  prompts = signal<AdminPrompt[]>([]);
  selectedPrompt = signal<AdminPrompt | null>(null);
  exerciseConfig = signal<AdminExerciseConfig>({});
  auditPage = signal<PageResponse<AdminAuditLog>>({});

  users = computed(() => this.usersPage().items ?? []);
  progressItems = computed(() => this.progressPage().items ?? []);
  aiUsageItems = computed(() => this.aiUsagePage().items ?? []);
  auditLogs = computed(() => this.auditPage().items ?? []);

  promptKey = '';
  promptTitle = '';
  promptContent = '';
  promptEnabled = true;

  configKind: ConfigKind = 'level';
  editingConfigCode = '';
  configCode = '';
  configLabel = '';
  configDescription = '';
  configLevelCode = '';
  configEnabled = true;

  ngOnInit(): void {
    this.loadUsers();
    this.loadPrompts();
    this.loadExerciseConfig();
    this.loadAuditLogs();
  }

  showSection(section: AdminSection): void {
    this.activeSection.set(section);
  }

  loadUsers(forceRefresh = false): void {
    if (forceRefresh) {
      this.admin.clearUserCache();
    }

    this.usersLoading.set(true);
    this.errorMsg.set('');

    this.admin
      .getUsers({
        search: this.search.trim() || undefined,
        adminDisabled: this.adminDisabledFilter(),
        page: 0,
        size: 20,
      })
      .subscribe({
        next: (page) => {
          this.usersPage.set(page);
          const selectedStillVisible = page.items?.some(
            (user) => user.id === this.selectedUserId(),
          );
          const firstUserId = page.items?.[0]?.id;

          if (!selectedStillVisible && firstUserId !== undefined) {
            this.selectUser(firstUserId);
          }
        },
        error: (error) => {
          this.errorMsg.set(this.errorMessage(error));
          this.usersLoading.set(false);
        },
        complete: () => {
          this.usersLoading.set(false);
        },
      });
  }

  selectUser(userId: number | undefined): void {
    if (userId === undefined) {
      return;
    }

    this.selectedUserId.set(userId);
    this.detailLoading.set(true);
    this.errorMsg.set('');
    this.statusReason = '';

    this.admin.getUser(userId).subscribe({
      next: (detail) => this.detail.set(detail),
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.detailLoading.set(false);
      },
      complete: () => this.detailLoading.set(false),
    });

    this.admin.getUserProgress(userId).subscribe({
      next: (page) => this.progressPage.set(page),
      error: (error) => this.errorMsg.set(this.errorMessage(error)),
    });

    this.admin.getUserAiUsage(userId).subscribe({
      next: (page) => this.aiUsagePage.set(page),
      error: (error) => this.errorMsg.set(this.errorMessage(error)),
    });
  }

  toggleStatus(profile: AdminUserDetail): void {
    const userId = profile.user?.id;

    if (userId === undefined) {
      return;
    }

    const nextDisabled = !profile.user?.adminDisabled;
    if (!this.confirmStatusChange(profile.user, nextDisabled)) {
      return;
    }

    this.statusLoading.set(true);
    this.errorMsg.set('');

    this.admin
      .updateUserStatus(
        userId,
        nextDisabled,
        this.statusReason,
      )
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.patchUserRow(detail.user);
          this.statusReason = '';
        },
        error: (error) => {
          this.errorMsg.set(this.errorMessage(error));
          this.statusLoading.set(false);
        },
        complete: () => this.statusLoading.set(false),
      });
  }

  deleteAccount(profile: AdminUserDetail): void {
    const userId = profile.user?.id;

    if (userId === undefined || !this.confirmDelete(profile.user)) {
      return;
    }

    this.deleteLoading.set(true);
    this.errorMsg.set('');

    this.admin.deleteUser(userId).subscribe({
      next: () => {
        this.removeUserRow(userId);
        this.selectedUserId.set(null);
        this.detail.set(null);
        this.progressPage.set({});
        this.aiUsagePage.set({});
        this.statusReason = '';
        this.loadAuditLogs();
      },
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.deleteLoading.set(false);
      },
      complete: () => this.deleteLoading.set(false),
    });
  }

  loadPrompts(): void {
    this.promptsLoading.set(true);
    this.errorMsg.set('');

    this.admin.getPrompts().subscribe({
      next: (prompts) => {
        this.prompts.set(prompts);
        if (!this.selectedPrompt() && prompts[0]) {
          this.editPrompt(prompts[0]);
        }
      },
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.promptsLoading.set(false);
      },
      complete: () => this.promptsLoading.set(false),
    });
  }

  editPrompt(prompt: AdminPrompt): void {
    this.selectedPrompt.set(prompt);
    this.promptKey = prompt.key || '';
    this.promptTitle = prompt.title || '';
    this.promptContent = prompt.editableContent || '';
    this.promptEnabled = prompt.enabled !== false;
  }

  newPrompt(): void {
    this.selectedPrompt.set(null);
    this.promptKey = '';
    this.promptTitle = '';
    this.promptContent = '';
    this.promptEnabled = true;
  }

  savePrompt(): void {
    const title = this.promptTitle.trim();
    const selectedKey = this.selectedPrompt()?.key;
    const key = selectedKey || this.promptKey.trim() || this.promptKeyFromTitle(title);

    if (!key) {
      this.errorMsg.set('Title is required.');
      return;
    }

    this.promptSaving.set(true);
    this.errorMsg.set('');

    const request = {
      title: title || undefined,
      editableContent: this.promptContent,
      enabled: this.promptEnabled,
    };
    const save$ = selectedKey
      ? this.admin.updatePrompt(selectedKey, request)
      : this.admin.createPrompt({ key, ...request });

    save$.subscribe({
      next: (prompt) => {
        this.upsertPrompt(prompt);
        this.editPrompt(prompt);
        this.loadAuditLogs();
      },
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.promptSaving.set(false);
      },
      complete: () => this.promptSaving.set(false),
    });
  }

  deleteSelectedPrompt(): void {
    const key = this.selectedPrompt()?.key;

    if (!key) {
      return;
    }

    this.promptSaving.set(true);
    this.errorMsg.set('');

    this.admin.deletePrompt(key).subscribe({
      next: () => {
        this.prompts.update((prompts) =>
          prompts.filter((prompt) => prompt.key !== key),
        );
        this.newPrompt();
        this.loadAuditLogs();
      },
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.promptSaving.set(false);
      },
      complete: () => this.promptSaving.set(false),
    });
  }

  loadExerciseConfig(): void {
    this.configLoading.set(true);
    this.errorMsg.set('');

    this.admin.getExerciseConfig().subscribe({
      next: (config) => {
        this.exerciseConfig.set(config);
        this.syncConfigEditorAfterLoad(config);
      },
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.configLoading.set(false);
      },
      complete: () => this.configLoading.set(false),
    });
  }

  showConfigKind(kind: ConfigKind): void {
    const config = this.exerciseConfig();

    if (kind === 'level' && config.levels?.[0]) {
      this.editLevel(config.levels[0]);
      return;
    }

    if (kind === 'topic' && config.topics?.[0]) {
      this.editTopic(config.topics[0]);
      return;
    }

    if (kind === 'type' && config.exerciseTypes?.[0]) {
      this.editExerciseType(config.exerciseTypes[0]);
      return;
    }

    this.newConfigItem(kind);
  }

  editLevel(level: AdminLevelOption): void {
    this.configKind = 'level';
    this.editingConfigCode = level.code || '';
    this.configCode = level.code || '';
    this.configLabel = level.label || '';
    this.configDescription = level.description || '';
    this.configLevelCode = '';
    this.configEnabled = level.enabled !== false;
  }

  editTopic(topic: AdminTopicOption): void {
    this.configKind = 'topic';
    this.editingConfigCode = topic.code || '';
    this.configCode = topic.code || '';
    this.configLabel = topic.label || '';
    this.configDescription = '';
    this.configLevelCode = topic.levelCode || this.exerciseConfig().levels?.[0]?.code || '';
    this.configEnabled = topic.enabled !== false;
  }

  editExerciseType(type: AdminExerciseTypeOption): void {
    this.configKind = 'type';
    this.editingConfigCode = type.code || '';
    this.configCode = type.code || '';
    this.configLabel = type.label || '';
    this.configDescription = '';
    this.configLevelCode = '';
    this.configEnabled = type.enabled !== false;
  }

  newConfigItem(kind: ConfigKind): void {
    this.configKind = kind;
    this.editingConfigCode = '';
    this.configCode = '';
    this.configLabel = '';
    this.configDescription = '';
    this.configLevelCode = this.exerciseConfig().levels?.[0]?.code || '';
    this.configEnabled = true;
  }

  saveConfigItem(): void {
    const label = this.configLabel.trim();
    const code = this.editingConfigCode || this.codeFromLabel(label);

    if (!label) {
      this.errorMsg.set('Label is required.');
      return;
    }

    if (!code) {
      this.errorMsg.set('Use at least one letter or number in the label.');
      return;
    }

    this.configSaving.set(true);
    this.errorMsg.set('');

    const existingCode = this.editingConfigCode || undefined;
    const save$ =
      this.configKind === 'level'
        ? this.admin.saveLevel(
            {
              code,
              label,
              description: this.configDescription.trim(),
              enabled: this.configEnabled,
            },
            existingCode,
          )
        : this.configKind === 'topic'
          ? this.admin.saveTopic(
              {
                code,
                label,
                levelCode: this.configLevelCode,
                enabled: this.configEnabled,
              },
              existingCode,
            )
          : this.admin.saveExerciseType(
              { code, label, enabled: this.configEnabled },
              existingCode,
            );

    save$.subscribe({
      next: () => {
        this.editingConfigCode = code;
        this.configCode = code;
        this.loadExerciseConfig();
        this.loadAuditLogs();
      },
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.configSaving.set(false);
      },
      complete: () => this.configSaving.set(false),
    });
  }

  deleteConfigItem(): void {
    if (!this.editingConfigCode) {
      return;
    }

    const endpointKind =
      this.configKind === 'level'
        ? 'levels'
        : this.configKind === 'topic'
          ? 'topics'
          : 'types';

    this.configSaving.set(true);
    this.errorMsg.set('');

    this.admin.deleteConfigItem(endpointKind, this.editingConfigCode).subscribe({
      next: () => {
        this.newConfigItem(this.configKind);
        this.loadExerciseConfig();
        this.loadAuditLogs();
      },
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.configSaving.set(false);
      },
      complete: () => this.configSaving.set(false),
    });
  }

  loadAuditLogs(): void {
    this.auditLoading.set(true);

    this.admin.getAuditLogs({ page: 0, size: 20 }).subscribe({
      next: (page) => this.auditPage.set(page),
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.auditLoading.set(false);
      },
      complete: () => this.auditLoading.set(false),
    });
  }

  displayName(user: AdminUser | undefined): string {
    const fullName = [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || user?.username || user?.email || 'Learner';
  }

  initials(user: AdminUser): string {
    return this.displayName(user)
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  formatLabel(value: string): string {
    return formatPracticeLabel(value);
  }

  auditActionLabel(log: AdminAuditLog): string {
    return log.actionLabel || this.formatLabel(log.action || 'Admin action');
  }

  auditTargetLabel(log: AdminAuditLog): string {
    if (log.targetLabel) {
      return log.targetLabel;
    }

    const targetType = log.targetType ? this.formatLabel(log.targetType) : 'Target';
    const targetId = log.targetId || log.targetUserId;
    return targetId ? `${targetType} ${targetId}` : targetType;
  }

  auditActorLabel(log: AdminAuditLog): string {
    if (log.actorLabel) {
      return log.actorLabel;
    }

    return log.actorUserId ? `User ${log.actorUserId}` : 'System';
  }

  auditChangeSummary(log: AdminAuditLog): string {
    return log.changeSummary || log.reason || '';
  }

  cost(value: number | undefined): string {
    return value === undefined ? '$0.00' : `$${value.toFixed(4)}`;
  }

  usageAmount(item: AdminAiUsage): string {
    if (item.totalTokens !== undefined && item.totalTokens > 0) {
      return `${item.totalTokens} tokens`;
    }

    if (item.usageUnit && item.usageAmount !== undefined) {
      return `${item.usageAmount} ${item.usageUnit}`;
    }

    return 'Usage recorded';
  }

  dateTime(value: string | undefined): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }

  promptTitleFallback(prompt: AdminPrompt): string {
    return prompt.key ? formatPracticeLabel(prompt.key) : 'Untitled prompt';
  }

  levelLabel(code: string | undefined): string {
    if (!code) {
      return 'No level selected';
    }

    const level = this.exerciseConfig().levels?.find((item) => item.code === code);
    return level?.label || 'Selected level';
  }

  accountStatusLabel(user: AdminUser | undefined): string {
    if (user?.adminDisabled) {
      return 'Disabled';
    }

    if (user?.emailVerified === false) {
      return 'Pending verification';
    }

    return 'Active';
  }

  subscriptionPlanLabel(user: AdminUser | undefined): string {
    return this.isPremium(user) ? 'Premium' : 'Basic';
  }

  isPremium(user: AdminUser | undefined): boolean {
    return user?.subscription?.subscribed === true;
  }

  isEditingConfig(kind: ConfigKind, code: string | undefined): boolean {
    return this.configKind === kind && !!code && this.editingConfigCode === code;
  }

  configKindTitle(): string {
    if (this.configKind === 'level') {
      return 'Levels';
    }

    if (this.configKind === 'topic') {
      return 'Topics';
    }

    return 'Exercise types';
  }

  configKindSingularTitle(): string {
    if (this.configKind === 'level') {
      return 'Level';
    }

    if (this.configKind === 'topic') {
      return 'Topic';
    }

    return 'Exercise type';
  }

  configKindHelp(): string {
    if (this.configKind === 'level') {
      return 'Levels control the CEFR choices shown to learners.';
    }

    if (this.configKind === 'topic') {
      return 'Topics are linked to a level and filtered in learner forms.';
    }

    return 'Exercise types control the practice modes available for generation.';
  }

  private codeFromLabel(label: string): string {
    return label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_{2,}/g, '_');
  }

  private promptKeyFromTitle(title: string): string {
    return title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  private syncConfigEditorAfterLoad(config: AdminExerciseConfig): void {
    if (!this.configLevelCode && config.levels?.[0]?.code) {
      this.configLevelCode = config.levels[0].code;
    }

    const selectedCode = this.editingConfigCode || this.configCode;

    if (this.configKind === 'level') {
      const selected = config.levels?.find((level) => level.code === selectedCode);
      if (selected) {
        this.editLevel(selected);
      } else if (!this.editingConfigCode && config.levels?.[0]) {
        this.editLevel(config.levels[0]);
      }
      return;
    }

    if (this.configKind === 'topic') {
      const selected = config.topics?.find((topic) => topic.code === selectedCode);
      if (selected) {
        this.editTopic(selected);
      } else if (!this.editingConfigCode && config.topics?.[0]) {
        this.editTopic(config.topics[0]);
      }
      return;
    }

    const selected = config.exerciseTypes?.find((type) => type.code === selectedCode);
    if (selected) {
      this.editExerciseType(selected);
    } else if (!this.editingConfigCode && config.exerciseTypes?.[0]) {
      this.editExerciseType(config.exerciseTypes[0]);
    }
  }

  private adminDisabledFilter(): boolean | undefined {
    if (this.statusFilter === 'active') {
      return false;
    }

    if (this.statusFilter === 'disabled') {
      return true;
    }

    return undefined;
  }

  private patchUserRow(user: AdminUser | undefined): void {
    if (!user?.id) {
      return;
    }

    this.usersPage.update((page) => ({
      ...page,
      items: (page.items ?? []).map((item) => (item.id === user.id ? user : item)),
    }));
  }

  private removeUserRow(userId: number): void {
    this.usersPage.update((page) => ({
      ...page,
      items: (page.items ?? []).filter((item) => item.id !== userId),
      totalItems:
        page.totalItems === undefined ? undefined : Math.max(page.totalItems - 1, 0),
    }));
  }

  private confirmStatusChange(
    user: AdminUser | undefined,
    nextDisabled: boolean,
  ): boolean {
    const action = nextDisabled ? 'Disable' : 'Enable';
    const consequence = nextDisabled
      ? 'They will not be able to sign in until the account is enabled again.'
      : 'They will be able to sign in again.';

    return window.confirm(`${action} ${this.displayName(user)}? ${consequence}`);
  }

  private confirmDelete(user: AdminUser | undefined): boolean {
    return window.confirm(
      `Delete ${this.displayName(user)}? This permanently removes the account, progress, usage, OTP, audit links, and cannot be undone.`,
    );
  }

  private upsertPrompt(prompt: AdminPrompt): void {
    this.prompts.update((prompts) => {
      const existingIndex = prompts.findIndex((item) => item.key === prompt.key);

      if (existingIndex === -1) {
        return [prompt, ...prompts];
      }

      return prompts.map((item, index) =>
        index === existingIndex ? prompt : item,
      );
    });
  }

  private errorMessage(error: unknown): string {
    return friendlyErrorMessage(error);
  }
}
