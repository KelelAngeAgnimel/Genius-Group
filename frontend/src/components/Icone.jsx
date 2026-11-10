// ── Icônes SVG monochromes (héritent de la couleur du texte via currentColor) ──
const ICONS = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M9.5 20v-5.5h5V20" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>,
  book: <><path d="M6.5 4H18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4Z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H19" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
  lifebuoy: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /><path d="M5.5 5.5 9 9M15 15l3.5 3.5M18.5 5.5 15 9M9 15l-3.5 3.5" /></>,
  presentation: <><path d="M3 4h18" /><path d="M4 4v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4" /><path d="M12 15v4M9 21l3-2 3 2" /></>,
  sliders: <><path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h8M16 17h4" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="14" cy="17" r="2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></>,
  newspaper: <><path d="M4 5h13v15H5a1 1 0 0 1-1-1V5Z" /><path d="M17 9h3v9a2 2 0 0 1-2 2" /><path d="M7 8.5h7M7 12h7M7 15.5h4" /></>,
  bookOpen: <><path d="M12 6.5C10 5 7 5 4 5.5v13c3-.5 6-.5 8 1" /><path d="M12 6.5C14 5 17 5 20 5.5v13c-3-.5-6-.5-8 1" /><path d="M12 6.5v13" /></>,
  barChart: <><path d="M4 21h16" /><path d="M6 21V11M12 21V4M18 21v-7" /></>,
  calendarDays: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /><path d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" /></>,
  trendingUp: <><path d="M3 16l5-5 4 4 8-8" /><path d="M16 7h4v4" /></>,
  pencil: <><path d="M4 20l1-4L16 5l3 3L8 19l-4 1Z" /><path d="M14 7l3 3" /></>,
  fileText: <><path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-6-6Z" /><path d="M13 3v6h6" /><path d="M9 13h6M9 16.5h6" /></>,
  cap: <><path d="M12 4 2 9l10 5 10-5-10-5Z" /><path d="M6 11.5V16c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4.5" /><path d="M22 9v5" /></>,
  video: <><rect x="3" y="6" width="12.5" height="12" rx="2" /><path d="M15.5 10l5-3v10l-5-3" /></>,
  clipboard: <><rect x="6" y="4.5" width="12" height="16" rx="2" /><path d="M9 4.5h6v-1a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v1Z" /><path d="M9 11h6M9 14.5h4" /></>,
  checkSquare: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>,
  helpCircle: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.4 2.4 0 1 1 3.3 2.3c-.8.4-1.4 1-1.4 1.9" /><path d="M12 16.7h.01" /></>,
  mail: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3.5 7l8.5 5.5L20.5 7" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5 5-2Z" /></>,
  heart: <><path d="M12 20.5C7 17 3 13.5 3 9.2 3 6.6 5 4.5 7.5 4.5c1.7 0 3.2 1 4.5 2.5 1.3-1.5 2.8-2.5 4.5-2.5C19 4.5 21 6.6 21 9.2c0 4.3-4 7.8-9 11.3Z" /></>,
  message: <><path d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8.5L4 20.5V6.5a1 1 0 0 1 0-1Z" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M4 4l16 16" /><path d="M9.9 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3.2 3.9M6.1 7.6A15.7 15.7 0 0 0 2.5 12S6 18.5 12 18.5c1.5 0 2.8-.4 4-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  download: <path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 20h14" />,
  camera: <><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.5" /></>,
  paperclip: <path d="M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.6 17a1.7 1.7 0 0 1-2.4-2.4L15 7" />,
  alert: <><path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4.5M12 17.2h.01" /></>,
  users: <><circle cx="9" cy="8.5" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 5.3a3.5 3.5 0 0 1 0 6.4M18 14.2a6.5 6.5 0 0 1 3.5 5.8" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>,
  inbox: <><path d="M3.5 13.5 6 5.5h12l2.5 8" /><path d="M3.5 13.5V18a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5v-4.5h-5l-1 2h-5l-1-2h-5Z" /></>,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronUp: <path d="M6 15l6-6 6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
}

export default function Icon({ name, className = 'w-4 h-4' }) {
  const contenu = ICONS[name]
  if (!contenu) return null
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {contenu}
    </svg>
  )
}

