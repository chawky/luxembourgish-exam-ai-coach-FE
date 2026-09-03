import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../components/icon.component';
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

@Component({
  selector: 'app-admin-profiles',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <header class="page-head">
      <div>
        <span class="eyebrow">Admin</span>
        <h1>User profiles</h1>
        <p class="text-muted">
          Review learner status, progress, and AI usage from the admin dashboard.
        </p>
      </div>
    </header>

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

    @if (errorMsg()) {
      <section class="admin-error" role="alert">{{ errorMsg() }}</section>
    }

    <div class="admin-layout">
      <section class="card users-panel">
        <div class="panel-head">
          <h2>Users</h2>
          <span class="badge">{{ usersPage().totalItems || users().length }}</span>
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
                <span
                  class="badge"
                  [class.badge-red]="user.adminDisabled"
                  [class.badge-green]="!user.adminDisabled"
                >
                  {{ user.adminDisabled ? 'Disabled' : 'Active' }}
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
              <span
                class="badge"
                [class.badge-red]="profile.user?.adminDisabled"
                [class.badge-green]="!profile.user?.adminDisabled"
              >
                {{ profile.user?.adminDisabled ? 'Disabled' : 'Active' }}
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
                [disabled]="statusLoading()"
                (click)="toggleStatus(profile)"
              >
                {{ profile.user?.adminDisabled ? 'Enable account' : 'Disable account' }}
              </button>
            </div>
          </section>

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

    <section class="card card-pad admin-section">
      <div class="panel-head inline">
        <div>
          <span class="eyebrow">Prompt management</span>
          <h2>Exercise prompts</h2>
          <p class="text-muted">
            Edit the admin guidance overlay for known prompt keys. Locked
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
                  <strong>{{ prompt.title || prompt.key }}</strong>
                  <small class="text-muted">{{ prompt.key }}</small>
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
            <span>Prompt key</span>
            <input class="input" [(ngModel)]="promptKey" name="promptKey" />
          </label>
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

    <section class="card card-pad admin-section">
      <div class="panel-head inline">
        <div>
          <span class="eyebrow">Exercise config</span>
          <h2>Levels, topics and types</h2>
          <p class="text-muted">
            These string codes drive learner generation forms. Prefer disabling
            rows over deleting once learners have history.
          </p>
        </div>
        <button class="btn btn-outline" type="button" (click)="loadExerciseConfig()">
          Refresh config
        </button>
      </div>

      <div class="editor-grid">
        <div class="list-card config-lists">
          <h3>Levels</h3>
          @for (level of exerciseConfig().levels ?? []; track level.code) {
            <button type="button" class="config-row" (click)="editLevel(level)">
              <span>
                <strong>{{ level.label || level.code }}</strong>
                <small class="text-muted">{{ level.code }}</small>
              </span>
              <span class="badge">{{ level.enabled === false ? 'Disabled' : 'Enabled' }}</span>
            </button>
          }

          <h3>Topics</h3>
          @for (topic of exerciseConfig().topics ?? []; track topic.code) {
            <button type="button" class="config-row" (click)="editTopic(topic)">
              <span>
                <strong>{{ topic.label || topic.code }}</strong>
                <small class="text-muted">{{ topic.code }} · {{ topic.levelCode }}</small>
              </span>
              <span class="badge">{{ topic.enabled === false ? 'Disabled' : 'Enabled' }}</span>
            </button>
          }

          <h3>Exercise types</h3>
          @for (type of exerciseConfig().exerciseTypes ?? []; track type.code) {
            <button type="button" class="config-row" (click)="editExerciseType(type)">
              <span>
                <strong>{{ type.label || type.code }}</strong>
                <small class="text-muted">{{ type.code }}</small>
              </span>
              <span class="badge">{{ type.enabled === false ? 'Disabled' : 'Enabled' }}</span>
            </button>
          }
        </div>

        <form class="editor-card" (ngSubmit)="saveConfigItem()">
          <label class="field">
            <span>Config kind</span>
            <select class="input" [(ngModel)]="configKind" name="configKind" (change)="newConfigItem(configKind)">
              <option value="level">Level</option>
              <option value="topic">Topic</option>
              <option value="type">Exercise type</option>
            </select>
          </label>
          <label class="field">
            <span>Code</span>
            <input class="input" [(ngModel)]="configCode" name="configCode" />
          </label>
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
              <span>Level code</span>
              <select class="input" [(ngModel)]="configLevelCode" name="configLevelCode">
                @for (level of exerciseConfig().levels ?? []; track level.code) {
                  <option [value]="level.code">{{ level.label || level.code }}</option>
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
              Save config
            </button>
            <button class="btn btn-ghost" type="button" (click)="newConfigItem(configKind)">
              New item
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
                <strong>{{ formatLabel(log.action || 'Admin action') }}</strong>
                <small class="text-muted">
                  {{ log.targetType || 'Target' }} {{ log.targetId || log.targetUserId || '' }}
                </small>
              </span>
              <span class="usage-meta">
                <strong>User {{ log.actorUserId || 'unknown' }}</strong>
                <small class="text-muted">{{ dateTime(log.createdAt) }}</small>
              </span>
            </div>
          }
        </div>
      } @else {
        <p class="text-muted">No audit logs loaded yet.</p>
      }
    </section>
  `,
  styleUrl: './admin-profiles.component.css',
})
export class AdminProfilesComponent implements OnInit {
  private admin = inject(AdminService);

  search = '';
  statusFilter: 'all' | 'active' | 'disabled' = 'all';
  statusReason = '';

  usersLoading = signal(false);
  detailLoading = signal(false);
  statusLoading = signal(false);
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

  configKind: 'level' | 'topic' | 'type' = 'level';
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

  loadUsers(): void {
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

    this.statusLoading.set(true);
    this.errorMsg.set('');

    this.admin
      .updateUserStatus(
        userId,
        !profile.user?.adminDisabled,
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
    const key = this.promptKey.trim();

    if (!key) {
      this.errorMsg.set('Prompt key is required.');
      return;
    }

    this.promptSaving.set(true);
    this.errorMsg.set('');

    const selectedKey = this.selectedPrompt()?.key;
    const request = {
      title: this.promptTitle.trim() || undefined,
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
        if (!this.configLevelCode && config.levels?.[0]?.code) {
          this.configLevelCode = config.levels[0].code;
        }
      },
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.configLoading.set(false);
      },
      complete: () => this.configLoading.set(false),
    });
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

  newConfigItem(kind: 'level' | 'topic' | 'type'): void {
    this.configKind = kind;
    this.editingConfigCode = '';
    this.configCode = '';
    this.configLabel = '';
    this.configDescription = '';
    this.configLevelCode = this.exerciseConfig().levels?.[0]?.code || '';
    this.configEnabled = true;
  }

  saveConfigItem(): void {
    const code = this.configCode.trim();
    const label = this.configLabel.trim();

    if (!code || !label) {
      this.errorMsg.set('Code and label are required.');
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
        this.loadExerciseConfig();
        this.loadAuditLogs();
        this.editingConfigCode = code;
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
    return error instanceof Error && error.message
      ? error.message
      : 'Something went wrong.';
  }
}
