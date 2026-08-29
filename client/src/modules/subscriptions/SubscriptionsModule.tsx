import {
  Check,
  ChevronRight,
  Copy,
  CreditCard,
  Info,
  QrCode,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { api } from '../../lib'

import './subscriptions.css'

/* =========================================================
   TYPES
   ========================================================= */

type Plan = {
  id: string
  name: string
  price: string | number
  description?: string | null
  durationDays?: number
  accessLevel?: string
  features?: string[]
}

type PaymentMethod = {
  id: string
  name?: string | null
  type?: string | null
  upiId?: string | null
  paymentNumber?: string | null
  isDefault?: boolean
  isActive?: boolean
}

/* =========================================================
   QR URL
   ========================================================= */

function qrUrl(
  upiId: string,
  name: string,
  amount: string,
) {
  const upi =
    `upi://pay?pa=${encodeURIComponent(
      upiId,
    )}` +
    `&pn=${encodeURIComponent(
      name,
    )}` +
    `${
      amount
        ? `&am=${encodeURIComponent(
            amount,
          )}&cu=INR`
        : ''
    }`

  return (
    `https://quickchart.io/qr?size=280&margin=1&text=${encodeURIComponent(
      upi,
    )}`
  )
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatPrice(
  price: string | number,
) {
  const value =
    Number(price)

  if (
    Number.isNaN(value)
  ) {
    return String(price)
  }

  return value.toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 2,
    },
  )
}

function normalizeAccess(
  value?: string | null,
) {
  return String(
    value || '',
  )
    .replace(
      /_/g,
      ' ',
    )
    .toLowerCase()
}

/* =========================================================
   COMPONENT
   ========================================================= */

