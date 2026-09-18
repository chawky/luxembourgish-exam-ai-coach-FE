import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../../components/icon.component';
import { PublicNavComponent } from '../../components/public-nav.component';
import { friendlyErrorMessage } from '../../error-message';
import { AuthService } from '../../services/auth.service';
import { SupportService } from '../../services/support.service';

const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PublicNavComponent,
    IconComponent,
  ],
  template: `
    <app-public-nav></app-public-nav>

    <main class="support-page">
      <section class="container support-grid">
        <div class="support-copy">
          <span class="eyebrow">Support</span>
          <h1>Need help with Letz Speak?</h1>
          <p class="text-muted">
            Send us a message about account access, subscriptions, payments,
            technical issues or other questions. Screenshots help us diagnose
            issues faster.
          </p>
          <div class="direct-email card card-pad">
            <app-icon name="info" [size]="20"></app-icon>
            <div>
              <strong>Email us directly</strong>
              <a href="mailto:support@letz-speak.com">support&#64;letz-speak.com</a>
            </div>
          </div>
        </div>

        <form class="card card-pad support-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="supportEmail">Email</label>
            <input
              id="supportEmail"
              type="email"
              class="input"
              formControlName="email"
              [class.error]="invalid('email')"
              autocomplete="email"
              placeholder="you@example.com"
              aria-describedby="supportEmailError"
            />
            @if (invalid('email')) {
              <span id="supportEmailError" class="field-error">
                Enter a valid email address.
              </span>
            }
          </div>

          <div class="field">
            <label for="supportSubject">Subject</label>
            <input
              id="supportSubject"
              type="text"
              class="input"
              formControlName="subject"
              [class.error]="invalid('subject')"
              maxlength="160"
              placeholder="Subscription problem"
              aria-describedby="supportSubjectError"
            />
            @if (invalid('subject')) {
              <span id="supportSubjectError" class="field-error">
                Subject is required and must be 160 characters or fewer.
              </span>
            }
          </div>

          <div class="field">
            <label for="supportMessage">Message</label>
            <textarea
              id="supportMessage"
              class="input textarea"
              formControlName="message"
              [class.error]="invalid('message')"
              maxlength="4000"
              rows="7"
              placeholder="Tell us what happened and what you expected."
              aria-describedby="supportMessageHelp supportMessageError"
            ></textarea>
            <span id="supportMessageHelp" class="field-help">
              {{ form.controls.message.value.length }}/4000 characters
            </span>
            @if (invalid('message')) {
              <span id="supportMessageError" class="field-error">
                Message is required and must be 4000 characters or fewer.
              </span>
            }
          </div>

          <div class="field">
            <label for="supportAttachments">Attachments <span class="text-muted">(optional)</span></label>
            <input
              #fileInput
              id="supportAttachments"
              type="file"
              class="input file-input"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              (change)="addAttachments($event)"
              aria-describedby="attachmentHelp attachmentError"
            />
            <span id="attachmentHelp" class="field-help">
              PNG, JPG, WebP or PDF. Maximum 5 MB each, up to 3 files.
            </span>
            @if (attachmentError()) {
              <span id="attachmentError" class="field-error" role="alert">
                {{ attachmentError() }}
              </span>
            }
          </div>

          @if (attachments().length) {
            <ul class="attachment-list" aria-label="Selected attachments">
              @for (file of attachments(); track fileKey(file, $index)) {
                <li>
                  <span>{{ file.name }}</span>
                  <button
                    type="button"
                    class="btn btn-ghost remove-btn"
                    (click)="removeAttachment($index)"
                  >
                    Remove
                  </button>
                </li>
              }
            </ul>
          }

          @if (errorMsg()) {
            <div class="form-error" role="alert">{{ errorMsg() }}</div>
          }

          @if (successMsg()) {
            <div class="form-success" role="status">{{ successMsg() }}</div>
          }

          <button
            type="submit"
            class="btn btn-primary btn-block btn-lg"
            [disabled]="sending()"
          >
            @if (sending()) {
              <span class="inline-loading-icon" aria-hidden="true">✦</span>
              Sending...
            } @else {
              Send message
            }
          </button>
        </form>
      </section>
    </main>
  `,
  styles: [
    `
      .support-page {
        padding: 56px 0 72px;
      }
      .support-grid {
        display: grid;
        grid-template-columns: minmax(0, 0.85fr) minmax(320px, 1.15fr);
        gap: 32px;
        align-items: start;
      }
      .support-copy h1 {
        margin-top: 10px;
        font-size: clamp(34px, 5vw, 56px);
      }
      .support-copy p {
        max-width: 560px;
        margin: 16px 0 24px;
        font-size: 18px;
      }
      .direct-email {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        max-width: 420px;
      }
      .direct-email app-icon {
        color: var(--blue-700);
        margin-top: 2px;
      }
      .direct-email strong,
      .direct-email a {
        display: block;
      }
      .direct-email a {
        color: var(--blue-700);
        font-weight: 700;
        margin-top: 2px;
      }
      .support-form {
        padding: 28px;
      }
      .textarea {
        resize: vertical;
        min-height: 170px;
      }
      .field-help {
        color: var(--slate-500);
        font-size: 13px;
      }
      .file-input {
        padding: 10px;
      }
      .attachment-list {
        display: grid;
        gap: 8px;
        list-style: none;
        padding: 0;
        margin: 0 0 16px;
      }
      .attachment-list li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 8px 10px;
        background: var(--surface-2);
      }
      .attachment-list span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .remove-btn {
        padding: 6px 10px;
        flex-shrink: 0;
      }
      .form-error {
        background: var(--red-50);
        color: var(--red);
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 14px;
        margin-bottom: 16px;
      }
      .form-success {
        background: #143525;
        color: var(--green);
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 14px;
        margin-bottom: 16px;
      }
      @media (max-width: 820px) {
        .support-page {
          padding-top: 34px;
        }
        .support-grid {
          grid-template-columns: 1fr;
        }
        .support-form {
          padding: 22px;
        }
      }
    `,
  ],
})
export class SupportComponent {
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly support = inject(SupportService);

