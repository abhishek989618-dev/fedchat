import {
  useMemo,
  useState,
  type FormEvent,
} from 'react'

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'

import type { SiteSettings } from '../../hooks/useSiteSettings'

import './support.css'

const LAST_UPDATED = 'August 18, 2026'

type Tab =
  | 'helpdesk'
  | 'howto'
  | 'contact'
  | 'privacy'
  | 'terms'

const tabs: Array<
  [
    Tab,
    string,
    string,
  ]
> = [
  [
    'helpdesk',
    'Helpdesk',
    'Get quick answers and troubleshooting help',
  ],
  [
    'howto',
    'How to use',
    'Learn the main FedChat features',
  ],
  [
    'contact',
    'Contact us',
    'Send a support or business enquiry',
  ],
  [
    'privacy',
    'Privacy policy',
    'Understand how information is handled',
  ],
  [
    'terms',
    'Terms & conditions',
    'Rules for using FedChat',
  ],
]

/* =========================================================
   SECTION TITLE
   ========================================================= */

function SectionTitle({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string
  title: string
  text: string
}) {
  return (
    <div className="support-section-title">
      <span className="support-eyebrow">
        {eyebrow}
      </span>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>
    </div>
  )
}

/* =========================================================
   FEATURE ICON
   ========================================================= */

function SupportFeatureIcon({
  icon,
}: {
  icon:
    | 'account'
    | 'chat'
    | 'support'
}) {
  if (icon === 'account') {
    return (
      <UserRound
        size={17}
        strokeWidth={1.8}
      />
    )
  }

  if (icon === 'chat') {
    return (
      <MessageCircle
        size={17}
        strokeWidth={1.8}
      />
    )
  }

  return (
    <Phone
      size={17}
      strokeWidth={1.8}
    />
  )
}

/* =========================================================
   HELP DESK
   ========================================================= */

function Helpdesk({
  onContact,
}: {
  onContact: () => void
}) {
  const faqs: [
    string,
    string,
  ][] = [
    [
      'I cannot sign in',
      'Check your email and password. If authentication keeps failing, wait a few minutes and try again. Contact support when the problem continues.',
    ],
    [
      'Messages are not updating live',
      'Check the connection indicator near the top of the app. If it says connecting, confirm that your network allows realtime WebSocket connections.',
    ],
    [
      'Media upload failed',
      'Make sure the file type is supported and that the file is within the upload limit configured by the platform. Try a smaller file if needed.',
    ],
    [
      'A group feature is unavailable',
      'Some group and community features depend on your subscription plan or your role in that group. Open Plans & Billing to review access.',
    ],
    [
      'I found an abusive or unsafe account',
      'Do not engage with the account. Keep relevant evidence and contact the FedChat support team with the username, room and a short description.',
    ],
  ]

  return (
    <div className="support-view">
      <SectionTitle
        eyebrow="HELPDESK"
        title="How can we help?"
        text="Start with the most common fixes, then contact the team when you need a human response."
      />

      {/* QUICK HELP */}

      <div className="support-quick-grid">
        <div className="support-card support-card-accent">
          <div className="support-card-icon">
            <SupportFeatureIcon icon="account" />
          </div>

          <div className="support-card-content">
            <strong>
              Account &amp; login
            </strong>

            <span>
              Resolve sign-in, password and
              profile issues.
            </span>
          </div>

          <div className="support-card-number">
            01
          </div>
        </div>

        <div className="support-card">
          <div className="support-card-icon">
            <SupportFeatureIcon icon="chat" />
          </div>

          <div className="support-card-content">
            <strong>
              Chat &amp; realtime
            </strong>

            <span>
              Check conversations, presence and
              delivery problems.
            </span>
          </div>

          <div className="support-card-number">
            02
          </div>
        </div>

        <div className="support-card">
          <div className="support-card-icon">
            <SupportFeatureIcon icon="support" />
          </div>

          <div className="support-card-content">
            <strong>
              Human support
            </strong>

            <span>
              Send the team a detailed support
              request.
            </span>
          </div>

          <button
            type="button"
            className="support-small-button"
            onClick={onContact}
          >
            Contact support
            <ChevronRight
              size={13}
            />
          </button>
        </div>
      </div>

      {/* FAQ */}

      <div className="support-subheading">
        <div>
          <span>
            FREQUENTLY ASKED QUESTIONS
          </span>

          <h4>
            Common troubleshooting
          </h4>
        </div>

        <HelpCircle
          size={18}
        />
      </div>

      <div className="support-faq-list">
        {faqs.map(
          ([question, answer]) => (
            <details
              className="support-faq"
              key={question}
            >
              <summary>
                <span className="support-faq-question">
                  {question}
                </span>

                <span className="support-faq-chevron">
                  <ChevronDown
                    size={16}
                  />
                </span>
              </summary>

              <div className="support-faq-answer">
                <p>
                  {answer}
                </p>
              </div>
            </details>
          ),
        )}
      </div>
    </div>
  )
}

