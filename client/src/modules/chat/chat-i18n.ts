export type ChatLanguage =
  | 'en'
  | 'hi'
  | 'gu'
  | 'mr'
  | 'bn'
  | 'ta'
  | 'te'

type ChatTranslations = {
  search: string
  searchPlaceholder: string
  all: string
  unread: string
  groups: string
  newConversation: string

  messagePlaceholder: string
  voiceNote: string
  attachFile: string
  attachImage: string
  emoji: string
  send: string
  recording: string
  cancelRecording: string
  stopRecording: string

  online: string
  offline: string
  typing: string

  today: string
  yesterday: string

  noConversations: string
  startConversation: string
  selectConversation: string
  noMessages: string

  newConversationTitle: string
  searchPeople: string
  searchPeoplePlaceholder: string
  noMatches: string

  messageDeleted: string
  messageDeletedForMe: string

  cancel: string
  forward: string
}

const translations: Record<
  ChatLanguage,
  ChatTranslations
> = {
  en: {
    search: 'Search',
    searchPlaceholder: 'Search conversations',

    all: 'All',
    unread: 'Unread',
    groups: 'Groups',
    newConversation: 'New conversation',

    messagePlaceholder: 'Message',
    voiceNote: 'Voice note',
    attachFile: 'Attach file',
    attachImage: 'Add image',
    emoji: 'Add emoji',
    send: 'Send',

    recording: 'Recording',
    cancelRecording: 'Cancel recording',
    stopRecording: 'Stop recording',

    online: 'Online',
    offline: 'Offline',
    typing: 'Typing…',

    today: 'Today',
    yesterday: 'Yesterday',

    noConversations: 'No conversations yet',
    startConversation: 'Start a new conversation',
    selectConversation: 'Select a conversation to start chatting',
    noMessages: 'Start a new conversation',

    newConversationTitle: 'New conversation',
    searchPeople: 'Search for someone',
    searchPeoplePlaceholder:
      'Search by name, username or email',
    noMatches: 'No matches found',

    messageDeleted: 'Message deleted',
    messageDeletedForMe:
      'This message was deleted for you',

    cancel: 'Cancel',
    forward: 'Forward',
  },

  hi: {
    search: 'खोजें',
    searchPlaceholder: 'बातचीत खोजें',

    all: 'सभी',
    unread: 'अपठित',
    groups: 'ग्रुप',
    newConversation: 'नई बातचीत',

    messagePlaceholder: 'संदेश',
    voiceNote: 'वॉइस नोट',
    attachFile: 'फ़ाइल जोड़ें',
    attachImage: 'इमेज जोड़ें',
    emoji: 'इमोजी जोड़ें',
    send: 'भेजें',

    recording: 'रिकॉर्ड हो रहा है',
    cancelRecording: 'रिकॉर्डिंग रद्द करें',
    stopRecording: 'रिकॉर्डिंग रोकें',

    online: 'ऑनलाइन',
    offline: 'ऑफ़लाइन',
    typing: 'टाइप कर रहे हैं…',

    today: 'आज',
    yesterday: 'कल',

    noConversations: 'अभी कोई बातचीत नहीं',
    startConversation: 'नई बातचीत शुरू करें',
    selectConversation:
      'चैट शुरू करने के लिए बातचीत चुनें',
    noMessages: 'नई बातचीत शुरू करें',

    newConversationTitle: 'नई बातचीत',
    searchPeople: 'किसी व्यक्ति को खोजें',
    searchPeoplePlaceholder:
      'नाम, यूज़रनेम या ईमेल से खोजें',
    noMatches: 'कोई परिणाम नहीं मिला',

    messageDeleted: 'संदेश हटा दिया गया',
    messageDeletedForMe:
      'यह संदेश आपके लिए हटा दिया गया है',

    cancel: 'रद्द करें',
    forward: 'फ़ॉरवर्ड',
  },

  gu: {
    search: 'શોધો',
    searchPlaceholder: 'વાતચીત શોધો',

    all: 'બધા',
    unread: 'અપઠિત',
    groups: 'ગ્રુપ',
    newConversation: 'નવી વાતચીત',

    messagePlaceholder: 'સંદેશ',
    voiceNote: 'વૉઇસ નોટ',
    attachFile: 'ફાઇલ જોડો',
    attachImage: 'ઇમેજ જોડો',
    emoji: 'ઇમોજી ઉમેરો',
    send: 'મોકલો',

    recording: 'રેકોર્ડ થઈ રહ્યું છે',
    cancelRecording: 'રેકોર્ડિંગ રદ કરો',
    stopRecording: 'રેકોર્ડિંગ રોકો',

    online: 'ઓનલાઇન',
    offline: 'ઓફલાઇન',
    typing: 'ટાઇપ કરી રહ્યા છે…',

    today: 'આજે',
    yesterday: 'ગઈકાલે',

    noConversations: 'હજુ કોઈ વાતચીત નથી',
    startConversation: 'નવી વાતચીત શરૂ કરો',
    selectConversation:
      'ચેટ શરૂ કરવા માટે વાતચીત પસંદ કરો',
    noMessages: 'નવી વાતચીત શરૂ કરો',

    newConversationTitle: 'નવી વાતચીત',
    searchPeople: 'કોઈને શોધો',
    searchPeoplePlaceholder:
      'નામ, યુઝરનેમ અથવા ઈમેલથી શોધો',
    noMatches: 'કોઈ પરિણામ મળ્યું નથી',

    messageDeleted: 'સંદેશ કાઢી નાખ્યો',
    messageDeletedForMe:
      'આ સંદેશ તમારા માટે કાઢી નાખવામાં આવ્યો છે',

    cancel: 'રદ કરો',
    forward: 'ફોરવર્ડ',
  },

  mr: {
    search: 'शोधा',
    searchPlaceholder: 'संभाषणे शोधा',

    all: 'सर्व',
    unread: 'न वाचलेले',
    groups: 'गट',
    newConversation: 'नवीन संभाषण',

    messagePlaceholder: 'संदेश',
    voiceNote: 'व्हॉइस नोट',
    attachFile: 'फाइल जोडा',
    attachImage: 'इमेज जोडा',
    emoji: 'इमोजी जोडा',
    send: 'पाठवा',

    recording: 'रेकॉर्डिंग सुरू आहे',
    cancelRecording: 'रेकॉर्डिंग रद्द करा',
    stopRecording: 'रेकॉर्डिंग थांबवा',

    online: 'ऑनलाइन',
    offline: 'ऑफलाइन',
    typing: 'टाइप करत आहे…',

    today: 'आज',
    yesterday: 'काल',

    noConversations: 'अजून कोणतेही संभाषण नाही',
    startConversation: 'नवीन संभाषण सुरू करा',
    selectConversation:
      'चॅट सुरू करण्यासाठी संभाषण निवडा',
    noMessages: 'नवीन संभाषण सुरू करा',

    newConversationTitle: 'नवीन संभाषण',
    searchPeople: 'एखादी व्यक्ती शोधा',
    searchPeoplePlaceholder:
      'नाव, यूजरनेम किंवा ईमेलने शोधा',
    noMatches: 'काहीही सापडले नाही',

    messageDeleted: 'संदेश हटवला',
    messageDeletedForMe:
      'हा संदेश तुमच्यासाठी हटवला आहे',

    cancel: 'रद्द करा',
    forward: 'फॉरवर्ड',
  },

  bn: {
    search: 'অনুসন্ধান',
    searchPlaceholder: 'কথোপকথন খুঁজুন',

    all: 'সব',
    unread: 'অপঠিত',
    groups: 'গ্রুপ',
    newConversation: 'নতুন কথোপকথন',

    messagePlaceholder: 'বার্তা',
    voiceNote: 'ভয়েস নোট',
    attachFile: 'ফাইল যোগ করুন',
    attachImage: 'ছবি যোগ করুন',
    emoji: 'ইমোজি যোগ করুন',
    send: 'পাঠান',

    recording: 'রেকর্ড হচ্ছে',
    cancelRecording: 'রেকর্ডিং বাতিল করুন',
    stopRecording: 'রেকর্ডিং বন্ধ করুন',

    online: 'অনলাইন',
    offline: 'অফলাইন',
    typing: 'টাইপ করছে…',

    today: 'আজ',
    yesterday: 'গতকাল',

    noConversations: 'এখনও কোনো কথোপকথন নেই',
    startConversation: 'নতুন কথোপকথন শুরু করুন',
    selectConversation:
      'চ্যাট শুরু করতে একটি কথোপকথন নির্বাচন করুন',
    noMessages: 'নতুন কথোপকথন শুরু করুন',

    newConversationTitle: 'নতুন কথোপকথন',
    searchPeople: 'কাউকে খুঁজুন',
    searchPeoplePlaceholder:
      'নাম, ইউজারনেম বা ইমেল দিয়ে খুঁজুন',
    noMatches: 'কোনো ফলাফল পাওয়া যায়নি',

    messageDeleted: 'বার্তা মুছে ফেলা হয়েছে',
    messageDeletedForMe:
      'এই বার্তাটি আপনার জন্য মুছে ফেলা হয়েছে',

    cancel: 'বাতিল',
    forward: 'ফরওয়ার্ড',
  },

  ta: {
    search: 'தேடு',
    searchPlaceholder: 'உரையாடல்களை தேடு',

    all: 'அனைத்தும்',
    unread: 'படிக்காதவை',
    groups: 'குழுக்கள்',
    newConversation: 'புதிய உரையாடல்',

    messagePlaceholder: 'செய்தி',
    voiceNote: 'குரல் குறிப்பு',
    attachFile: 'கோப்பை இணைக்கவும்',
    attachImage: 'படத்தை இணைக்கவும்',
    emoji: 'ஈமோஜி சேர்க்கவும்',
    send: 'அனுப்பு',

    recording: 'பதிவு செய்யப்படுகிறது',
    cancelRecording: 'பதிவை ரத்து செய்',
    stopRecording: 'பதிவை நிறுத்து',

    online: 'ஆன்லைன்',
    offline: 'ஆஃப்லைன்',
    typing: 'தட்டச்சு செய்கிறார்…',

    today: 'இன்று',
    yesterday: 'நேற்று',

    noConversations: 'இன்னும் உரையாடல்கள் இல்லை',
    startConversation: 'புதிய உரையாடலை தொடங்கு',
    selectConversation:
      'அரட்டையை தொடங்க உரையாடலை தேர்ந்தெடுக்கவும்',
    noMessages: 'புதிய உரையாடலை தொடங்கவும்',

    newConversationTitle: 'புதிய உரையாடல்',
    searchPeople: 'ஒருவரை தேடுங்கள்',
    searchPeoplePlaceholder:
      'பெயர், பயனர் பெயர் அல்லது மின்னஞ்சலால் தேடுங்கள்',
    noMatches: 'முடிவுகள் எதுவும் இல்லை',

    messageDeleted: 'செய்தி நீக்கப்பட்டது',
    messageDeletedForMe:
      'இந்த செய்தி உங்களுக்காக நீக்கப்பட்டது',

    cancel: 'ரத்து செய்',
    forward: 'முன்னனுப்பு',
  },

  te: {
    search: 'శోధించు',
    searchPlaceholder: 'సంభాషణలను శోధించండి',

    all: 'అన్నీ',
    unread: 'చదవనివి',
    groups: 'గ్రూపులు',
    newConversation: 'కొత్త సంభాషణ',

    messagePlaceholder: 'సందేశం',
    voiceNote: 'వాయిస్ నోట్',
    attachFile: 'ఫైల్ జోడించండి',
    attachImage: 'చిత్రం జోడించండి',
    emoji: 'ఎమోజీ జోడించండి',
    send: 'పంపండి',

    recording: 'రికార్డింగ్ జరుగుతోంది',
    cancelRecording: 'రికార్డింగ్ రద్దు చేయండి',
    stopRecording: 'రికార్డింగ్ ఆపండి',

    online: 'ఆన్‌లైన్',
    offline: 'ఆఫ్‌లైన్',
    typing: 'టైప్ చేస్తున్నారు…',

    today: 'ఈరోజు',
    yesterday: 'నిన్న',

    noConversations: 'ఇంకా సంభాషణలు లేవు',
    startConversation: 'కొత్త సంభాషణ ప్రారంభించండి',
    selectConversation:
      'చాట్ ప్రారంభించడానికి సంభాషణను ఎంచుకోండి',
    noMessages: 'కొత్త సంభాషణ ప్రారంభించండి',

    newConversationTitle: 'కొత్త సంభాషణ',
    searchPeople: 'ఒకరిని శోధించండి',
    searchPeoplePlaceholder:
      'పేరు, వినియోగదారు పేరు లేదా ఇమెయిల్ ద్వారా శోధించండి',
    noMatches: 'ఫలితాలు కనుగొనబడలేదు',

    messageDeleted: 'సందేశం తొలగించబడింది',
    messageDeletedForMe:
      'ఈ సందేశం మీ కోసం తొలగించబడింది',

    cancel: 'రద్దు',
    forward: 'ఫార్వర్డ్',
  },
}

export function normalizeChatLanguage(
  value?: string | null,
): ChatLanguage {
  const code = String(
    value || 'en',
  )
    .toLowerCase()
    .split('-')[0]

  return (
    code as ChatLanguage
  ) in translations
    ? (code as ChatLanguage)
    : 'en'
}

export function getChatTranslations(
  language?: string | null,
) {
  return translations[
    normalizeChatLanguage(language)
  ]
}