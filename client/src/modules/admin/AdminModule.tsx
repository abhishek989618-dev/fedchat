import {
  AlertTriangle,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DatabaseBackup,
  Download,
  Globe2,
  LayoutDashboard,
  Lock,
  Menu,
  Pencil,
  RefreshCw,
  Server,
  Settings2,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  WalletCards,
  X,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  api,
  assetUrl,
} from '../../lib'

import {
  useApplySiteSettings,
  useSiteSettings,
} from '../../hooks/useSiteSettings'

import type { AdminSection } from '../../types/app'

import './admin.css'

/* =========================================================
   TYPES
   ========================================================= */

type Analytics = {
  users: number
  rooms: number
  messages: number
  subscriptions: number
  pendingPayments: number
  activeUsers24h: number
}

type PaymentRequest = {
  id: string
  transactionId?: string
  amount: number

  user: {
    id: string
    username: string
    firstName?: string
    lastName?: string
    email?: string
  }

  plan: {
    id: string
    name: string
  }
}

type AdminUser = {
  id: string
  username: string
  firstName: string
  lastName: string
  status: string
}

type Plan = {
  id: string
  name: string
  description?: string | null
  price?: number | string
  durationDays?: number
  accessLevel?:
    | 'FULL'
    | 'READONLY'
    | 'LOCKED'
  isActive?: boolean
  maxGroups: number | null
  maxMembersPerGroup:
    | number
    | null
  maxCommunities:
    | number
    | null
  maxGuestsPerGroup:
    | number
    | null
}

type PaymentMethod = {
  id: string
  name: string
  type: string
  description?: string | null
  upiId?: string | null
  paymentNumber?: string | null
  isDefault?: boolean
  isActive?: boolean
}

type MediaBackup = {
  filename: string
  sizeBytes: number
  createdAt: string
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatNumber(
  value: number,
) {
  return value.toLocaleString(
    'en-IN',
  )
}

function formatCurrency(
  value: number | string,
) {
  const amount =
    Number(value)

  if (
    Number.isNaN(
      amount,
    )
  ) {
    return String(value)
  }

  return amount.toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 2,
    },
  )
}

function getInitials(
  firstName?: string,
  lastName?: string,
  username?: string,
) {
  const name =
    `${firstName || ''} ${
      lastName || ''
    }`.trim()

  if (name) {
    return name
      .split(/\s+/)
      .map(
        (part) =>
          part[0] || '',
      )
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    username
      ?.slice(0, 2)
      .toUpperCase() ||
    'U'
  )
}

function accessLabel(
  value?: string,
) {
  return String(
    value || 'FULL',
  )
    .replace(
      /_/g,
      ' ',
    )
    .toUpperCase()
}

/* =========================================================
   SECTION META
   ========================================================= */

const ADMIN_SECTIONS: Array<{
  id: AdminSection
  label: string
  description: string
  icon: ReactNode
}> = [
  {
    id: 'overview',
    label: 'Overview',
    description:
      'Platform health and key metrics',
    icon: (
      <LayoutDashboard
        size={17}
      />
    ),
  },

  {
    id: 'payments',
    label: 'Payments',
    description:
      'Approvals and payment methods',
    icon: (
      <WalletCards
        size={17}
      />
    ),
  },

  {
    id: 'users',
    label: 'Users',
    description:
      'Accounts and access status',
    icon: (
      <Users
        size={17}
      />
    ),
  },

  {
    id: 'plans',
    label: 'Plans',
    description:
      'Plans and feature limits',
    icon: (
      <CreditCard
        size={17}
      />
    ),
  },

  {
    id: 'media',
    label: 'Media',
    description:
      'Backup and storage',
    icon: (
      <DatabaseBackup
        size={17}
      />
    ),
  },

  {
    id: 'site',
    label: 'Site settings',
    description:
      'Branding and platform controls',
    icon: (
      <Globe2
        size={17}
      />
    ),
  },
]

/* =========================================================
   SECTION HEADER
   ========================================================= */

function AdminSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="admin-section-heading">
      <div>
        <span>
          {eyebrow}
        </span>

        <h2>
          {title}
        </h2>

        <p>
          {description}
        </p>
      </div>

      {action && (
        <div className="admin-section-heading-action">
          {action}
        </div>
      )}
    </div>
  )
}

/* =========================================================
   MEDIA BACKUP PANEL
   ========================================================= */