/* =========================================================
   HOW TO USE
   ========================================================= */

function HowToUse() {
  const steps: [
    string,
    string,
  ][] = [
    [
      'Create or open a conversation',
      'Use Chats to open an existing conversation. Use Contacts to find a person and start a direct chat.',
    ],
    [
      'Send messages and media',
      'Type a message in the composer, attach supported media, and send. The connection status shows whether realtime communication is connected.',
    ],
    [
      'Manage contacts',
      'Open Contacts to search for people, send requests, accept requests and move into a direct conversation.',
    ],
    [
      'Use Status',
      'Post a text or media update from Status. Your contacts can view active status updates until they expire.',
    ],
    [
      'Create groups and communities',
      'Groups and communities provide shared spaces for multiple people. Some features can depend on your subscription.',
    ],
    [
      'Control your profile',
      'Open Settings to update your name, username, bio, avatar and banner, and to change your password.',
    ],
    [
      'Get help quickly',
      'Open Help & Legal whenever you need troubleshooting, contact information, privacy information or the platform rules.',
    ],
  ]

  return (
    <div className="support-view">
      <SectionTitle
        eyebrow="GET STARTED"
        title="How to use FedChat"
        text="A quick walkthrough of the core features available in the current app."
      />

      <div className="support-guide-card">
        <div className="support-guide-header">
          <div className="support-guide-icon">
            <BookOpen
              size={18}
              strokeWidth={1.8}
            />
          </div>

          <div>
            <strong>
              Getting started
            </strong>

            <span>
              Follow these steps to get the
              most from FedChat.
            </span>
          </div>
        </div>

        <div className="support-steps">
          {steps.map(
            (
              [
                title,
                text,
              ],
              index,
            ) => (
              <div
                className="support-step"
                key={title}
              >
                <div className="support-step-line">
                  <div className="support-step-number">
                    {index + 1}
                  </div>

                  {index <
                    steps.length -
                      1 && (
                    <span className="support-step-connector" />
                  )}
                </div>

                <div className="support-step-content">
                  <strong>
                    {title}
                  </strong>

                  <p>
                    {text}
                  </p>
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="support-note">
        <div className="support-note-icon">
          <Sparkles
            size={15}
          />
        </div>

        <div>
          <strong>
            Tip
          </strong>

          <span>
            Keep the connection indicator in view
            when troubleshooting realtime messages.
          </span>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   CONTACT US
   ========================================================= */

function ContactUs({
  supportEmail,
}: {
  supportEmail: string
}) {
  const [
    name,
    setName,
  ] = useState('')

  const [
    email,
    setEmail,
  ] = useState('')

  const [
    subject,
    setSubject,
  ] = useState('')

  const [
    message,
    setMessage,
  ] = useState('')

  const [
    submitted,
    setSubmitted,
  ] = useState(false)

  const canSend =
    !!supportEmail &&
    !!subject.trim() &&
    !!message.trim()

  function submit(
    event: FormEvent,
  ) {
    event.preventDefault()

    if (!canSend) {
      return
    }

    const body =
      `Name: ${
        name ||
        'Not provided'
      }\nReply email: ${
        email ||
        'Not provided'
      }\n\n${message}`

    window.location.href =
      `mailto:${supportEmail}?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(
        body,
      )}`

    setSubmitted(true)
  }

  return (
    <div className="support-view">
      <SectionTitle
        eyebrow="CONTACT US"
        title="Talk to the FedChat team"
        text="Use the support email configured by your administrator. The button opens your default email application."
      />

      {!supportEmail && (
        <div className="support-warning">
          <div className="support-warning-icon">
            <AlertCircle
              size={17}
            />
          </div>

          <div>
            <strong>
              Support email is not configured.
            </strong>

            <span>
              An administrator should set{' '}
              <code>
                site.supportEmail
              </code>{' '}
              in the Admin Console before users
              submit enquiries.
            </span>
          </div>
        </div>
      )}

      <div className="support-contact-grid">
        {/* FORM */}

        <form
          className="support-form"
          onSubmit={submit}
        >
          <div className="support-form-heading">
            <div className="support-form-heading-icon">
              <Mail
                size={17}
              />
            </div>

            <div>
              <strong>
                Send an enquiry
              </strong>

              <span>
                Include enough detail so the team
                can understand and reproduce the
                issue.
              </span>
            </div>
          </div>

          <div className="support-form-grid">
            <label>
              <span>
                Your name
              </span>

              <div className="support-input-wrap">
                <UserRound
                  size={14}
                />

                <input
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value,
                    )
                  }
                  placeholder="Your name"
                />
              </div>
            </label>

            <label>
              <span>
                Reply email
              </span>

              <div className="support-input-wrap">
                <Mail
                  size={14}
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value,
                    )
                  }
                  placeholder="you@example.com"
                />
              </div>
            </label>

            <label className="support-field-full">
              <span>
                Subject
              </span>

              <div className="support-input-wrap">
                <FileText
                  size={14}
                />

                <input
                  required
                  value={subject}
                  onChange={(e) =>
                    setSubject(
                      e.target.value,
                    )
                  }
                  placeholder="How can we help?"
                />
              </div>
            </label>

            <label className="support-field-full">
              <span>
                Message
              </span>

              <textarea
                required
                rows={7}
                value={message}
                onChange={(e) =>
                  setMessage(
                    e.target.value,
                  )
                }
                placeholder="Describe the issue, steps to reproduce it, and any useful details."
              />
            </label>
          </div>

          <div className="support-form-bottom">
            <div className="support-form-email">
              <Mail
                size={13}
              />

              <span>
                {supportEmail ||
                  'Support email not configured'}
              </span>
            </div>

            <button
              type="submit"
              className="support-primary-button"
              disabled={
                !canSend
              }
            >
              <Send
                size={14}
              />

              Open email
            </button>
          </div>

          {submitted && (
            <div className="support-success">
              <CheckCircle2
                size={15}
              />

              <span>
                Your email application should now
                open with the support request
                prepared.
              </span>
            </div>
          )}
        </form>

        {/* WHAT TO INCLUDE */}

        <div className="support-card support-contact-card">
          <div className="support-contact-card-header">
            <div className="support-card-icon">
              <FileText
                size={17}
              />
            </div>

            <div>
              <strong>
                What to include
              </strong>

              <span>
                This helps us resolve your issue
                faster.
              </span>
            </div>
          </div>

          <ul>
            <li>
              Your account email or username
            </li>

            <li>
              The page or feature where the issue
              occurs
            </li>

            <li>
              What you expected
            </li>

            <li>
              What actually happened
            </li>

            <li>
              A screenshot or error message when
              useful
            </li>
          </ul>

          <div className="support-contact-tip">
            <ShieldCheck
              size={15}
            />

            <span>
              Never send your password or
              authentication token.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   PRIVACY
   ========================================================= */

function PrivacyPolicy() {
  return (
    <div className="support-view">
      <SectionTitle
        eyebrow="PRIVACY POLICY"
        title="Your privacy matters"
        text={`Last updated: ${LAST_UPDATED}. This is a product-ready template and should be reviewed by the FedChat operator and legal counsel before publication.`}
      />

      <div className="support-legal-header">
        <div className="support-legal-icon">
          <ShieldCheck
            size={18}
          />
        </div>

        <div>
          <strong>
            Privacy policy
          </strong>

          <span>
            Please review this policy with the
            FedChat operator before publication.
          </span>
        </div>
      </div>

      <div className="support-legal-content">
        <section>
          <span className="support-legal-number">
            01
          </span>

          <div>
            <h4>
              Information we may collect
            </h4>

            <p>
              FedChat may process information
              needed to create and operate an
              account, such as your name, username,
              email address, profile information,
              messages, group membership and
              technical information generated when
              you use the service.
            </p>
          </div>
        </section>

        <section>
          <span className="support-legal-number">
            02
          </span>

          <div>
            <h4>
              How information is used
            </h4>

            <p>
              Information may be used to
              authenticate users, deliver messages
              and notifications, provide realtime
              features, operate groups and
              communities, provide customer support,
              maintain security, prevent abuse and
              improve the service.
            </p>
          </div>
        </section>

        <section>
          <span className="support-legal-number">
            03
          </span>

          <div>
            <h4>
              Messages and user content
            </h4>

            <p>
              Content that you choose to send or
              upload is processed so FedChat can
              provide the feature you requested. The
              operator should document its actual
              retention, backup and deletion
              practices before publishing this
              policy.
            </p>
          </div>
        </section>

        <section>
          <span className="support-legal-number">
            04
          </span>

          <div>
            <h4>
              Sharing and service providers
            </h4>

            <p>
              Information should only be shared
              with service providers, administrators
              or other recipients where necessary
              for operating FedChat, complying with
              legal obligations, protecting users, or
              with your direction. Replace this
              paragraph with the operator's actual
              practices.
            </p>
          </div>
        </section>

        <section>
          <span className="support-legal-number">
            05
          </span>

          <div>
            <h4>
              Security
            </h4>

            <p>
              FedChat uses authentication controls
              and server-side access restrictions,
              but no internet service can guarantee
              absolute security. Users should use
              strong passwords and avoid sharing
              credentials.
            </p>
          </div>
        </section>

        <section>
          <span className="support-legal-number">
            06
          </span>

          <div>
            <h4>
              Your choices
            </h4>

            <p>
              Depending on the deployment and
              applicable law, you may have rights
              relating to access, correction,
              deletion, restriction or objection.
              Contact the operator using the support
              details shown in Contact Us.
            </p>
          </div>
        </section>

        <section>
          <span className="support-legal-number">
            07
          </span>

          <div>
            <h4>
              Children
            </h4>

            <p>
              FedChat should not be used by anyone
              who is not legally permitted to use the
              service under the operator's applicable
              age requirements. The operator should
              publish its actual minimum age and
              parental rules here.
            </p>
          </div>
        </section>

        <section>
          <span className="support-legal-number">
            08
          </span>

          <div>
            <h4>
              Changes
            </h4>

            <p>
              The operator may update this policy
              when the service or legal requirements
              change. Material changes should be
              communicated through an appropriate
              channel.
            </p>
          </div>
        </section>

        <section>
          <span className="support-legal-number">
            09
          </span>

          <div>
            <h4>
              Contact
            </h4>

            <p>
              For privacy questions or requests, use
              Contact Us and the support email
              configured by the FedChat
              administrator.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

/* =========================================================
   TERMS
   ========================================================= */

function Terms() {
  return (
    <div className="support-view">
      <SectionTitle
        eyebrow="TERMS & CONDITIONS"
        title="Rules for using FedChat"
        text={`Last updated: ${LAST_UPDATED}. This is a product-ready template and should be reviewed by the FedChat operator and legal counsel before publication.`}
      />

      <div className="support-legal-header terms">
        <div className="support-legal-icon">
          <FileText
            size={18}
          />
        </div>

        <div>
          <strong>
            Terms &amp; conditions
          </strong>

          <span>
            Please review these terms with the
            FedChat operator before publication.
          </span>
        </div>
      </div>

      <div className="support-legal-content">
        <section>
          <span className="support-legal-number">
            01
          </span>

          <div>
            <h4>
              Accepting these terms
            </h4>

            <p>
              By accessing FedChat, you agree to
              follow these terms and any platform
              rules shown in the service. Do not use
              FedChat if you are not permitted to
              accept these terms.
            </p>
          </div>
        </section>

        <section>
          <span className="support-legal-number">
            02
          </span>

          <div>
            <h4>
              Acceptable use
            </h4>

            <p>
              You must not use FedChat for unlawful
              activity, fraud, harassment,
              unauthorized access, malware
              distribution, impersonation, or conduct
              that materially harms other users or
              the service.
            </p>
          </div>
        </section>

        <section>
          <span className="support-legal-number">
            03
          </span>

          <div>
            <h4>
              User content
            </h4>

            <p>
              You are responsible for content you
              create, upload or send. You should only
              share content that you have the right to
              use and that does not violate applicable
              law or the rights of others.
            </p>
          </div>
        </section>

        <section>
          <span className="support-legal-number">
            04
          </span>

          <div>
            <h4>
              Groups, communities and plans
            </h4>

            <p>
              Feature availability may depend on
              account role or subscription plan. The
              operator may enforce reasonable limits,
              suspend access or change features as
              described by the active service
              configuration.
            </p>
          </div>
        </section>

        <section>
          <span className="support-legal-number">
            05
          </span>

          <div>
            <h4>
              Account security
            </h4>

            <p>
              You are responsible for protecting your
              credentials and promptly reporting
              suspected unauthorized access. Do not
              share passwords or authentication
              tokens.
            </p>
          </div>
        </section>

        <section>
          <span className="support-legal-number">
            06
          </span>

          <div>
            <h4>
              Moderation and suspension
            </h4>

            <p>
              The operator may restrict or suspend
              accounts when reasonably necessary to
              protect users, enforce these terms,
              investigate abuse, or comply with legal
              obligations.
            </p>
          </div>
        </section>

        <section>
          <span className="support-legal-number">
            07
          </span>

          <div>
            <h4>
              Availability
            </h4>

            <p>
              FedChat is provided as configured by the
              operator and may experience maintenance,
              outages or feature changes. No
              uninterrupted availability is promised
              unless an applicable agreement says
              otherwise.
            </p>
          </div>
        </section>

        <section>
          <span className="support-legal-number">
            08
          </span>

          <div>
            <h4>
              Changes and termination
            </h4>

            <p>
              The operator may update these terms and
              may discontinue or change the service.
              Continued use after an effective change
              may constitute acceptance where
              permitted by law.
            </p>
          </div>
        </section>

        <section>
          <span className="support-legal-number">
            09
          </span>

          <div>
            <h4>
              Governing terms
            </h4>

            <p>
              The operator should replace this
              section with the actual governing law,
              venue and dispute provisions applicable
              to the FedChat business or organization.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

/* =========================================================
   SUPPORT MODULE
   ========================================================= */

export function SupportModule({
  siteSettings,
  initialTab = 'helpdesk',
}: {
  siteSettings: SiteSettings
  initialTab?: Tab
}) {
  const [
    tab,
    setTab,
  ] = useState<Tab>(
    initialTab,
  )

  const content =
    useMemo(() => {
      switch (tab) {
        case 'howto':
          return (
            <HowToUse />
          )

        case 'contact':
          return (
            <ContactUs
              supportEmail={
                siteSettings.supportEmail
              }
            />
          )

        case 'privacy':
          return (
            <PrivacyPolicy />
          )

        case 'terms':
          return (
            <Terms />
          )

        default:
          return (
            <Helpdesk
              onContact={() =>
                setTab(
                  'contact',
                )
              }
            />
          )
      }
    }, [
      tab,
      siteSettings.supportEmail,
    ])

  return (
    <div className="page-module support-module">
      {/* =================================================
          PAGE HEADER
          ================================================= */}

      <div className="support-page-header">
        <div className="support-page-heading">
          <span className="support-eyebrow">
            FEDCHAT SUPPORT CENTER
          </span>

          <h2>
            Help &amp; Legal
          </h2>

          <p>
            Everything you need to learn the app,
            get support and understand the platform
            rules.
          </p>
        </div>

        <div className="support-header-status">
          <CheckCircle2
            size={14}
          />

          <span>
            Support center
          </span>
        </div>
      </div>

      {/* =================================================
          LAYOUT
          ================================================= */}

      <div className="support-layout">
        {/* ===============================================
            NAVIGATION
            =============================================== */}

        <aside
          className="support-nav"
          aria-label="Help and legal navigation"
        >
          <div className="support-nav-heading">
            <span>
              EXPLORE
            </span>

            <strong>
              Support
            </strong>
          </div>

          <div className="support-nav-list">
            {tabs.map(
              ([
                id,
                label,
                description,
              ]) => {
                const active =
                  tab === id

                return (
                  <button
                    type="button"
                    key={id}
                    className={
                      active
                        ? 'support-nav-item active'
                        : 'support-nav-item'
                    }
                    onClick={() =>
                      setTab(id)
                    }
                  >
                    <span className="support-nav-item-icon">
                      {id ===
                        'helpdesk' && (
                        <HelpCircle
                          size={16}
                        />
                      )}

                      {id ===
                        'howto' && (
                        <BookOpen
                          size={16}
                        />
                      )}

                      {id ===
                        'contact' && (
                        <Mail
                          size={16}
                        />
                      )}

                      {id ===
                        'privacy' && (
                        <ShieldCheck
                          size={16}
                        />
                      )}

                      {id ===
                        'terms' && (
                        <FileText
                          size={16}
                        />
                      )}
                    </span>

                    <span className="support-nav-item-copy">
                      <strong>
                        {label}
                      </strong>

                      <small>
                        {
                          description
                        }
                      </small>
                    </span>

                    <ChevronRight
                      size={14}
                      className="support-nav-item-arrow"
                    />
                  </button>
                )
              },
            )}
          </div>

          <div className="support-nav-footer">
            <div className="support-nav-footer-icon">
              <Search
                size={14}
              />
            </div>

            <div>
              <strong>
                Need more help?
              </strong>

              <span>
                Contact the FedChat support team.
              </span>
            </div>
          </div>
        </aside>

        {/* ===============================================
            CONTENT
            =============================================== */}

        <section className="support-panel">
          {content}
        </section>
      </div>
    </div>
  )
}

export default SupportModule