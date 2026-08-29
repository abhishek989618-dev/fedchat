import {
  Image,
  Mic,
  Paperclip,
  Send,
  Smile,
  Square,
  X,
} from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  getChatTranslations,
  normalizeChatLanguage,
} from '../chat-i18n'
import './message-composer.css'

type MessageComposerProps = {
  recipientName: string
  language?: string
  readOnly?: boolean

  onSend: (
    text: string,
  ) => void

  onSendMedia?: (
    file: File,
    type:
      | 'audio'
      | 'image'
      | 'video'
      | 'file',
  ) => void
}

export function MessageComposer({
  recipientName,
  language = 'en',
  readOnly = false,
  onSend,
  onSendMedia,
}: MessageComposerProps) {
  const t =
    getChatTranslations(
      normalizeChatLanguage(
        language,
      ),
    )

  const [value, setValue] =
    useState('')

  const [recording, setRecording] =
    useState(false)

  const [recordSeconds, setRecordSeconds] =
    useState(0)

  const [recordingError, setRecordingError] =
    useState('')

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(
      null,
    )

  const mediaStreamRef =
    useRef<MediaStream | null>(
      null,
    )

  const audioChunksRef =
    useRef<Blob[]>([])

  const timerRef =
    useRef<number | null>(null)

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    )

  const imageInputRef =
    useRef<HTMLInputElement | null>(
      null,
    )

  useEffect(() => {
    return () => {
      stopTimers()
      stopMediaStream()
    }
  }, [])

  const stopTimers = () => {
    if (
      timerRef.current !==
      null
    ) {
      window.clearInterval(
        timerRef.current,
      )

      timerRef.current = null
    }
  }

  const stopMediaStream = () => {
    mediaStreamRef.current
      ?.getTracks()
      .forEach(
        (track) =>
          track.stop(),
      )

    mediaStreamRef.current =
      null
  }

  const sendText = () => {
    const message =
      value.trim()

    if (
      !message ||
      readOnly
    ) {
      return
    }

    onSend(message)

    setValue('')
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      event.key ===
        'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault()
      sendText()
    }
  }

  const startRecording =
    async () => {
      if (
        readOnly ||
        recording
      ) {
        return
      }

      setRecordingError('')

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
          .getUserMedia
      ) {
        setRecordingError(
          'Microphone access is not supported in this browser.',
        )
        return
      }

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            },
          )

        const mimeCandidates = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
        ]

        const mimeType =
          mimeCandidates.find(
            (type) =>
              typeof MediaRecorder !==
                'undefined' &&
              MediaRecorder.isTypeSupported(
                type,
              ),
          ) || ''

        const recorder =
          new MediaRecorder(
            stream,
            mimeType
              ? { mimeType }
              : undefined,
          )

        audioChunksRef.current =
          []

        mediaStreamRef.current =
          stream

        mediaRecorderRef.current =
          recorder

        recorder.ondataavailable =
          (event) => {
            if (
              event.data.size >
              0
            ) {
              audioChunksRef.current.push(
                event.data,
              )
            }
          }

        recorder.onstop = () => {
          const blob =
            new Blob(
              audioChunksRef.current,
              {
                type:
                  mimeType ||
                  'audio/webm',
              },
            )

          if (
            blob.size > 0 &&
            onSendMedia
          ) {
            const file =
              new File(
                [blob],
                `voice-note-${Date.now()}.webm`,
                {
                  type:
                    mimeType ||
                    'audio/webm',
                },
              )

            onSendMedia(
              file,
              'audio',
            )
          }

          audioChunksRef.current =
            []

          stopMediaStream()
        }

        recorder.start(
          150,
        )

        setRecording(true)
        setRecordSeconds(
          0,
        )

        timerRef.current =
          window.setInterval(
            () => {
              setRecordSeconds(
                (current) =>
                  current + 1,
              )
            },
            1000,
          )
      } catch (error) {
        setRecordingError(
          error instanceof Error
            ? error.message
            : 'Unable to access the microphone.',
        )
      }
    }

  const stopRecording =
    () => {
      stopTimers()

      const recorder =
        mediaRecorderRef.current

      if (
        recorder &&
        recorder.state !==
          'inactive'
      ) {
        recorder.stop()
      }

      mediaRecorderRef.current =
        null

      setRecording(false)
      setRecordSeconds(0)
    }

  const cancelRecording =
    () => {
      stopTimers()

      const recorder =
        mediaRecorderRef.current

      if (
        recorder &&
        recorder.state !==
          'inactive'
      ) {
        recorder.ondataavailable =
          null

        recorder.onstop = null

        recorder.stop()
      }

      mediaRecorderRef.current =
        null

      audioChunksRef.current =
        []

      stopMediaStream()

      setRecording(false)
      setRecordSeconds(0)
    }

  const openFilePicker = () => {
    if (
      readOnly
    ) {
      return
    }

    fileInputRef.current?.click()
  }

  const openImagePicker = () => {
    if (
      readOnly
    ) {
      return
    }

    imageInputRef.current?.click()
  }

  const handleFile = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0]

    event.target.value = ''

    if (
      !file ||
      !onSendMedia ||
      readOnly
    ) {
      return
    }

    onSendMedia(
      file,
      'file',
    )
  }

  const handleImage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0]

    event.target.value = ''

    if (
      !file ||
      !onSendMedia ||
      readOnly
    ) {
      return
    }

    onSendMedia(
      file,
      'image',
    )
  }

  const minutes =
    Math.floor(
      recordSeconds / 60,
    )
      .toString()
      .padStart(2, '0')

  const seconds =
    (recordSeconds % 60)
      .toString()
      .padStart(2, '0')
      const [emojiOpen, setEmojiOpen] =
  useState(false)
  const COMMON_EMOJIS = [
  '😀',
  '😂',
  '😊',
  '😍',
  '😘',
  '👍',
  '👎',
  '❤️',
  '🔥',
  '🎉',
  '👏',
  '🙏',
  '✅',
  '💯',
  '😎',
  '🤝',
  '🙌',
  '😅',
  '🤣',
  '😭',
  '😡',
  '🤔',
  '😴',
  '🚀',
]

  if (recording) {
    return (
      <div className="fedchat-composer recording">
        <button
          type="button"
          className="fedchat-record-cancel"
          onClick={
            cancelRecording
          }
          aria-label={
            t.cancelRecording
          }
          title={
            t.cancelRecording
          }
        >
          <X
            size={17}
            strokeWidth={2}
          />
        </button>

        <div className="fedchat-recording-body">
          <span className="fedchat-recording-dot" />

          <div className="fedchat-recording-wave">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>

          <span className="fedchat-recording-time">
            {minutes}:{seconds}
          </span>
        </div>

        <button
          type="button"
          className="fedchat-record-stop"
          onClick={
            stopRecording
          }
          aria-label={
            t.stopRecording
          }
          title={
            t.stopRecording
          }
        >
          <Square
            size={14}
            fill="currentColor"
          />
        </button>
      </div>
    )
  }

  return (
    <div className="fedchat-composer-wrap">
      {recordingError && (
        <div
          className="fedchat-composer-error"
          role="alert"
        >
          {recordingError}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={
          handleFile
        }
      />

      <input
        ref={imageInputRef}
        type="file"
        hidden
        accept="image/*"
        onChange={
          handleImage
        }
      />

      <div
        className={`fedchat-composer ${
          readOnly
            ? 'is-readonly'
            : ''
        }`}
      >
        <button
          type="button"
          className="fedchat-composer-icon"
          onClick={
            openFilePicker
          }
          disabled={readOnly}
          aria-label={
            t.attachFile
          }
          title={
            t.attachFile
          }
        >
          <Paperclip
            size={18}
            strokeWidth={1.9}
          />
        </button>

        <button
          type="button"
          className="fedchat-composer-icon fedchat-image-action"
          onClick={
            openImagePicker
          }
          disabled={readOnly}
          aria-label={
            t.attachImage
          }
          title={
            t.attachImage
          }
        >
          <Image
            size={18}
            strokeWidth={1.9}
          />
        </button>

        <div className="fedchat-composer-input">
          <input
            value={value}
            onChange={(
              event,
            ) =>
              setValue(
                event.target
                  .value,
              )
            }
            onKeyDown={
              handleKeyDown
            }
            disabled={readOnly}
            placeholder={`${t.messagePlaceholder} ${recipientName}...`}
            aria-label={`${t.messagePlaceholder} ${recipientName}`}
          />

          <div className="fedchat-emoji-wrap">
  <button
    type="button"
    className="fedchat-emoji-button"
    disabled={readOnly}
    aria-label={t.emoji}
    title={t.emoji}
    onClick={() =>
      setEmojiOpen(
        (current) => !current,
      )
    }
  >
    <Smile
      size={18}
      strokeWidth={1.8}
    />
  </button>

  {emojiOpen && !readOnly && (
    <div className="fedchat-emoji-picker">
      {COMMON_EMOJIS.map(
        (emoji) => (
          <button
            type="button"
            key={emoji}
            className="fedchat-emoji-item"
            onClick={() => {
              setValue(
                (current) =>
                  `${current}${emoji}`,
              )

              setEmojiOpen(false)
            }}
          >
            {emoji}
          </button>
        ),
      )}
    </div>
  )}
</div>
        </div>

        {value.trim() ? (
          <button
            type="button"
            className="fedchat-send"
            onClick={
              sendText
            }
            disabled={
              readOnly
            }
            aria-label={
              t.send
            }
            title={t.send}
          >
            <Send
              size={16}
              fill="currentColor"
              strokeWidth={1.8}
            />
          </button>
        ) : (
          <button
            type="button"
            className="fedchat-microphone"
            onClick={
              startRecording
            }
            disabled={
              readOnly
            }
            aria-label={
              t.voiceNote
            }
            title={
              t.voiceNote
            }
          >
            <Mic
              size={18}
              strokeWidth={2}
            />
          </button>
        )}
      </div>
    </div>
  )
}