export function SubscriptionsModule() {
  const [plans, setPlans] =
    useState<Plan[]>([])

  const [methods, setMethods] =
    useState<PaymentMethod[]>(
      [],
    )

  const [selected, setSelected] =
    useState<Plan | null>(null)

  const [
    transactionId,
    setTransactionId,
  ] = useState('')

  const [
    message,
    setMessage,
  ] = useState('')

  const [
    busy,
    setBusy,
  ] = useState(false)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  )

  const [
    copied,
    setCopied,
  ] = useState(false)

  /* =======================================================
     PAYMENT METHOD
     ======================================================= */

  const method =
    useMemo(() => {
      return (
        methods.find(
          (item) =>
            item.isDefault &&
            item.isActive,
        ) ||
        methods.find(
          (item) =>
            String(
              item.type || '',
            ).toUpperCase() ===
              'UPI' &&
            item.isActive,
        ) ||
        methods.find(
          (item) =>
            item.isActive,
        ) ||
        methods[0]
      )
    }, [methods])

  /* =======================================================
     LOAD DATA
     ======================================================= */

  async function load() {
    setLoading(true)
    setError(null)

    try {
      const [
        plansResponse,
        methodsResponse,
      ] = await Promise.all([
        api.plans(),
        api.paymentMethods(),
      ])

      const receivedPlans =
        Array.isArray(
          plansResponse?.data?.plans,
        )
          ? (plansResponse.data.plans as Plan[])
          : []

      const receivedMethods =
        Array.isArray(
          methodsResponse?.data
            ?.paymentMethods,
        )
          ? (methodsResponse.data.paymentMethods as PaymentMethod[])
          : []

      setPlans(
        receivedPlans,
      )

      setMethods(
        receivedMethods,
      )
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to load plans and payment methods.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  /* =======================================================
     SELECT PLAN
     ======================================================= */

  function choosePlan(
    plan: Plan,
  ) {
    setSelected(plan)

    setTransactionId('')

    setMessage('')

    setCopied(false)
  }

  /* =======================================================
     SUBMIT
     ======================================================= */

  async function submit() {
    if (
      !selected ||
      !method ||
      !transactionId.trim()
    ) {
      setMessage(
        'Select a plan, complete the UPI payment, and enter the transaction or reference ID.',
      )
      return
    }

    setBusy(true)
    setMessage('')

    try {
      await api.createPaymentRequest({
        planId:
          selected.id,

        paymentMethodId:
          method.id,

        transactionId:
          transactionId.trim(),
      })

      setMessage(
        'Payment submitted successfully. Admin verification is pending.',
      )

      setTransactionId('')
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : 'Unable to submit payment request.',
      )
    } finally {
      setBusy(false)
    }
  }

  /* =======================================================
     COPY UPI ID
     ======================================================= */

  async function copyUpi() {
    const upi =
      method?.upiId ||
      method?.paymentNumber

    if (!upi) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        upi,
      )

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1800)
    } catch {
      setMessage(
        'Unable to copy the UPI ID.',
      )
    }
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <section className="subscriptions-page">
      {/* =================================================
          HEADER
          ================================================= */}

      <header className="subscriptions-header">
        <div className="subscriptions-header-copy">
          <span className="subscriptions-eyebrow">
            PLANS &amp; BILLING
          </span>

          <h1>
            Choose your plan
          </h1>

          <p>
            Select a plan, pay securely
            with UPI, and submit your
            transaction reference for
            manual verification.
          </p>
        </div>

        <div className="subscriptions-header-badge">
          <ShieldCheck
            size={14}
            strokeWidth={1.9}
          />

          <span>
            UPI BILLING
          </span>
        </div>
      </header>

      {/* =================================================
          INFO STRIP
          ================================================= */}

      <div className="subscriptions-info-strip">
        <div className="subscriptions-info-icon">
          <Info
            size={16}
            strokeWidth={1.8}
          />
        </div>

        <div>
          <strong>
            Manual payment verification
          </strong>

          <span>
            Complete the UPI payment first,
            then submit your UTR/reference
            number below.
          </span>
        </div>
      </div>

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <div className="subscriptions-alert">
          <div>
            <strong>
              Could not load billing
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              void load()
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* =================================================
          LOADING
          ================================================= */}

      {loading &&
        !error && (
          <div className="subscriptions-loading">
            <div className="subscriptions-loading-icon">
              <WalletCards
                size={19}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <strong>
                Loading plans
              </strong>

              <span>
                Preparing your billing options…
              </span>
            </div>
          </div>
        )}

      {/* =================================================
          PLANS
          ================================================= */}

      {!loading &&
        !error && (
          <>
            {plans.length ===
              0 && (
              <div className="subscriptions-empty">
                <div className="subscriptions-empty-icon">
                  <CreditCard
                    size={23}
                    strokeWidth={1.7}
                  />
                </div>

                <strong>
                  No plans available
                </strong>

                <span>
                  Plans haven't been configured
                  yet.
                </span>
              </div>
            )}

            {plans.length >
              0 && (
              <section className="subscriptions-plans-section">
                <div className="subscriptions-section-heading">
                  <div>
                    <span>
                      AVAILABLE PLANS
                    </span>

                    <h2>
                      Find the right plan
                    </h2>
                  </div>

                  <span className="subscriptions-plan-count">
                    {plans.length}
                  </span>
                </div>

                <div className="subscriptions-plan-grid">
                  {plans.map(
                    (
                      plan,
                      index,
                    ) => {
                      const isSelected =
                        selected?.id ===
                        plan.id

                      const access =
                        normalizeAccess(
                          plan.accessLevel,
                        )

                      const isPremium =
                        access.includes(
                          'full',
                        ) ||
                        access.includes(
                          'premium',
                        )

                      return (
                        <article
                          key={
                            plan.id
                          }
                          className={`subscription-plan-card ${
                            isSelected
                              ? 'selected'
                              : ''
                          } ${
                            isPremium
                              ? 'premium'
                              : ''
                          }`}
                        >
                          {isPremium && (
                            <div className="subscription-plan-recommended">
                              <Sparkles
                                size={
                                  11
                                }
                              />

                              Popular
                            </div>
                          )}

                          <div className="subscription-plan-top">
                            <div className="subscription-plan-icon">
                              {index ===
                              0 ? (
                                <CreditCard
                                  size={
                                    19
                                  }
                                  strokeWidth={
                                    1.8
                                  }
                                />
                              ) : (
                                <Sparkles
                                  size={
                                    19
                                  }
                                  strokeWidth={
                                    1.8
                                  }
                                />
                              )}
                            </div>

                            <span className="subscription-plan-access">
                              {plan.accessLevel ||
                                'Plan'}
                            </span>
                          </div>

                          <h3>
                            {plan.name}
                          </h3>

                          <p>
                            {plan.description ||
                              'Full access to your selected FedChat plan.'}
                          </p>

                          <div className="subscription-plan-price">
                            <span>
                              ₹
                            </span>

                            <strong>
                              {formatPrice(
                                plan.price,
                              )}
                            </strong>
                          </div>

                          <div className="subscription-plan-duration">
                            {plan.durationDays
                              ? `${plan.durationDays} days`
                              : 'Flexible duration'}
                          </div>

                          {Array.isArray(
                            plan.features,
                          ) &&
                            plan.features
                              .length >
                              0 && (
                              <div className="subscription-plan-features">
                                {plan.features
                                  .slice(
                                    0,
                                    4,
                                  )
                                  .map(
                                    (
                                      feature,
                                    ) => (
                                      <span
                                        key={
                                          feature
                                        }
                                      >
                                        <Check
                                          size={
                                            11
                                          }
                                        />

                                        {
                                          feature
                                        }
                                      </span>
                                    ),
                                  )}
                              </div>
                            )}

                          <button
                            type="button"
                            className="subscription-plan-button"
                            onClick={() =>
                              choosePlan(
                                plan,
                              )
                            }
                          >
                            {isSelected
                              ? 'Selected'
                              : 'Choose plan'}

                            <ChevronRight
                              size={
                                14
                              }
                            />
                          </button>
                        </article>
                      )
                    },
                  )}
                </div>
              </section>
            )}

            {/* ===========================================
                PAYMENT SECTION
                =========================================== */}

            {selected && (
              <section className="billing-checkout">
                <div className="billing-checkout-header">
                  <div>
                    <span>
                      CHECKOUT
                    </span>

                    <h2>
                      Complete your
                      payment
                    </h2>

                    <p>
                      Follow the steps below
                      to submit your plan for
                      verification.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="billing-change-plan"
                    onClick={() =>
                      setSelected(
                        null,
                      )
                    }
                  >
                    Change plan
                  </button>
                </div>

                <div className="billing-checkout-grid">
                  {/* =================================
                      LEFT
                      ================================= */}

                  <div className="billing-payment-card">
                    <div className="billing-selected-plan">
                      <div className="billing-selected-icon">
                        <Check
                          size={
                            17
                          }
                          strokeWidth={
                            2.2
                          }
                        />
                      </div>

                      <div>
                        <span>
                          Selected plan
                        </span>

                        <strong>
                          {
                            selected.name
                          }
                        </strong>
                      </div>

                      <strong className="billing-selected-price">
                        ₹
                        {formatPrice(
                          selected.price,
                        )}
                      </strong>
                    </div>

                    {/* PAYMENT METHOD */}

                    <div className="billing-method">
                      <div className="billing-method-heading">
                        <div className="billing-step-number">
                          1
                        </div>

                        <div>
                          <strong>
                            Pay using UPI
                          </strong>

                          <span>
                            Scan the QR code or
                            use the UPI ID.
                          </span>
                        </div>
                      </div>

                      {method ? (
                        <div className="billing-method-box">
                          <div className="billing-method-icon">
                            <QrCode
                              size={
                                17
                              }
                            />
                          </div>

                          <div>
                            <strong>
                              {method.name ||
                                'UPI'}
                            </strong>

                            <span>
                              {method.upiId ||
                                method.paymentNumber ||
                                'UPI ID not configured'}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="billing-copy-button"
                            onClick={() =>
                              void copyUpi()
                            }
                            disabled={
                              !(
                                method.upiId ||
                                method.paymentNumber
                              )
                            }
                            aria-label="Copy UPI ID"
                            title="Copy UPI ID"
                          >
                            {copied ? (
                              <Check
                                size={
                                  15
                                }
                              />
                            ) : (
                              <Copy
                                size={
                                  15
                                }
                              />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="billing-no-method">
                          <CreditCard
                            size={
                              18
                            }
                          />

                          <span>
                            No active payment method
                            has been configured.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* TRANSACTION */}

                    <div className="billing-method">
                      <div className="billing-method-heading">
                        <div className="billing-step-number">
                          2
                        </div>

                        <div>
                          <strong>
                            Enter transaction
                            reference
                          </strong>

                          <span>
                            Enter the UTR, transaction
                            ID or payment reference.
                          </span>
                        </div>
                      </div>

                      <label className="billing-input-wrap">
                        <span>
                          Transaction / UTR /
                          reference ID
                        </span>

                        <input
                          value={
                            transactionId
                          }
                          onChange={(
                            event,
                          ) =>
                            setTransactionId(
                              event.target
                                .value,
                            )
                          }
                          placeholder="e.g. 324567891234"
                          autoComplete="off"
                          spellCheck={
                            false
                          }
                        />
                      </label>
                    </div>

                    {/* SUBMIT */}

                    <div className="billing-submit-area">
                      <button
                        type="button"
                        className="billing-submit-button"
                        disabled={
                          busy ||
                          !method ||
                          !transactionId.trim()
                        }
                        onClick={() =>
                          void submit()
                        }
                      >
                        {busy
                          ? 'Submitting…'
                          : 'Submit payment for approval'}

                        {!busy && (
                          <ChevronRight
                            size={
                              15
                            }
                          />
                        )}
                      </button>

                      {message && (
                        <div
                          className={`billing-message ${
                            message
                              .toLowerCase()
                              .includes(
                                'success',
                              )
                              ? 'success'
                              : 'error'
                          }`}
                        >
                          <Info
                            size={
                              14
                            }
                          />

                          <span>
                            {
                              message
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* =================================
                      QR
                      ================================= */}

                  <aside className="billing-qr-card">
                    <div className="billing-qr-header">
                      <div>
                        <span>
                          PAYMENT
                        </span>

                        <h3>
                          Scan &amp; Pay
                        </h3>
                      </div>

                      <QrCode
                        size={
                          18
                        }
                        strokeWidth={
                          1.8
                        }
                      />
                    </div>

                    {method?.upiId ? (
                      <>
                        <div className="billing-qr-wrapper">
                          <img
                            src={qrUrl(
                              method.upiId,
                              method.name ||
                                'FedChat',
                              String(
                                selected.price,
                              ),
                            )}
                            alt="UPI payment QR code"
                            className="upi-qr"
                          />
                        </div>

                        <div className="billing-qr-amount">
                          <span>
                            Amount
                          </span>

                          <strong>
                            ₹
                            {formatPrice(
                              selected.price,
                            )}
                          </strong>
                        </div>

                        <div className="billing-qr-upi">
                          <span>
                            UPI ID
                          </span>

                          <strong>
                            {
                              method.upiId
                            }
                          </strong>
                        </div>

                        <div className="billing-qr-note">
                          Open any UPI app,
                          scan this QR code,
                          and complete the
                          payment.
                        </div>
                      </>
                    ) : (
                      <div className="billing-no-qr">
                        <div>
                          <QrCode
                            size={
                              22
                            }
                          />
                        </div>

                        <strong>
                          UPI not configured
                        </strong>

                        <span>
                          Admin hasn't configured
                          an active UPI ID yet.
                        </span>
                      </div>
                    )}
                  </aside>
                </div>
              </section>
            )}
          </>
        )}

      {/* =================================================
          FOOTER
          ================================================= */}

      {!loading &&
        !error &&
        plans.length >
          0 && (
          <footer className="subscriptions-footer">
            <ShieldCheck
              size={14}
            />

            <span>
              Your payment remains pending until
              it is manually verified by an admin.
            </span>
          </footer>
        )}
    </section>
  )
}

export default SubscriptionsModule