  readonly attachments = signal<File[]>([]);
  readonly attachmentError = signal('');
  readonly sending = signal(false);
  readonly errorMsg = signal('');
  readonly successMsg = signal('');

  readonly form = this.fb.nonNullable.group({
    email: [
      this.auth.currentUser()?.email ?? '',
      [Validators.required, Validators.email, Validators.maxLength(254)],
    ],
    subject: [
      '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(160)],
    ],
    message: [
      '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(4000)],
    ],
  });

  invalid(controlName: 'email' | 'subject' | 'message'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  addAttachments(event: Event): void {
    this.attachmentError.set('');

    const input = event.target as HTMLInputElement;
    const selectedFiles = Array.from(input.files ?? []);
    const acceptedFiles = [...this.attachments()];

    for (const file of selectedFiles) {
      if (acceptedFiles.length >= MAX_ATTACHMENTS) {
        this.attachmentError.set('You can attach up to 3 files.');
        break;
      }

      const validationError = this.validateAttachment(file);
      if (validationError) {
        this.attachmentError.set(validationError);
        continue;
      }

      acceptedFiles.push(file);
    }

    this.attachments.set(acceptedFiles);
    input.value = '';
  }

  removeAttachment(index: number): void {
    this.attachmentError.set('');
    this.attachments.update((files) => files.filter((_, i) => i !== index));
  }

  fileKey(file: File, index: number): string {
    return `${file.name}-${file.size}-${file.lastModified}-${index}`;
  }

  submit(): void {
    this.errorMsg.set('');
    this.successMsg.set('');
    this.attachmentError.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending.set(true);
    const value = this.form.getRawValue();

    this.support
      .send({
        email: value.email,
        subject: value.subject,
        message: value.message,
        attachments: this.attachments(),
      })
      .subscribe({
        next: () => {
          this.successMsg.set(
            "Your message has been sent. We'll get back to you as soon as possible.",
          );
          this.form.controls.subject.reset('');
          this.form.controls.message.reset('');
          this.attachments.set([]);
          this.fileInput?.nativeElement && (this.fileInput.nativeElement.value = '');
        },
        error: (error) => {
          this.errorMsg.set(this.errorMessage(error));
          this.sending.set(false);
        },
        complete: () => {
          this.sending.set(false);
        },
      });
  }

  private validateAttachment(file: File): string | null {
    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
      return `${file.name} is not a supported file type. Use PNG, JPG, WebP or PDF.`;
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      return `${file.name} exceeds the 5 MB limit.`;
    }

    return null;
  }

  private errorMessage(error: unknown): string {
    return friendlyErrorMessage(error, 'Could not send your message. Please try again.');
  }
}