function MediaBackupPanel() {
  const [
    backups,
    setBackups,
  ] = useState<
    MediaBackup[] | null
  >(null)

  const [
    busy,
    setBusy,
  ] = useState<
    string | null
  >(null)

  const [
    message,
    setMessage,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  async function load() {
    setError('')

    try {
      const response =
        await api.listMediaBackups()

      setBackups(
        Array.isArray(
          response?.data
            ?.backups,
        )
          ? (response.data.backups as MediaBackup[])
          : [],
      )
    } catch (
      reason
     ) {
      setBackups([])

      setError(
        reason instanceof Error
          ? reason.message
          : 'Failed to load backups.',
      )
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function createBackup() {
    setBusy('backup')
    setError('')
    setMessage('')

    try {
      const response =
        await api.createMediaBackup()

      const backup =
        response.data.backup

      setMessage(
        `Backup created: ${backup.filename} (${backup.mediaCount} file(s), ${(backup.sizeBytes / 1024 / 1024).toFixed(2)} MB)`,
      )

      await load()
    } catch (
      reason
    ) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Backup failed.',
      )
    } finally {
      setBusy(null)
    }
  }

  async function wipeMedia(
    filename: string,
  ) {
    const confirmed =
      window.confirm(
        `This permanently deletes ALL media files and cannot be undone.\n\nA backup (${filename}) has been created.\n\nConfirm you want to wipe media now?`,
      )

    if (!confirmed) {
      return
    }

    setBusy(filename)
    setError('')
    setMessage('')

    try {
      const response =
        await api.wipeMedia(
          filename,
        )

      setMessage(
        response.message ||
          'Media wiped successfully.',
      )

      await load()
    } catch (
      reason
    ) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Wipe failed.',
      )
    } finally {
      setBusy(null)
    }
  }

  async function downloadBackup(
    filename: string,
  ) {
    setError('')

    try {
      await api.downloadMediaBackup(
        filename,
      )

      setMessage(
        'Backup download started.',
      )
    } catch (
      reason
    ) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Download failed.',
      )
    }
  }

  return (
    <div className="admin-section-content">
      <AdminSectionHeader
        eyebrow="MEDIA"
        title="Media & storage"
        description="Back up uploaded media and safely reclaim server storage."
        action={
          <button
            type="button"
            className="admin-primary-button"
            disabled={
              busy === 'backup'
            }
            onClick={() =>
              void createBackup()
            }
          >
            <DatabaseBackup
              size={14}
            />

            {busy ===
            'backup'
              ? 'Creating…'
              : 'Create backup'}
          </button>
        }
      />

      <div className="admin-warning-card">
        <div className="admin-warning-icon">
          <AlertTriangle
            size={17}
          />
        </div>

        <div>
          <strong>
            Backup required before media cleanup
          </strong>

          <span>
            Wiping media permanently deletes
            uploaded files from the server.
          </span>
        </div>
      </div>

      {message && (
        <div className="admin-success-message">
          <Check size={14} />
          <span>
            {message}
          </span>
        </div>
      )}

      {error && (
        <div className="admin-error-message">
          <AlertTriangle
            size={14}
          />
          <span>
            {error}
          </span>
        </div>
      )}

      <div className="admin-content-card">
        <div className="admin-card-title-row">
          <div>
            <span>
              BACKUP ARCHIVES
            </span>

            <h3>
              Available backups
            </h3>
          </div>

          <button
            type="button"
            className="admin-icon-button"
            onClick={() =>
              void load()
            }
            aria-label="Refresh backups"
          >
            <RefreshCw
              size={15}
            />
          </button>
        </div>

        {backups ===
          null && (
          <div className="admin-inline-loading">
            <RefreshCw
              size={16}
              className="admin-spin"
            />

            Loading backups…
          </div>
        )}

        {backups !==
          null &&
          backups.length ===
            0 && (
          <div className="admin-empty-state small">
            <DatabaseBackup
              size={20}
            />

            <strong>
              No backups found
            </strong>

            <span>
              Create a backup to see
              it here.
            </span>
          </div>
        )}

        {backups &&
          backups.length >
            0 && (
          <div className="admin-backup-list">
            {backups.map(
              (backup) => (
                <div
                  className="admin-backup-row"
                  key={
                    backup.filename
                  }
                >
                  <div className="admin-backup-icon">
                    <Server
                      size={16}
                    />
                  </div>

                  <div className="admin-backup-info">
                    <strong>
                      {
                        backup.filename
                      }
                    </strong>

                    <span>
                      {(
                        backup.sizeBytes /
                        1024 /
                        1024
                      ).toFixed(
                        2,
                      )}{' '}
                      MB ·{' '}
                      {new Date(
                        backup.createdAt,
                      ).toLocaleString()}
                    </span>
                  </div>

                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className="admin-secondary-button"
                      disabled={
                        busy ===
                        backup.filename
                      }
                      onClick={() =>
                        void downloadBackup(
                          backup.filename,
                        )
                      }
                    >
                      <Download
                        size={13}
                      />

                      <span>
                        Download
                      </span>
                    </button>

                    <button
                      type="button"
                      className="admin-danger-button"
                      disabled={
                        busy ===
                        backup.filename
                      }
                      onClick={() =>
                        void wipeMedia(
                          backup.filename,
                        )
                      }
                    >
                      <Trash2
                        size={13}
                      />

                      <span>
                        {busy ===
                        backup.filename
                          ? 'Wiping…'
                          : 'Wipe media'}
                      </span>
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* =========================================================
   PLAN MANAGEMENT
   ========================================================= */

function PlanManagementPanel() {
  const [
    plans,
    setPlans,
  ] =
    useState<Plan[] | null>(
      null,
    )

  const [
    editing,
    setEditing,
  ] =
    useState<Partial<Plan> | null>(
      null,
    )

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    message,
    setMessage,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  async function load() {
    setError('')

    try {
      const response =
        await api.adminPlans()

      setPlans(
        Array.isArray(
          response?.data
            ?.plans,
        )
          ? (response.data.plans as Plan[])
          : [],
      )
    } catch (
      reason
    ) {
      setPlans([])

      setError(
        reason instanceof Error
          ? reason.message
          : 'Failed to load plans.',
      )
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function startCreate() {
    setMessage('')
    setError('')

    setEditing({
      name: '',
      description: '',
      price: 0,
      durationDays: 30,
      accessLevel: 'FULL',
      isActive: true,
      maxGroups: null,
      maxMembersPerGroup:
        null,
      maxCommunities: null,
      maxGuestsPerGroup:
        null,
    })
  }

  function startEdit(
    plan: Plan,
  ) {
    setMessage('')
    setError('')

    setEditing({
      ...plan,
    })
  }

  function numberOrNull(
    value: string,
  ) {
    if (!value.trim()) {
      return null
    }

    const number =
      Number(value)

    return Number.isFinite(
      number,
    )
      ? number
      : null
  }

  async function savePlan() {
    if (!editing) {
      return
    }

    const planName =
      String(
        editing.name ||
          '',
      ).trim()

    if (!planName) {
      setError(
        'Plan name is required.',
      )
      return
    }

    const payload = {
      name: planName,

      description:
        String(
          editing.description ||
            '',
        ).trim() ||
        undefined,

      price: Number(
        editing.price ??
          0,
      ),

      durationDays:
        Number(
          editing.durationDays ??
            30,
        ),

      accessLevel:
        (editing.accessLevel ||
          'FULL') as
          | 'FULL'
          | 'READONLY'
          | 'LOCKED',

      isActive:
        editing.isActive !==
        false,

      maxGroups:
        editing.maxGroups ??
        null,

      maxMembersPerGroup:
        editing.maxMembersPerGroup ??
        null,

      maxCommunities:
        editing.maxCommunities ??
        null,

      maxGuestsPerGroup:
        editing.maxGuestsPerGroup ??
        null,
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (editing.id) {
        await api.updatePlan(
          editing.id,
          payload,
        )

        setMessage(
          'Plan updated successfully.',
        )
      } else {
        await api.createPlan(
          payload,
        )

        setMessage(
          'Plan created successfully.',
        )
      }

      setEditing(null)

      await load()
    } catch (
      reason
    ) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to save plan.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function togglePlan(
    plan: Plan,
  ) {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await api.updatePlan(
        plan.id,
        {
          isActive:
            !plan.isActive,
        },
      )

      setMessage(
        `Plan ${
          plan.isActive
            ? 'deactivated'
            : 'activated'
        } successfully.`,
      )

      await load()
    } catch (
      reason
    ) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to change plan status.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-section-content">
      <AdminSectionHeader
        eyebrow="PLANS"
        title="Plans & limits"
        description="Create plans, manage access levels and control feature limits."
        action={
          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() =>
                void load()
              }
            >
              <RefreshCw
                size={13}
              />
              Refresh
            </button>

            <button
              type="button"
              className="admin-primary-button"
              onClick={
                startCreate
              }
            >
              <CreditCard
                size={13}
              />
              Create plan
            </button>
          </div>
        }
      />

      {message && (
        <div className="admin-success-message">
          <Check size={14} />
          <span>
            {message}
          </span>
        </div>
      )}

      {error && (
        <div className="admin-error-message">
          <AlertTriangle
            size={14}
          />
          <span>
            {error}
          </span>
        </div>
      )}

      {editing && (
        <div className="admin-form-card">
          <div className="admin-card-title-row">
            <div>
              <span>
                {editing.id
                  ? 'EDIT PLAN'
                  : 'NEW PLAN'}
              </span>

              <h3>
                {editing.id
                  ? 'Update plan'
                  : 'Create plan'}
              </h3>
            </div>

            <button
              type="button"
              className="admin-icon-button"
              onClick={() =>
                setEditing(null)
              }
            >
              <X size={15} />
            </button>
          </div>

          <div className="admin-form-grid">
            <label>
              <span>
                Plan name
              </span>

              <input
                value={String(
                  editing.name ||
                    '',
                )}
                onChange={(
                  event,
                ) =>
                  setEditing(
                    (
                      previous,
                    ) =>
                      previous
                        ? {
                            ...previous,
                            name:
                              event
                                .target
                                .value,
                          }
                        : previous,
                  )
                }
              />
            </label>

            <label>
              <span>
                Price (₹)
              </span>

              <input
                type="number"
                min={0}
                step="0.01"
                value={
                  editing.price ??
                  0
                }
                onChange={(
                  event,
                ) =>
                  setEditing(
                    (
                      previous,
                    ) =>
                      previous
                        ? {
                            ...previous,
                            price:
                              Number(
                                event
                                  .target
                                  .value,
                              ),
                          }
                        : previous,
                  )
                }
              />
            </label>

            <label>
              <span>
                Duration (days)
              </span>

              <input
                type="number"
                min={1}
                value={
                  editing.durationDays ??
                  30
                }
                onChange={(
                  event,
                ) =>
                  setEditing(
                    (
                      previous,
                    ) =>
                      previous
                        ? {
                            ...previous,
                            durationDays:
                              Number(
                                event
                                  .target
                                  .value,
                              ),
                          }
                        : previous,
                  )
                }
              />
            </label>

            <label>
              <span>
                Access level
              </span>

              <select
                value={
                  editing.accessLevel ||
                  'FULL'
                }
                onChange={(
                  event,
                ) =>
                  setEditing(
                    (
                      previous,
                    ) =>
                      previous
                        ? {
                            ...previous,
                            accessLevel:
                              event
                                .target
                                .value as Plan['accessLevel'],
                          }
                        : previous,
                  )
                }
              >
                <option value="FULL">
                  FULL
                </option>

                <option value="READONLY">
                  READONLY
                </option>

                <option value="LOCKED">
                  LOCKED
                </option>
              </select>
            </label>

            <label className="admin-full-field">
              <span>
                Description
              </span>

              <textarea
                rows={3}
                value={String(
                  editing.description ||
                    '',
                )}
                onChange={(
                  event,
                ) =>
                  setEditing(
                    (
                      previous,
                    ) =>
                      previous
                        ? {
                            ...previous,
                            description:
                              event
                                .target
                                .value,
                          }
                        : previous,
                  )
                }
              />
            </label>
          </div>

          <div className="admin-limits-heading">
            <span>
              FEATURE LIMITS
            </span>

            <p>
              Empty values mean unlimited.
            </p>
          </div>

          <div className="admin-limit-grid">
            {(
              [
                [
                  'maxGroups',
                  'Maximum groups',
                ],
                [
                  'maxMembersPerGroup',
                  'Members per group',
                ],
                [
                  'maxCommunities',
                  'Maximum communities',
                ],
                [
                  'maxGuestsPerGroup',
                  'Guests per group',
                ],
              ] as const
            ).map(
              ([key, label]) => (
                <label
                  key={key}
                >
                  <span>
                    {label}
                  </span>

                  <input
                    type="number"
                    min={1}
                    value={
                      editing[key] ??
                      ''
                    }
                    placeholder="Unlimited"
                    onChange={(
                      event,
                    ) =>
                      setEditing(
                        (
                          previous,
                        ) =>
                          previous
                            ? {
                                ...previous,
                                [key]:
                                  numberOrNull(
                                    event
                                      .target
                                      .value,
                                  ),
                              }
                            : previous,
                      )
                    }
                  />
                </label>
              ),
            )}
          </div>

          <label className="admin-check-row">
            <input
              type="checkbox"
              checked={
                editing.isActive !==
                false
              }
              onChange={(
                event,
              ) =>
                setEditing(
                  (
                    previous,
                  ) =>
                    previous
                      ? {
                          ...previous,
                          isActive:
                            event
                              .target
                              .checked,
                        }
                      : previous,
                )
              }
            />

            <span>
              Active plan
            </span>
          </label>

          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() =>
                setEditing(null)
              }
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="admin-primary-button"
              onClick={() =>
                void savePlan()
              }
              disabled={saving}
            >
              {saving
                ? 'Saving…'
                : editing.id
                  ? 'Save changes'
                  : 'Create plan'}
            </button>
          </div>
        </div>
      )}

      <div className="admin-content-card">
        <div className="admin-card-title-row">
          <div>
            <span>
              CURRENT PLANS
            </span>

            <h3>
              Available plans
            </h3>
          </div>

          <span className="admin-card-count">
            {plans?.length ??
              0}
          </span>
        </div>

        {plans ===
          null && (
          <div className="admin-inline-loading">
            <RefreshCw
              size={16}
              className="admin-spin"
            />
            Loading plans…
          </div>
        )}

        {plans !== null &&
          plans.length ===
            0 && (
          <div className="admin-empty-state small">
            <CreditCard
              size={20}
            />

            <strong>
              No plans found
            </strong>

            <span>
              Create a plan to enable
              subscriptions.
            </span>
          </div>
        )}

        {plans &&
          plans.length >
            0 && (
          <div className="admin-plan-list">
            {plans.map(
              (plan) => (
                <div
                  className="admin-plan-row"
                  key={
                    plan.id
                  }
                >
                  <div className="admin-plan-icon">
                    <CreditCard
                      size={17}
                    />
                  </div>

                  <div className="admin-plan-main">
                    <div className="admin-plan-title">
                      <strong>
                        {
                          plan.name
                        }
                      </strong>

                      <span
                        className={
                          plan.isActive
                            ? 'admin-status active'
                            : 'admin-status'
                        }
                      >
                        {plan.isActive
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </div>

                    <span>
                      ₹
                      {formatCurrency(
                        plan.price ??
                          0,
                      )}{' '}
                      ·{' '}
                      {plan.durationDays ??
                        '—'}{' '}
                      days ·{' '}
                      {accessLabel(
                        plan.accessLevel,
                      )}
                    </span>

                    <small>
                      {plan.description ||
                        'No description'}
                    </small>
                  </div>

                  <div className="admin-plan-limits">
                    <span>
                      Groups:{' '}
                      {plan.maxGroups ??
                        '∞'}
                    </span>

                    <span>
                      Members:{' '}
                      {plan.maxMembersPerGroup ??
                        '∞'}
                    </span>

                    <span>
                      Communities:{' '}
                      {plan.maxCommunities ??
                        '∞'}
                    </span>

                    <span>
                      Guests:{' '}
                      {plan.maxGuestsPerGroup ??
                        '∞'}
                    </span>
                  </div>

                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className="admin-secondary-button compact"
                      disabled={
                        saving
                      }
                      onClick={() =>
                        startEdit(
                          plan,
                        )
                      }
                    >
                      <Pencil
                        size={12}
                      />

                      Edit
                    </button>

                    <button
                      type="button"
                      className="admin-secondary-button compact"
                      disabled={
                        saving
                      }
                      onClick={() =>
                        void togglePlan(
                          plan,
                        )
                      }
                    >
                      {plan.isActive
                        ? 'Deactivate'
                        : 'Activate'}
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* =========================================================
   PAYMENT METHODS
   ========================================================= */

function PaymentMethodsPanel() {
  const [
    methods,
    setMethods,
  ] = useState<
    PaymentMethod[]
  >([])

  const [
    editing,
    setEditing,
  ] =
    useState<Partial<PaymentMethod> | null>(
      null,
    )

  const [
    busy,
    setBusy,
  ] = useState(false)

  const [
    message,
    setMessage,
  ] = useState('')

  async function load() {
    try {
      const response =
        await api.paymentMethods()

      setMethods(
        Array.isArray(
          response?.data
            ?.paymentMethods,
        )
          ? (response.data.paymentMethods as PaymentMethod[])
          : [],
      )
    } catch (
      reason
    ) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : 'Unable to load payment methods.',
      )
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function save() {
    if (
      !editing ||
      !String(
        editing.name ||
          '',
      ).trim()
    ) {
      setMessage(
        'Payment method name is required.',
      )

      return
    }

    setBusy(true)
    setMessage('')

    try {
      const payload = {
        name: String(
          editing.name,
        ).trim(),

        type:
          editing.type ||
          'UPI',

        description:
          editing.description ||
          undefined,

        upiId:
          editing.upiId ||
          undefined,

        paymentNumber:
          editing.paymentNumber ||
          undefined,

        isDefault:
          Boolean(
            editing.isDefault,
          ),

        isActive:
          editing.isActive !==
          false,
      }

      if (editing.id) {
        await api.updatePaymentMethod(
          editing.id,
          payload,
        )
      } else {
        await api.createPaymentMethod(
          payload,
        )
      }

      setEditing(null)

      setMessage(
        'Payment method saved.',
      )

      await load()
    } catch (
      reason
    ) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : 'Unable to save payment method.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function makeDefault(
    method: PaymentMethod,
  ) {
    setBusy(true)
    setMessage('')

    try {
      await api.updatePaymentMethod(
        method.id,
        {
          isDefault: true,
          isActive: true,
        },
      )

      setMessage(
        'Default payment method updated.',
      )

      await load()
    } catch (
      reason
    ) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : 'Unable to set default method.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-content-card admin-payment-methods">
      <div className="admin-card-title-row">
        <div>
          <span>
            PAYMENT METHODS
          </span>

          <h3>
            UPI & payment configuration
          </h3>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={() =>
            setEditing({
              name: 'UPI',
              type: 'UPI',
              description: '',
              upiId: '',
              paymentNumber:
                '',
              isDefault: true,
              isActive: true,
            })
          }
        >
          <CreditCard
            size={13}
          />

          Add method
        </button>
      </div>

      {message && (
        <div className="admin-info-message">
          <span>
            {message}
          </span>
        </div>
      )}

      <div className="admin-payment-method-list">
        {methods.map(
          (method) => (
            <div
              className="admin-payment-method-row"
              key={
                method.id
              }
            >
              <div className="admin-payment-method-icon">
                <WalletCards
                  size={17}
                />
              </div>

              <div className="admin-payment-method-main">
                <div>
                  <strong>
                    {
                      method.name
                    }
                  </strong>

                  {method.isDefault && (
                    <span className="admin-status active">
                      Default
                    </span>
                  )}
                </div>

                <span>
                  {method.type ||
                    'UPI'}
                  {' · '}
                  {method.upiId ||
                    method.paymentNumber ||
                    'No payment address configured'}
                </span>

                {method.description && (
                  <small>
                    {
                      method.description
                    }
                  </small>
                )}
              </div>

              <div className="admin-row-actions">
                <button
                  type="button"
                  className="admin-secondary-button compact"
                  onClick={() =>
                    setEditing({
                      ...method,
                    })
                  }
                >
                  <Pencil
                    size={12}
                  />

                  Edit
                </button>

                {!method.isDefault && (
                  <button
                    type="button"
                    className="admin-secondary-button compact"
                    disabled={
                      busy
                    }
                    onClick={() =>
                      void makeDefault(
                        method,
                      )
                    }
                  >
                    Make default
                  </button>
                )}
              </div>
            </div>
          ),
        )}

        {methods.length ===
          0 && (
          <div className="admin-empty-state small">
            <WalletCards
              size={20}
            />

            <strong>
              No payment methods
            </strong>

            <span>
              Add an active UPI method
              for subscriptions.
            </span>
          </div>
        )}
      </div>

      {editing && (
        <div className="admin-form-card nested">
          <div className="admin-card-title-row">
            <div>
              <span>
                PAYMENT METHOD
              </span>

              <h3>
                {editing.id
                  ? 'Edit method'
                  : 'Add method'}
              </h3>
            </div>

            <button
              type="button"
              className="admin-icon-button"
              onClick={() =>
                setEditing(null)
              }
            >
              <X size={15} />
            </button>
          </div>

          <div className="admin-form-grid">
            <label>
              <span>
                Name
              </span>

              <input
                value={
                  editing.name ||
                  ''
                }
                onChange={(
                  event,
                ) =>
                  setEditing(
                    (
                      previous,
                    ) =>
                      previous
                        ? {
                            ...previous,
                            name:
                              event
                                .target
                                .value,
                          }
                        : previous,
                  )
                }
              />
            </label>

            <label>
              <span>
                Type
              </span>

              <select
                value={
                  editing.type ||
                  'UPI'
                }
                onChange={(
                  event,
                ) =>
                  setEditing(
                    (
                      previous,
                    ) =>
                      previous
                        ? {
                            ...previous,
                            type:
                              event
                                .target
                                .value,
                          }
                        : previous,
                  )
                }
              >
                <option value="UPI">
                  UPI
                </option>

                <option value="BANK">
                  BANK
                </option>

                <option value="OTHER">
                  OTHER
                </option>
              </select>
            </label>

            <label>
              <span>
                UPI ID
              </span>

              <input
                value={
                  editing.upiId ||
                  ''
                }
                onChange={(
                  event,
                ) =>
                  setEditing(
                    (
                      previous,
                    ) =>
                      previous
                        ? {
                            ...previous,
                            upiId:
                              event
                                .target
                                .value,
                          }
                        : previous,
                  )
                }
                placeholder="example@upi"
              />
            </label>

            <label>
              <span>
                Payment number
              </span>

              <input
                value={
                  editing.paymentNumber ||
                  ''
                }
                onChange={(
                  event,
                ) =>
                  setEditing(
                    (
                      previous,
                    ) =>
                      previous
                        ? {
                            ...previous,
                            paymentNumber:
                              event
                                .target
                                .value,
                          }
                        : previous,
                  )
                }
              />
            </label>

            <label className="admin-full-field">
              <span>
                Description
              </span>

              <input
                value={
                  editing.description ||
                  ''
                }
                onChange={(
                  event,
                ) =>
                  setEditing(
                    (
                      previous,
                    ) =>
                      previous
                        ? {
                            ...previous,
                            description:
                              event
                                .target
                                .value,
                          }
                        : previous,
                  )
                }
              />
            </label>
          </div>

          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() =>
                setEditing(null)
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="admin-primary-button"
              disabled={
                busy
              }
              onClick={() =>
                void save()
              }
            >
              {busy
                ? 'Saving…'
                : 'Save method'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================================
   SITE SETTINGS PANEL
   ========================================================= */

function SiteSettingsPanel({
  liveSiteSettings,
}: {
  liveSiteSettings: ReturnType<
    typeof useSiteSettings
  >['settings']
}) {
  const [
    settings,
    setSettings,
  ] =
    useState<
      Record<string, unknown>
    >({})

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState<
    string | null
  >(null)

  const [
    message,
    setMessage,
  ] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response =
        await api.siteSettings()

      const next: Record<
        string,
        unknown
      > = {
        'site.name':
          liveSiteSettings.name ||
          'FedChat',

        'site.tagline':
          liveSiteSettings.tagline ||
          '',

        'site.description':
          liveSiteSettings.description ||
          '',

        'site.supportEmail':
          liveSiteSettings.supportEmail ||
          '',

        'site.guestJoinEnabled':
          liveSiteSettings.guestJoinEnabled,

        'site.registrationEnabled':
          liveSiteSettings.registrationEnabled,

        'site.primaryColor':
          liveSiteSettings.primaryColor ||
          '#168a57',

        'site.accentColor':
          liveSiteSettings.accentColor ||
          '#1da968',

        'site.logoUrl':
          liveSiteSettings.logoUrl ||
          '',

        'site.faviconUrl':
          liveSiteSettings.faviconUrl ||
          '',

        'site.language':
          liveSiteSettings.language ||
          'en',

        'site.alertLanguage':
          liveSiteSettings.alertLanguage ||
          'en',

        'site.theme':
          liveSiteSettings.theme ||
          'light',

        'site.maintenanceMode':
          liveSiteSettings.maintenanceMode,
      }

      for (
        const item of
          response.data
            ?.settings ||
        []
      ) {
        next[
          String(
            item.key,
          )
        ] = item.value
      }

      setSettings(
        next,
      )
    } catch (
      reason
    ) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : 'Unable to load site settings.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [
    liveSiteSettings.name,
    liveSiteSettings.tagline,
    liveSiteSettings.logoUrl,
  ])

  async function save(
    key: string,
  ) {
    setSaving(key)
    setMessage('')

    try {
      await api.updateSiteSetting(
        key,
        settings[key],
      )

      window.dispatchEvent(
        new CustomEvent(
          'fedchat:site-settings-changed',
        ),
      )

      setMessage(
        `${key} saved successfully.`,
      )
    } catch (
      reason
    ) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : 'Unable to save site setting.',
      )
    } finally {
      setSaving(null)
    }
  }

  function update(
    key: string,
    value: unknown,
  ) {
    setSettings(
      (previous) => ({
        ...previous,
        [key]: value,
      }),
    )
  }

  function textField(
    key: string,
    label: string,
    placeholder = '',
  ) {
    return (
      <div
        className="admin-setting-field"
        key={key}
      >
        <div className="admin-setting-label">
          <span>
            {label}
          </span>

          <button
            type="button"
            className="admin-text-save"
            disabled={
              saving === key
            }
            onClick={() =>
              void save(key)
            }
          >
            {saving === key
              ? 'Saving…'
              : 'Save'}
          </button>
        </div>

        <input
          value={String(
            settings[key] ??
              '',
          )}
          placeholder={
            placeholder
          }
          onChange={(
            event,
          ) =>
            update(
              key,
              event.target
                .value,
            )
          }
        />
      </div>
    )
  }

  function toggleField(
    key: string,
    label: string,
    description: string,
  ) {
    const enabled =
      Boolean(
        settings[key],
      )

    return (
      <div
        className="admin-setting-toggle"
        key={key}
      >
        <div className="admin-setting-toggle-copy">
          <strong>
            {label}
          </strong>

          <span>
            {description}
          </span>
        </div>

        <button
          type="button"
          className={
            enabled
              ? 'admin-switch on'
              : 'admin-switch'
          }
          aria-pressed={
            enabled
          }
          onClick={() =>
            update(
              key,
              !enabled,
            )
          }
        >
          <span />
        </button>

        <button
          type="button"
          className="admin-text-save"
          disabled={
            saving === key
          }
          onClick={() =>
            void save(key)
          }
        >
          {saving === key
            ? 'Saving…'
            : 'Save'}
        </button>
      </div>
    )
  }

  return (
    <div className="admin-section-content">
      <AdminSectionHeader
        eyebrow="WEBSITE"
        title="Site settings"
        description="Manage branding, registration, guest access and platform availability."
        action={
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() =>
              void load()
            }
          >
            <RefreshCw
              size={13}
            />
            Refresh
          </button>
        }
      />

      {message && (
        <div className="admin-info-message">
          <span>
            {message}
          </span>
        </div>
      )}

      {loading ? (
        <div className="admin-content-card">
          <div className="admin-inline-loading">
            <RefreshCw
              size={16}
              className="admin-spin"
            />

            Loading site settings…
          </div>
        </div>
      ) : (
        <>
          <div className="admin-content-card">
            <div className="admin-card-title-row">
              <div>
                <span>
                  BRANDING
                </span>

                <h3>
                  Website identity
                </h3>
              </div>

              <div className="admin-card-icon">
                <Globe2 size={16} />
              </div>
            </div>

            {/* LIVE BRAND PREVIEW */}

            <div className="admin-brand-preview">
              <div className="admin-brand-preview-logo">
                {String(
                  settings[
                    'site.logoUrl'
                  ] || '',
                ).trim() ? (
                  <img
                    src={assetUrl(
                      String(
                        settings[
                          'site.logoUrl'
                        ],
                      ),
                    )}
                    alt={
                      String(
                        settings[
                          'site.name'
                        ] ||
                          'FedChat',
                      )
                    }
                    onError={(
                      event,
                    ) => {
                      event.currentTarget.style.display =
                        'none'
                    }}
                  />
                ) : (
                  <span>
                    {String(
                      settings[
                        'site.name'
                      ] ||
                        'FedChat',
                    )
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <strong>
                  {String(
                    settings[
                      'site.name'
                    ] ||
                      'FedChat',
                  )}
                </strong>

                <span>
                  {String(
                    settings[
                      'site.tagline'
                    ] ||
                      'Private communication',
                  )}
                </span>
              </div>
            </div>

            <div className="admin-setting-grid">
              {textField(
                'site.name',
                'Site name',
              )}

              {textField(
                'site.tagline',
                'Tagline',
              )}

              {textField(
                'site.supportEmail',
                'Support email',
                'support@example.com',
              )}

              {textField(
                'site.primaryColor',
                'Primary color',
                '#168a57',
              )}

              {textField(
                'site.accentColor',
                'Accent color',
                '#1da968',
              )}

              {textField(
                'site.logoUrl',
                'Platform logo URL',
                '/uploads/logo.png',
              )}

              {textField(
                'site.faviconUrl',
                'Favicon URL',
                '/favicon.svg',
              )}

              {textField(
                'site.language',
                'Platform language',
                'en',
              )}

              {textField(
                'site.alertLanguage',
                'Alert language',
                'en',
              )}

              {textField(
                'site.theme',
                'Platform theme',
                'light',
              )}

              <div className="admin-setting-field admin-full-field">
                <div className="admin-setting-label">
                  <span>
                    Site description
                  </span>

                  <button
                    type="button"
                    className="admin-text-save"
                    disabled={
                      saving ===
                      'site.description'
                    }
                    onClick={() =>
                      void save(
                        'site.description',
                      )
                    }
                  >
                    {saving ===
                    'site.description'
                      ? 'Saving…'
                      : 'Save'}
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={String(
                    settings[
                      'site.description'
                    ] ??
                      '',
                  )}
                  onChange={(
                    event,
                  ) =>
                    update(
                      'site.description',
                      event.target
                        .value,
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div className="admin-content-card">
            <div className="admin-card-title-row">
              <div>
                <span>
                  PLATFORM ACCESS
                </span>

                <h3>
                  Access controls
                </h3>
              </div>

              <div className="admin-card-icon">
                <ShieldCheck
                  size={16}
                />
              </div>
            </div>

            <div className="admin-settings-toggle-list">
              {toggleField(
                'site.guestJoinEnabled',
                'Guest join links',
                'Allow public group links to create read-only guest accounts.',
              )}

              {toggleField(
                'site.registrationEnabled',
                'User registration',
                'Allow new users to create standard accounts.',
              )}

              {toggleField(
                'site.maintenanceMode',
                'Maintenance mode',
                'Display the platform as temporarily unavailable to normal users.',
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* =========================================================
   PAYMENT REQUEST PANEL
   ========================================================= */

function PaymentRequestsPanel({
  requests,
  busy,
  onApprove,
  onReject,
}: {
  requests:
    | PaymentRequest[]
    | null

  busy: string | null

  onApprove: (
    id: string,
  ) => void

  onReject: (
    id: string,
  ) => void
}) {
  return (
    <div className="admin-content-card">
      <div className="admin-card-title-row">
        <div>
          <span>
            SUBSCRIPTIONS
          </span>

          <h3>
            Pending payment requests
          </h3>
        </div>

        <span className="admin-card-count">
          {requests?.length ??
            0}
        </span>
      </div>

      {requests ===
        null && (
        <div className="admin-inline-loading">
          <RefreshCw
            size={16}
            className="admin-spin"
          />
          Loading requests…
        </div>
      )}

      {requests !==
        null &&
        requests.length ===
          0 && (
          <div className="admin-empty-state small">
            <Check size={20} />

            <strong>
              No pending requests
            </strong>

            <span>
              All subscription payments
              have been processed.
            </span>
          </div>
        )}

      {requests &&
        requests.length >
          0 && (
          <div className="admin-payment-list">
            {requests.map(
              (request) => (
                <div
                  className="admin-payment-row"
                  key={
                    request.id
                  }
                >
                  <div className="admin-user-avatar">
                    {getInitials(
                      request
                        .user
                        .firstName,
                      request
                        .user
                        .lastName,
                      request
                        .user
                        .username,
                    )}
                  </div>

                  <div className="admin-payment-main">
                    <div className="admin-payment-title">
                      <strong>
                        {request
                          .user
                          .firstName ||
                          request
                            .user
                            .username}{' '}
                        {
                          request
                            .user
                            .lastName
                        }
                      </strong>

                      <span className="admin-status pending">
                        Pending
                      </span>
                    </div>

                    <span>
                      Plan:{' '}
                      {
                        request
                          .plan
                          .name
                      }
                    </span>

                    <small>
                      Amount: ₹
                      {formatCurrency(
                        request.amount,
                      )}

                      {request.transactionId
                        ? ` · UTR: ${request.transactionId}`
                        : ''}

                      {request
                        .user
                        .email
                        ? ` · ${request.user.email}`
                        : ''}
                    </small>
                  </div>

                  <div className="admin-payment-actions">
                    <button
                      type="button"
                      className="admin-approve-button"
                      disabled={
                        busy ===
                        request.id
                      }
                      onClick={() =>
                        onApprove(
                          request.id,
                        )
                      }
                    >
                      <Check size={13} />

                      Approve
                    </button>

                    <button
                      type="button"
                      className="admin-danger-button"
                      disabled={
                        busy ===
                        request.id
                      }
                      onClick={() =>
                        onReject(
                          request.id,
                        )
                      }
                    >
                      <X size={13} />

                      Reject
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
    </div>
  )
}

/* =========================================================
   USERS PANEL
   ========================================================= */

function UsersPanel({
  users,
  total,
  page,
  totalPages,
  pageSize,
  busy,
  onPageChange,
  onPageSizeChange,
  onToggle,
}: {
  users:
    | AdminUser[]
    | null

  total: number
  page: number
  totalPages: number
  pageSize: number

  busy: string | null

  onPageChange: (
    page: number,
  ) => void

  onPageSizeChange: (
    size: number,
  ) => void

  onToggle: (
    user: AdminUser,
  ) => void
}) {
  return (
    <div className="admin-section-content">
      <AdminSectionHeader
        eyebrow="USERS"
        title="User management"
        description={`${formatNumber(total)} registered users across the platform.`}
        action={
          <label className="admin-page-size">
            <span>
              Rows
            </span>

            <select
              value={pageSize}
              onChange={(
                event,
              ) =>
                onPageSizeChange(
                  Number(
                    event.target
                      .value,
                  ),
                )
              }
            >
              <option value={5}>
                5
              </option>

              <option value={10}>
                10
              </option>

              <option value={20}>
                20
              </option>

              <option value={50}>
                50
              </option>
            </select>
          </label>
        }
      />

      <div className="admin-content-card">
        <div className="admin-card-title-row">
          <div>
            <span>
              ACCOUNTS
            </span>

            <h3>
              Users
            </h3>
          </div>

          <span className="admin-card-count">
            {formatNumber(
              total,
            )}
          </span>
        </div>

        {users ===
          null && (
          <div className="admin-inline-loading">
            <RefreshCw
              size={16}
              className="admin-spin"
            />
            Loading users…
          </div>
        )}

        {users !==
          null &&
          users.length ===
            0 && (
          <div className="admin-empty-state small">
            <Users size={20} />

            <strong>
              No users found
            </strong>

            <span>
              There are no users in
              this page.
            </span>
          </div>
        )}

        {users &&
          users.length >
            0 && (
          <div className="admin-user-list">
            {users.map(
              (user) => (
                <div
                  className="admin-user-row"
                  key={
                    user.id
                  }
                >
                  <div className="admin-user-avatar">
                    {getInitials(
                      user.firstName,
                      user.lastName,
                      user.username,
                    )}
                  </div>

                  <div className="admin-user-main">
                    <strong>
                      {
                        user.firstName
                      }{' '}
                      {
                        user.lastName
                      }
                    </strong>

                    <span>
                      @
                      {
                        user.username
                      }
                    </span>
                  </div>

                  <span
                    className={
                      user.status ===
                      'ACTIVE'
                        ? 'admin-status active'
                        : 'admin-status suspended'
                    }
                  >
                    {user.status}
                  </span>

                  <button
                    type="button"
                    className={
                      user.status ===
                      'ACTIVE'
                        ? 'admin-secondary-button compact'
                        : 'admin-primary-button compact'
                    }
                    disabled={
                      busy ===
                      user.id
                    }
                    onClick={() =>
                      onToggle(
                        user,
                      )
                    }
                  >
                    {user.status ===
                    'ACTIVE'
                      ? 'Suspend'
                      : 'Activate'}
                  </button>
                </div>
              ),
            )}
          </div>
        )}

        <div className="admin-pagination">
          <button
            type="button"
            className="admin-secondary-button"
            disabled={
              page <= 1
            }
            onClick={() =>
              onPageChange(
                Math.max(
                  1,
                  page - 1,
                ),
              )
            }
          >
            <ChevronLeft
              size={13}
            />

            Previous
          </button>

          <div className="admin-pagination-info">
            <strong>
              Page {page}
            </strong>

            <span>
              of{' '}
              {
                totalPages
              }
            </span>
          </div>

          <button
            type="button"
            className="admin-secondary-button"
            disabled={
              page >=
              totalPages
            }
            onClick={() =>
              onPageChange(
                Math.min(
                  totalPages,
                  page + 1,
                ),
              )
            }
          >
            Next

            <ChevronRight
              size={13}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   MAIN ADMIN MODULE
   ========================================================= */

export function AdminModule({
  initialSection = 'overview',
  onSectionChange,
}: {
  initialSection?: AdminSection
  onSectionChange?: (
    section: AdminSection,
  ) => void
}) {
  /* =======================================================
     LIVE SITE SETTINGS
     ======================================================= */

  const {
    settings: siteSettings,
  } = useSiteSettings()

  useApplySiteSettings(
    siteSettings,
  )

  /* =======================================================
     DYNAMIC BRANDING
     ======================================================= */

  const siteName =
    siteSettings?.name?.trim() ||
    'FedChat'

  const siteTagline =
    siteSettings?.tagline?.trim() ||
    'Private communication'

  const siteLogo =
    siteSettings?.logoUrl
      ? assetUrl(
          siteSettings.logoUrl,
        )
      : ''

  const siteInitial =
    siteName
      .charAt(0)
      .toUpperCase() ||
    'F'

  /* =======================================================
     ADMIN STATE
     ======================================================= */

  const [
    adminTab,
    setAdminTab,
  ] =
    useState<AdminSection>(
      initialSection,
    )

  const [
    analytics,
    setAnalytics,
  ] =
    useState<Analytics | null>(
      null,
    )

  const [
    requests,
    setRequests,
  ] =
    useState<
      PaymentRequest[] | null
    >(null)

  const [
    users,
    setUsers,
  ] =
    useState<AdminUser[] | null>(
      null,
    )

  const [
    userPage,
    setUserPage,
  ] = useState(1)

  const [
    userPageSize,
    setUserPageSize,
  ] = useState(10)

  const [
    userTotal,
    setUserTotal,
  ] = useState(0)

  const [
    userTotalPages,
    setUserTotalPages,
  ] = useState(1)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    busy,
    setBusy,
  ] = useState<
    string | null
  >(null)

  const [
    mobileNavigationOpen,
    setMobileNavigationOpen,
  ] = useState(false)

  /* =======================================================
     USERS
     ======================================================= */

  async function loadUsers(
    page = userPage,
    pageSize = userPageSize,
  ) {
    try {
      const response =
        await api.adminUsers(
          page,
          pageSize,
        )

      setUsers(
        Array.isArray(
          response?.data?.users,
        )
          ? (response.data.users as AdminUser[])
          : [],
      )

      setUserTotal(
        Number(
          response?.data
            ?.total || 0,
        ),
      )

      setUserTotalPages(
        Number(
          response?.data
            ?.totalPages ||
            1,
        ),
      )
    } catch {
      setUsers([])
      setUserTotal(0)
      setUserTotalPages(1)
    }
  }

  useEffect(() => {
    void loadUsers(
      userPage,
      userPageSize,
    )
  }, [
    userPage,
    userPageSize,
  ])

  /* =======================================================
     INITIAL SECTION SYNC
     ======================================================= */

  useEffect(() => {
    setAdminTab(
      initialSection,
    )
  }, [initialSection])

  /* =======================================================
     DASHBOARD DATA
     ======================================================= */

  async function loadDashboard() {
    setError(null)

    try {
      const response =
        await api.adminAnalytics()

      setAnalytics(
        response.data
          .analytics as Analytics,
      )
    } catch (
      reason
    ) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Failed to load analytics.',
      )
    }

    try {
      const response =
        await api.pendingPaymentRequests()

      setRequests(
        Array.isArray(
          response?.data
            ?.paymentRequests,
        )
          ? (response.data.paymentRequests as PaymentRequest[])
          : [],
      )
    } catch {
      setRequests([])
    }

    await loadUsers(
      userPage,
      userPageSize,
    )
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  /* =======================================================
     CHANGE ADMIN SECTION
     ======================================================= */

  function changeSection(
    section: AdminSection,
  ) {
    setAdminTab(section)

    onSectionChange?.(
      section,
    )

    setMobileNavigationOpen(
      false,
    )
  }

  /* =======================================================
     PAYMENT APPROVAL
     ======================================================= */

  async function approvePayment(
    id: string,
  ) {
    setBusy(id)
    setError(null)

    try {
      await api.approvePaymentRequest(
        id,
      )

      await loadDashboard()
    } catch (
      reason
    ) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Failed to approve payment request.',
      )
    } finally {
      setBusy(null)
    }
  }

  /* =======================================================
     PAYMENT REJECTION
     ======================================================= */

  async function rejectPayment(
    id: string,
  ) {
    const reason =
      window.prompt(
        'Rejection reason (required):',
      )

    if (
      !reason ||
      reason.trim().length <
        3
    ) {
      return
    }

    setBusy(id)
    setError(null)

    try {
      await api.rejectPaymentRequest(
        id,
        reason.trim(),
      )

      await loadDashboard()
    } catch (
      requestError
    ) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : 'Failed to reject payment request.',
      )
    } finally {
      setBusy(null)
    }
  }

  /* =======================================================
     USER STATUS
     ======================================================= */

  async function toggleUser(
    user: AdminUser,
  ) {
    const nextStatus =
      user.status === 'ACTIVE'
        ? 'SUSPENDED'
        : 'ACTIVE'

    setBusy(user.id)
    setError(null)

    try {
      await api.adminUpdateUserStatus(
        user.id,
        nextStatus,
      )

      setUsers(
        (previous) =>
          previous?.map(
            (item) =>
              item.id ===
              user.id
                ? {
                    ...item,
                    status:
                      nextStatus,
                  }
                : item,
          ) || null,
      )
    } catch (
      reason
    ) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Failed to update user status.',
      )
    } finally {
      setBusy(null)
    }
  }

  /* =======================================================
     OVERVIEW CARDS
     ======================================================= */

  const statCards =
    useMemo(() => {
      if (!analytics) {
        return []
      }

      return [
        {
          label: 'Users',
          value:
            analytics.users,
          description: `${analytics.activeUsers24h} active in 24h`,
          icon: (
            <Users
              size={18}
            />
          ),
        },

        {
          label:
            'Subscriptions',
          value:
            analytics.subscriptions,
          description: `${analytics.pendingPayments} pending payments`,
          icon: (
            <WalletCards
              size={18}
            />
          ),
        },

        {
          label: 'Rooms',
          value:
            analytics.rooms,
          description:
            'Direct + group',
          icon: (
            <BarChart3
              size={18}
            />
          ),
        },

        {
          label:
            'Messages',
          value:
            analytics.messages,
          description:
            'Total sent',
          icon: (
            <UserCheck
              size={18}
            />
          ),
        },
      ]
    }, [analytics])

  const currentSection =
    ADMIN_SECTIONS.find(
      (section) =>
        section.id ===
        adminTab,
    ) ||
    ADMIN_SECTIONS[0]

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <section className="admin-page">
      {/* =================================================
          MOBILE TOPBAR
          ================================================= */}

      <header className="admin-mobile-topbar">
        <div>
          <span>
            {siteName.toUpperCase()}
          </span>

          <strong>
            {
              currentSection.label
            }
          </strong>
        </div>

        <button
          type="button"
          className="admin-mobile-menu-button"
          onClick={() =>
            setMobileNavigationOpen(
              (
                current,
              ) => !current,
            )
          }
          aria-label="Open admin navigation"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* =================================================
          ADMIN SHELL
          ================================================= */}

      <div
        className={
          mobileNavigationOpen
            ? 'admin-shell mobile-navigation-open'
            : 'admin-shell'
        }
      >
        {/* ================================================
            SIDEBAR
            ================================================ */}

        <aside className="admin-sidebar">
          <div className="admin-brand">
            <div className="admin-brand-mark">
              {siteLogo ? (
                <img
                  src={siteLogo}
                  alt={siteName}
                  className="admin-brand-logo"
                  onError={(
                    event,
                  ) => {
                    event.currentTarget.style.display =
                      'none'
                  }}
                />
              ) : (
                <span className="admin-brand-fallback">
                  {siteInitial}
                </span>
              )}
            </div>

            <div>
              <strong>
                {siteName}
              </strong>

              <span>
                {siteTagline}
              </span>
            </div>
          </div>

          <div className="admin-sidebar-label">
            MANAGEMENT
          </div>

          <nav className="admin-sidebar-nav">
            {ADMIN_SECTIONS.map(
              (section) => (
                <button
                  type="button"
                  key={
                    section.id
                  }
                  className={
                    adminTab ===
                    section.id
                      ? 'admin-nav-item active'
                      : 'admin-nav-item'
                  }
                  onClick={() =>
                    changeSection(
                      section.id,
                    )
                  }
                >
                  <span className="admin-nav-icon">
                    {
                      section.icon
                    }
                  </span>

                  <span className="admin-nav-copy">
                    <strong>
                      {
                        section.label
                      }
                    </strong>

                    <small>
                      {
                        section.description
                      }
                    </small>
                  </span>

                  <ChevronRight
                    size={14}
                    className="admin-nav-arrow"
                  />
                </button>
              ),
            )}
          </nav>

          <div className="admin-sidebar-footer">
            <div className="admin-security-indicator">
              <Lock
                size={13}
              />

              <div>
                <strong>
                  Platform admin
                </strong>

                <span>
                  Protected console
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* ================================================
            MAIN
            ================================================ */}

        <main className="admin-main">
          <header className="admin-main-header">
            <div>
              <span>
                {siteName.toUpperCase()} ·
                PLATFORM ADMINISTRATION
              </span>

              <h1>
                {
                  currentSection.label
                }
              </h1>

              <p>
                {
                  currentSection.description
                }
              </p>
            </div>

            <div className="admin-header-right">
              <button
                type="button"
                className="admin-header-refresh"
                onClick={() =>
                  void loadDashboard()
                }
                aria-label="Refresh admin data"
                title="Refresh"
              >
                <RefreshCw
                  size={15}
                />
              </button>

              <div className="admin-platform-badge">
                <ShieldCheck
                  size={13}
                />

                <span>
                  PLATFORM ADMIN
                </span>
              </div>
            </div>
          </header>

          {/* ================================================
              ERROR
              ================================================ */}

          {error && (
            <div className="admin-global-error">
              <AlertTriangle
                size={15}
              />

              <span>
                {error}
              </span>

              <button
                type="button"
                onClick={() =>
                  setError(null)
                }
                aria-label="Dismiss error"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ================================================
              OVERVIEW
              ================================================ */}

          {adminTab ===
            'overview' && (
            <div className="admin-section-content">
              <AdminSectionHeader
                eyebrow="DASHBOARD"
                title="Platform overview"
                description="Monitor key platform metrics and actions."
              />

              {!analytics ? (
                <div className="admin-content-card">
                  <div className="admin-inline-loading">
                    <RefreshCw
                      size={16}
                      className="admin-spin"
                    />

                    Loading dashboard…
                  </div>
                </div>
              ) : (
                <>
                  <div className="admin-stat-grid">
                    {statCards.map(
                      (stat) => (
                        <div
                          className="admin-stat-card"
                          key={
                            stat.label
                          }
                        >
                          <div className="admin-stat-top">
                            <div className="admin-stat-icon">
                              {
                                stat.icon
                              }
                            </div>

                            <span>
                              {
                                stat.label
                              }
                            </span>
                          </div>

                          <strong>
                            {formatNumber(
                              Number(
                                stat.value,
                              ),
                            )}
                          </strong>

                          <small>
                            {
                              stat.description
                            }
                          </small>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="admin-overview-grid">
                    <div className="admin-content-card">
                      <div className="admin-card-title-row">
                        <div>
                          <span>
                            ACTION REQUIRED
                          </span>

                          <h3>
                            Pending payments
                          </h3>
                        </div>

                        <span className="admin-card-count warning">
                          {
                            analytics.pendingPayments
                          }
                        </span>
                      </div>

                      <div className="admin-overview-action">
                        <div className="admin-overview-action-icon">
                          <WalletCards
                            size={18}
                          />
                        </div>

                        <div>
                          <strong>
                            Subscription verification
                          </strong>

                          <span>
                            {
                              analytics.pendingPayments
                            }{' '}
                            payment request
                            {analytics.pendingPayments ===
                            1
                              ? ''
                              : 's'}{' '}
                            waiting for review.
                          </span>
                        </div>

                        <button
                          type="button"
                          className="admin-secondary-button compact"
                          onClick={() =>
                            changeSection(
                              'payments',
                            )
                          }
                        >
                          Review

                          <ChevronRight
                            size={12}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="admin-content-card">
                      <div className="admin-card-title-row">
                        <div>
                          <span>
                            PLATFORM HEALTH
                          </span>

                          <h3>
                            Activity
                          </h3>
                        </div>

                        <div className="admin-health-badge">
                          <span />
                          Operational
                        </div>
                      </div>

                      <div className="admin-health-grid">
                        <div>
                          <strong>
                            {
                              analytics.activeUsers24h
                            }
                          </strong>

                          <span>
                            active users
                            in 24h
                          </span>
                        </div>

                        <div>
                          <strong>
                            {
                              analytics.rooms
                            }
                          </strong>

                          <span>
                            conversation
                            rooms
                          </span>
                        </div>

                        <div>
                          <strong>
                            {
                              analytics.messages
                            }
                          </strong>

                          <span>
                            messages
                            sent
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="admin-quick-actions">
                    <button
                      type="button"
                      onClick={() =>
                        changeSection(
                          'users',
                        )
                      }
                    >
                      <Users
                        size={16}
                      />

                      <span>
                        Manage users
                      </span>

                      <ChevronRight
                        size={14}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        changeSection(
                          'plans',
                        )
                      }
                    >
                      <CreditCard
                        size={16}
                      />

                      <span>
                        Manage plans
                      </span>

                      <ChevronRight
                        size={14}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        changeSection(
                          'site',
                        )
                      }
                    >
                      <Settings2
                        size={16}
                      />

                      <span>
                        Site settings
                      </span>

                      <ChevronRight
                        size={14}
                      />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================================================
              PAYMENTS
              ================================================ */}

          {adminTab ===
            'payments' && (
            <div className="admin-section-content">
              <AdminSectionHeader
                eyebrow="BILLING"
                title="Payments"
                description="Review manual subscription payments and manage payment methods."
                action={
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={() =>
                      void loadDashboard()
                    }
                  >
                    <RefreshCw
                      size={13}
                    />
                    Refresh
                  </button>
                }
              />

              <PaymentRequestsPanel
                requests={
                  requests
                }
                busy={busy}
                onApprove={
                  (
                    id,
                  ) =>
                    void approvePayment(
                      id,
                    )
                }
                onReject={
                  (
                    id,
                  ) =>
                    void rejectPayment(
                      id,
                    )
                }
              />

              <PaymentMethodsPanel />
            </div>
          )}

          {/* ================================================
              USERS
              ================================================ */}

          {adminTab ===
            'users' && (
            <UsersPanel
              users={users}
              total={
                userTotal
              }
              page={
                userPage
              }
              totalPages={
                userTotalPages
              }
              pageSize={
                userPageSize
              }
              busy={busy}
              onPageChange={
                setUserPage
              }
              onPageSizeChange={(
                size,
              ) => {
                setUserPage(1)
                setUserPageSize(
                  size,
                )
              }}
              onToggle={
                (
                  user,
                ) =>
                  void toggleUser(
                    user,
                  )
              }
            />
          )}

          {/* ================================================
              PLANS
              ================================================ */}

          {adminTab ===
            'plans' && (
            <PlanManagementPanel />
          )}

          {/* ================================================
              MEDIA
              ================================================ */}

          {adminTab ===
            'media' && (
            <MediaBackupPanel />
          )}

          {/* ================================================
              SITE SETTINGS
              ================================================ */}

          {adminTab ===
            'site' && (
            <SiteSettingsPanel
              liveSiteSettings={
                siteSettings
              }
            />
          )}
        </main>
      </div>

      {/* ===================================================
          MOBILE NAV OVERLAY
          =================================================== */}

      {mobileNavigationOpen && (
        <button
          type="button"
          className="admin-mobile-overlay"
          onClick={() =>
            setMobileNavigationOpen(
              false,
            )
          }
          aria-label="Close admin navigation"
        />
      )}
    </section>
  )
}

export default AdminModule