import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & { name: string }

const paths: Record<string, string> = {
  edit:'M4 20h4L18.5 9.5a2.12 2.12 0 10-3-3L5 17v3m9-9l3 3',
  search:'M21 21l-4.35-4.35m2.35-5.65a8 8 0 11-16 0 8 8 0 0116 0Z',
  chat:'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 0117 0Z',
  users:'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m9-11a4 4 0 100-8 4 4 0 000 8Zm7 11v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  status:'M12 2a10 10 0 1010 10A10 10 0 0012 2Zm0 18a8 8 0 118-8 8 8 0 01-8 8Z',
  group:'M17 20v-1a4 4 0 00-4-4H5a4 4 0 00-4 4v1m8-9a4 4 0 100-8 4 4 0 000 8Zm8-1a3 3 0 10-2.24-5m5.24 14v-1a4 4 0 00-3-3.87',
  bell:'M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8.5 13h5',
  settings:'M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7Zm8-3.5a8 8 0 00-.1-1.3l2-1.5-2-3.4-2.4 1a8.1 8.1 0 00-2.2-1.3L15 2.8h-4l-.4 2.7a8.1 8.1 0 00-2.2 1.3L6 5.8l-2 3.4 2 1.5a8 8 0 000 2.6l-2 1.5 2 3.4 2.4-1a8.1 8.1 0 002.2 1.3l.4 2.7h4l.4-2.7a8.1 8.1 0 002.2-1.3l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.3Z',
  send:'M22 2L11 13m11-11l-7 20-4-9-9-4 20-7Z', paperclip:'M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.82-2.82l8.49-8.48',
  mic:'M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3Zm7 10a7 7 0 01-14 0m7 7v3m-4 0h8', plus:'M12 5v14M5 12h14',
  more:'M12 6h.01M12 12h.01M12 18h.01', trash:'M6 7h12m-9 0v11m6-11v11M9 7V4h6v3m-8 0 1 14h8l1-14', arrow:'M5 12h14m-6-6 6 6-6 6', check:'M5 12l4 4L19 6', check2:'M2 12l4 4L16 6m-6 10l4 4 8-10',
  menu:'M4 6h16M4 12h16M4 18h16', phone:'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92Z'
}

export function Icon({ name, className = '', width = 18, height = 18, ...props }: Props) {
  return (
    <svg
      className={`fc-icon ${className}`}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={paths[name] || paths.more} />
    </svg>
  )
}
