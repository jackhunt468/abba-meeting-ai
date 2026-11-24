import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Mic, Plus, Calendar, Clock, Sparkles, ArrowLeft, Square, 
  FileText, CheckCircle2, Circle, Copy, Check, 
  Share2, Download, Trash2, Search, Volume2, Tag, X, Send,
  Upload, Printer, ArchiveRestore, Archive, FileAudio, Settings as SettingsIcon,
  ChevronDown, ChevronUp, ArrowDown
} from 'lucide-react';
import './App.css';

interface ActionItem {
  task: string;
  done: boolean;
}

interface TranscriptSegment {
  id: string;
  timestamp: string;
  text: string;
  confidence: number;
  isAmbiguous: boolean;
  speaker?: string;
  pinned?: boolean;
}

type AppLanguage = 'id' | 'en';
type TranslationKey = keyof typeof translations.id;
type ScreenWakeLock = { release: () => Promise<void> };

interface WindowWithFileSystemAccess extends Window {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
}

const translations = {
  id: {
    settings: 'Pengaturan',
    logout: 'Keluar',
    language: 'Bahasa Aplikasi',
    indonesian: 'Bahasa Indonesia',
    english: 'English',
    geminiKey: 'Gemini API Key',
    keyActive: 'Aktif',
    keyInactive: 'Mode Mandiri',
    networkOnline: 'ONLINE',
    networkOffline: 'OFFLINE_READY',
    olderTranscript: 'bagian lama disembunyikan saat merekam',
    keyPlaceholderSet: 'Kunci tersimpan — masukkan untuk mengganti',
    keyPlaceholderEmpty: 'Tempel API key',
    saveKey: 'Simpan Kunci',
    removeKey: 'Hapus Kunci',
    backup: 'Backup Data (JSON)',
    restore: 'Restore Data (JSON)',
    close: 'Tutup',
    appSubtitle: 'NEURAL VOICE & INTEL ENGINE',
    meetingList: 'COMMAND CENTER',
    meetingArchive: 'Arsip Intelijen Rapat & Rekaman Suara',
    searchMeeting: 'Cari rapat...',
    newMeeting: '+ Inisiasi Sesi',
    noMeetings: 'Belum ada sesi rapat.',
    loadingMeetings: 'Memuat rapat...',
    back: 'Kembali',
    draft: 'NODE AKTIF',
    completed: 'TERKOMPILASI',
    recorder: 'VOICE STREAM',
    startRecording: 'Tangkap Suara',
    stopRecording: 'Hentikan Stream',
    syncAudio: 'Sync Audio Akurat',
    syncingAudio: 'Menyinkronkan Audio...',
    syncComplete: 'Transkrip audio akurat berhasil disinkronkan.',
    upload: 'Data Ingest',
    uploadPanelTitle: 'DATA INGEST • Impor Materi',
    dropFiles: 'Seret file ke sini',
    chooseFiles: 'Pilih File',
    fileQueue: 'Antrean',
    processFiles: 'Ingest File',
    processing: 'Memproses...',
    waiting: 'Menunggu',
    transcript: 'NEURAL TRANSCRIPT',
    reviewMode: 'Audit Sinyal',
    editMode: 'Editor Manual',
    verifyTranscript: '✓ Sinyal Terverifikasi',
    ambiguousParts: 'Anomali Teks',
    ambiguousList: 'Daftar Bagian Ambigu',
    pendingTranscript: 'Menunggu Transkrip',
    correctText: 'Kalibrasi AI',
    correcting: 'Mengoreksi...',
    summarize: 'Sintesis Intel',
    analyzing: 'Menganalisis...',
    summaryStyle: 'Gaya ringkasan',
    executiveStyle: 'Standar Eksekutif',
    detailedStyle: 'Risalah Detail',
    tasksStyle: 'Fokus Tugas & PIC',
    emptyTranscript: 'Transkrip final muncul di sini.',
    activeSpeech: 'LIVE TELEMETRY',
    waitingSpeech: 'Menunggu sinyal frekuensi suara...',
    latestTranscript: 'Terbaru',
    editTranscriptPlaceholder: 'Edit transkrip di sini...',
    correctionLabel: 'Koreksi bagian',
    saveCorrection: 'Simpan Koreksi',
    markValid: 'Tandai Valid',
    notes: 'INTELLIGENCE BRIEF',
    printPdf: 'Ekspor PDF',
    share: 'Distribusi',
    executiveSummary: 'Ringkasan Eksekutif',
    keyPoints: 'Poin Pembahasan',
    actionItems: 'Tindak Lanjut',
    noNotes: 'Menunggu sinyal suara atau transkrip untuk kompilasi intelijen...',
    presets: 'Pilih isi',
    all: 'Semua',
    summaryOnly: 'Ringkasan',
    pointsOnly: 'Poin',
    actionsOnly: 'Tindak lanjut',
    transcriptFull: 'Transkrip penuh',
    preview: 'Pratinjau',
    copyText: 'Salin Teks',
    copied: 'Tersalin',
    sendWhatsApp: 'Kirim WA',
    downloadText: 'Unduh TXT',
    openMeeting: 'Buka',
    deleteMeeting: 'Hapus',
    status: 'Status',
    date: 'Tanggal',
    createMeeting: 'Buat Sesi Rapat',
    meetingTitle: 'Judul Rapat',
    agenda: 'Agenda',
    cancel: 'Batal',
    create: 'Buat',
    save: 'Simpan',
    keyHelp: 'Kunci tersimpan di browser ini dan digunakan untuk mengirim file serta teks ke Google Gemini.',
    clearOldAudio: 'Bersihkan Audio Lama',
    storageFullToast: 'Memori browser penuh — audio otomatis diamankan ke folder Downloads, perekaman lanjut',
    storagePanel: 'Storage & Output Manager',
    storageUsed: 'Terpakai',
    storageQuota: 'Kuota',
    storageNoAudio: 'Belum ada rekaman audio disimpan di browser.',
    colTitle: 'Judul Sesi',
    colSize: 'Ukuran',
    colAction: 'Aksi',
    btnDownloadAudio: 'Unduh',
    btnDeleteAudio: 'Hapus Audio',
    btnPickFolder: 'Pilih Folder Output PC',
    btnPickFolderNotSupported: 'Fitur folder output tidak didukung di browser ini',
    folderSelected: 'Folder output aktif:',
    folderDefault: 'Menggunakan folder Downloads bawaan browser',
    outputHistoryTitle: 'Riwayat File Output / Auto-Save',
    outputHistoryEmpty: 'Belum ada file yang diekspor atau di auto-save.',
    colFileName: 'Nama File',
    colFileTime: 'Waktu',
    colFileSize: 'Ukuran',
    confirmDeleteAudio: 'Hapus audio dari sesi "{title}"? Transkrip dan notula akan tetap tersimpan.',
    audioDeleted: 'Audio sesi berhasil dihapus dari penyimpanan browser.',
    downloadStarted: 'Unduhan audio dimulai.',
    deleteError: 'Gagal menghapus audio sesi.',
    downloadError: 'Gagal mengunduh audio sesi.',
    addSpeaker: '+ Pembicara',
    speakerChip: 'Pembicara',
    pinPoint: '📌 Tandai Poin',
    pinnedPoint: 'Poin Terdicatat',
    speakerLabel: 'Pembicara',
    applyToAll: 'Terapkan ke semua segmen dengan nama yang sama',
    renameSpeaker: 'Ganti nama pembicara',
    importantPoint: '⭐ PENTING',
    pinnedBadge: 'Terdicatat',
    createdWith: 'Dokumen dibuat dengan ABBA Smart Meeting'
  },
  en: {
    settings: 'Settings',
    logout: 'Logout',
    language: 'App language',
    indonesian: 'Bahasa Indonesia',
    english: 'English',
    geminiKey: 'Gemini API Key',
    keyActive: 'Active',
    keyInactive: 'Standalone Mode',
    networkOnline: 'ONLINE',
    networkOffline: 'OFFLINE_READY',
    olderTranscript: 'older segments hidden while recording',
    keyPlaceholderSet: 'Key saved — enter a new key to replace',
    keyPlaceholderEmpty: 'Paste API key',
    saveKey: 'Save Key',
    removeKey: 'Remove Key',
    backup: 'Back Up Data (JSON)',
    restore: 'Restore Data (JSON)',
    close: 'Close',
    appSubtitle: 'NEURAL VOICE & INTEL ENGINE',
    meetingList: 'COMMAND_CENTER',
    meetingArchive: 'Meeting and notes archive',
    searchMeeting: 'Search meetings...',
    newMeeting: '+ INIT_SESSION',
    noMeetings: 'No meetings yet.',
    loadingMeetings: 'Loading meetings...',
    back: 'Back',
    draft: 'ACTIVE_NODE',
    completed: 'COMPILED',
    recorder: 'VOICE_STREAM',
    startRecording: 'CAPTURE_AUDIO',
    stopRecording: 'TERMINATE_STREAM',
    syncAudio: 'SYNC_ACCURATE_AUDIO',
    syncingAudio: 'SYNCING_AUDIO...',
    syncComplete: 'Accurate audio transcript synchronized.',
    upload: 'DATA_INGEST',
    uploadPanelTitle: 'DATA_INGEST • IMPORT',
    dropFiles: 'Drop files here',
    chooseFiles: 'Choose Files',
    fileQueue: 'Queue',
    processFiles: 'INGEST_FILES',
    processing: 'Processing...',
    waiting: 'Waiting',
    transcript: 'NEURAL_DECODE',
    reviewMode: 'SIGNAL_AUDIT',
    editMode: 'RAW_EDITOR',
    verifyTranscript: '✓ VERIFIED',
    ambiguousParts: 'ANOMALIES',
    ambiguousList: 'Ambiguous Segments',
    pendingTranscript: 'Waiting for Transcript',
    correctText: 'CALIBRATE_AI',
    correcting: 'Correcting...',
    summarize: 'SYNTHESIZE',
    analyzing: 'Analyzing...',
    summaryStyle: 'Summary style',
    executiveStyle: 'Executive Summary',
    detailedStyle: 'Detailed Minutes',
    tasksStyle: 'Tasks & Owners',
    emptyTranscript: 'Final transcript appears here.',
    activeSpeech: 'LIVE_TELEMETRY',
    waitingSpeech: 'Awaiting vocal frequency...',
    latestTranscript: 'Latest',
    editTranscriptPlaceholder: 'Edit transcript here...',
    correctionLabel: 'Correct this segment',
    saveCorrection: 'Save Correction',
    markValid: 'Mark as Valid',
    notes: 'INTEL_SYNTHESIS',
    printPdf: 'EXPORT_PDF',
    share: 'DISPATCH',
    executiveSummary: 'Executive Summary',
    keyPoints: 'Key Points',
    actionItems: 'Action Items',
    noNotes: 'Awaiting telemetry stream for executive compilation...',
    presets: 'Share sections',
    all: 'All',
    summaryOnly: 'Summary',
    pointsOnly: 'Key points',
    actionsOnly: 'Action items',
    transcriptFull: 'Full transcript',
    preview: 'Preview',
    copyText: 'Copy Text',
    copied: 'Copied',
    sendWhatsApp: 'Send via WhatsApp',
    downloadText: 'Download TXT',
    openMeeting: 'Open',
    deleteMeeting: 'Delete',
    status: 'Status',
    date: 'Date',
    createMeeting: 'Create Meeting',
    meetingTitle: 'Meeting Title',
    agenda: 'Agenda',
    cancel: 'Cancel',
    create: 'Create',
    save: 'Save',
    keyHelp: 'The key is stored in this browser and used to send files and text to Google Gemini.',
    clearOldAudio: 'Clear Old Audio',
    storageFullToast: 'Browser storage full — audio auto-saved to Downloads folder, recording continues',
    storagePanel: 'Storage & Output Manager',
    storageUsed: 'Used',
    storageQuota: 'Quota',
    storageNoAudio: 'No audio recordings stored in browser.',
    colTitle: 'Session Title',
    colSize: 'Size',
    colAction: 'Action',
    btnDownloadAudio: 'Download',
    btnDeleteAudio: 'Delete Audio',
    btnPickFolder: 'Choose Output Folder PC',
    btnPickFolderNotSupported: 'Output folder feature not supported in this browser',
    folderSelected: 'Active output folder:',
    folderDefault: 'Using browser default Downloads folder',
    outputHistoryTitle: 'Output History / Auto-Save',
    outputHistoryEmpty: 'No files exported or auto-saved yet.',
    colFileName: 'File Name',
    colFileTime: 'Time',
    colFileSize: 'Size',
    confirmDeleteAudio: 'Delete audio from session "{title}"? Transcript and notes will remain.',
    audioDeleted: 'Session audio deleted from browser storage.',
    downloadStarted: 'Audio download started.',
    deleteError: 'Failed to delete session audio.',
    downloadError: 'Failed to download session audio.',
    addSpeaker: '+ Speaker',
    speakerChip: 'Speaker',
    pinPoint: '📌 Pin Point',
    pinnedPoint: 'Point Pinned',
    speakerLabel: 'Speaker',
    applyToAll: 'Apply to all segments with same name',
    renameSpeaker: 'Rename Speaker',
    importantPoint: '⭐ IMPORTANT',
    pinnedBadge: 'Pinned',
    createdWith: 'Document created with ABBA Smart Meeting'
  }
} as const;

type CaptureFileStatus = 'queued' | 'processing' | 'done' | 'error';

interface CaptureFile {
  id: string;
  file: File;
  previewUrl: string | null;
  status: CaptureFileStatus;
  progress: number;
  statusMessage?: string;
  completedChunks?: number[];
  error?: string;
}

type SummaryStyle = 'executive' | 'detailed' | 'tasks';

interface GeneratedNotes {
  executive_summary: string;
  key_points: string[];
  action_items: ActionItem[];
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  status: string;
  transcript?: string;
  executive_summary?: string;
  key_points?: string[];
  action_items?: ActionItem[];
  audio_file_name?: string;
  audio_mime_type?: string;
  speakers?: string[];
}

type TokenRole = 'MASTER' | 'OPERATOR';

interface TokenRecord {
  id: string;
  hash: string;
  label: string;
  role: TokenRole;
  expiresAt: number | null;
  active: boolean;
}

interface AuthSession {
  id: string;
  hash: string;
  role: TokenRole;
  expiresAt: number | null;
}

const MEETING_DATABASE = 'abba_smart_meeting_db';
const SESSIONS_STORE = 'sessions_store';
const LEGACY_AUDIO_DATABASE = 'abba_meeting_audio';
const LEGACY_AUDIO_STORE = 'meeting_audio';
const TOKEN_REGISTRY_STORAGE = 'abba_token_registry';
const AUTH_SESSION_STORAGE = 'abba_auth_session';
const LOGIN_GUARD_STORAGE = 'abba_login_guard';
const LAST_BACKUP_STORAGE = 'abba_last_backup_at';
const BACKUP_FORMAT = 'abba-meeting-ai-backup';
const LEGACY_GEMINI_API_KEY_STORAGE = 'abba_gemini_api_key';
const LEGACY_MEETINGS_STORAGE_KEY = 'abba_local_meetings';
const LEGACY_MEETINGS_STORAGE_KEYS = ['meetings', 'abba_meetings'];
const DEFAULT_MASTER_TOKEN_HASH = '3a3840e77ffb5f0996c9e3f6c7d57251e3ac671adfef7cd51d9049ac41bcef2e';
const MAX_GEMINI_INLINE_FILE_SIZE = 20 * 1024 * 1024;
const LARGE_AUDIO_THRESHOLD = 14 * 1024 * 1024;
const AUDIO_SAMPLE_RATE = 12000;
const AUDIO_CHUNK_SECONDS = 480;
const AUDIO_CHUNK_OVERLAP_SECONDS = 2;
const AUDIO_CHUNK_STEP_SECONDS = AUDIO_CHUNK_SECONDS - AUDIO_CHUNK_OVERLAP_SECONDS;
const AUDIO_BITRATE_BPS = 24000;
const STORAGE_SAFE_PERCENT = 80;
const GEMINI_FILE_SIZE_WARNING = 'Ukuran file melebihi batas 20 MB untuk pemrosesan langsung. Kompres atau potong rekaman menjadi di bawah 20 MB.';

const hashTokenSHA256 = async (rawToken: string): Promise<string> => {
  const digest = await window.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(rawToken.trim().toUpperCase())
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

interface StoredSessionRecord {
  key: string;
  namespace: string;
  meeting: Meeting;
  audioBlob?: Blob;
}

const getSessionNamespace = (auth: AuthSession) => auth.hash.slice(0, 16);
const getLegacyMeetingsStorageKey = (auth: AuthSession) => `abba_sessions_${getSessionNamespace(auth)}`;
const getApiKeyStorageKey = (auth: AuthSession) => `abba_api_key_${getSessionNamespace(auth)}`;

const createTranscriptSegment = (
  text: string,
  timestamp = '00:00',
  confidence = 1,
  isAmbiguous = false,
  speaker?: string,
  pinned = false
): TranscriptSegment => {
  const normalizedText = text.trim();
  const repeatedWord = /\b([\p{L}\p{N}]+)(?:\s+\1){1,}\b/iu.test(normalizedText);
  const incompleteEnding = /\b(?:dan|atau|yang|untuk|dengan|karena|sehingga|tetapi|namun|di|ke|dari|pada|adalah|akan|sudah|belum)$/i.test(normalizedText);
  const uncertainPhrase = /\b(?:kurang jelas|tidak jelas|nggak jelas|tidak terdengar|kurang terdengar|mungkin|sepertinya|saya tidak yakin|angka(?:nya)? tidak pasti)\b/i.test(normalizedText);
  const uncertainNumber = /\b(?:sekitar|kurang lebih|kira-kira|mungkin)\s+(?:Rp\s*)?\d[\d.,]*/i.test(normalizedText)
    || /\b(?:Rp\.?\s*)?\d[\d.,]*\s*(?:\?|atau\s+\d|kurang lebih|kira-kira)\b/i.test(normalizedText);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp,
    text: normalizedText,
    confidence,
    isAmbiguous: isAmbiguous || confidence < 0.78 || repeatedWord || incompleteEnding || uncertainPhrase || uncertainNumber,
    ...(speaker ? { speaker } : {}),
    ...(pinned ? { pinned } : {})
  };
};

const getSpeechWords = (text: string) =>
  Array.from(text.matchAll(/[\p{L}\p{N}]+/gu), (match) => match[0].toLocaleLowerCase());

const stripCommittedSpeechPrefix = (text: string, committedWords: string[]) => {
  if (!committedWords.length) return text.trim();
  const matches = Array.from(text.matchAll(/[\p{L}\p{N}]+/gu));
  const maxOverlap = Math.min(committedWords.length, matches.length);
  for (let overlap = maxOverlap; overlap >= 4; overlap -= 1) {
    const offsetStart = committedWords.length - overlap;
    let matchesOffset = true;
    for (let index = 0; index < overlap; index += 1) {
      if (matches[index][0].toLocaleLowerCase() !== committedWords[offsetStart + index]) {
        matchesOffset = false;
        break;
      }
    }
    if (!matchesOffset) continue;
    const end = (matches[overlap - 1].index ?? 0) + matches[overlap - 1][0].length;
    return text.slice(end).trim().replace(/^[\s,.;:!?-]+/, '');
  }
  return text.trim();
};

const transcriptToSegments = (value: string): TranscriptSegment[] => value
  .split(/\n/)
  .map((line) => {
    const timestampMatch = line.match(/^\[(\d{2,}:\d{2}(?::\d{2})?)\]\s*(.*)$/);
    const text = timestampMatch ? timestampMatch[2] : line.trim();
    if (!text) return null;
    return createTranscriptSegment(text, timestampMatch?.[1] || '00:00');
  })
  .filter((segment): segment is TranscriptSegment => segment !== null);

const segmentsToTranscript = (segments: TranscriptSegment[]): string => segments
  .map((segment) => `[${segment.timestamp}] ${segment.text}`)
  .join('\n');

const transcriptCorrectionToSegments = (value: string): TranscriptSegment[] => {
  const ambiguousMarker = /\[\[AMBIGU:\s*(.*?)\s*\|\s*(.*?)\]\]/g;
  const segments: TranscriptSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ambiguousMarker.exec(value)) !== null) {
    const before = value.slice(lastIndex, match.index).trim();
    if (before) segments.push(...transcriptToSegments(before));
    const lineStart = value.lastIndexOf('\n', match.index) + 1;
    const linePrefix = value.slice(lineStart, match.index);
    const timestamp = linePrefix.match(/^\[(\d{2,}:\d{2}(?::\d{2})?)\]/)?.[1] || '00:00';
    const original = match[1].trim();
    const suggestion = match[2].trim();
    segments.push(createTranscriptSegment(
      suggestion ? `${original} (saran: ${suggestion})` : original,
      timestamp,
      0,
      true
    ));
    lastIndex = match.index + match[0].length;
  }
  const remainder = value.slice(lastIndex).trim();
  if (remainder) segments.push(...transcriptToSegments(remainder));
  return segments;
};

class GeminiHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'GeminiHttpError';
    this.status = status;
  }
}

const callGeminiV1Beta = async (apiKey: string, parts: any[]): Promise<string> => {
  const encodedApiKey = encodeURIComponent(apiKey);
  const modelsResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodedApiKey}`
  );
  if (!modelsResponse.ok) {
    const errorBody = await modelsResponse.text();
    throw new Error(`Gagal mengambil daftar model Gemini (HTTP ${modelsResponse.status}): ${errorBody || modelsResponse.statusText}`);
  }

  const modelData: unknown = await modelsResponse.json();
  if (!modelData || typeof modelData !== 'object' || !('models' in modelData) || !Array.isArray(modelData.models)) {
    throw new Error('Respons daftar model Gemini tidak memiliki format yang valid.');
  }

  const excludedModelTerms = ['embedding', 'imagen', 'veo', 'aqa'];
  const candidateModels = modelData.models
    .filter((model: unknown): model is { name: string; supportedGenerationMethods: string[] } => {
      if (!model || typeof model !== 'object' || !('name' in model) || !('supportedGenerationMethods' in model)) return false;
      const candidate = model as { name?: unknown; supportedGenerationMethods?: unknown };
      return typeof candidate.name === 'string'
        && candidate.name.toLowerCase().includes('gemini')
        && Array.isArray(candidate.supportedGenerationMethods)
        && candidate.supportedGenerationMethods.includes('generateContent');
    })
    .filter((model) => !excludedModelTerms.some((term) => model.name.toLowerCase().includes(term)))
    .sort((left, right) => {
      const leftName = left.name.toLowerCase();
      const rightName = right.name.toLowerCase();
      const leftFlash = leftName.includes('flash');
      const rightFlash = rightName.includes('flash');
      if (leftFlash !== rightFlash) return leftFlash ? -1 : 1;

      const flashPriority = ['gemini-3-flash-preview', 'gemini-3-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      const leftPriority = flashPriority.findIndex((modelName) => leftName.includes(modelName));
      const rightPriority = flashPriority.findIndex((modelName) => rightName.includes(modelName));
      const normalizedLeftPriority = leftPriority < 0 ? flashPriority.length : leftPriority;
      const normalizedRightPriority = rightPriority < 0 ? flashPriority.length : rightPriority;
      return normalizedLeftPriority - normalizedRightPriority || leftName.localeCompare(rightName);
    });

  if (!candidateModels.length) {
    throw new Error('Tidak ditemukan model Gemini yang mendukung generateContent untuk API Key ini.');
  }

  const failures: string[] = [];
  for (const model of candidateModels) {
    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${model.name}:generateContent?key=${encodedApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        }
      );
    } catch (error) {
      failures.push(`${model.name} (gagal terhubung: ${error instanceof Error ? error.message : 'kesalahan jaringan'})`);
      continue;
    }

    if (response.ok) {
      const result: unknown = await response.json();
      if (!result || typeof result !== 'object' || !('candidates' in result) || !Array.isArray(result.candidates)) {
        throw new Error(`Model ${model.name} mengembalikan respons Gemini yang tidak valid.`);
      }
      const candidate = result.candidates[0];
      if (!candidate || typeof candidate !== 'object' || !('content' in candidate)) {
        throw new Error(`Model ${model.name} tidak menghasilkan kandidat teks.`);
      }
      const content = candidate.content;
      if (!content || typeof content !== 'object' || !('parts' in content) || !Array.isArray(content.parts)) {
        throw new Error(`Respons teks dari model ${model.name} tidak valid.`);
      }
      const text = content.parts
        .filter((part: unknown): part is { text: string } =>
          Boolean(part && typeof part === 'object' && 'text' in part && typeof part.text === 'string')
        )
        .map((part: { text: string }) => part.text)
        .join('\n')
        .trim();
      if (!text) throw new Error(`Model ${model.name} tidak mengembalikan teks.`);
      return text;
    }
    const errorBody = await response.text();
    if (response.status === 429) {
      throw new GeminiHttpError(429, `Gemini rate limit (HTTP 429) pada ${model.name}: ${errorBody || response.statusText}`);
    }
    failures.push(`${model.name} (HTTP ${response.status}: ${errorBody || response.statusText})`);
  }

  const discoveredModels = candidateModels.map((model) => model.name).join(', ');
  throw new Error(
    `Semua kandidat model Gemini gagal. Model yang ditemukan untuk API Key ini: ${discoveredModels}. Detail kegagalan: ${failures.join(' | ')}`
  );
};

type FileKind = 'audio' | 'image' | 'pdf' | 'text' | 'office';

const getFileExtension = (file: File) => file.name.split('.').pop()?.toLowerCase() || '';

const getFileKind = (file: File): FileKind | null => {
  const extension = getFileExtension(file);
  if (['mp3', 'm4a', 'wav', 'ogg', 'webm'].includes(extension || '')) return 'audio';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) return 'image';
  if (extension === 'pdf') return 'pdf';
  if (['txt', 'csv'].includes(extension)) return 'text';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) return 'office';
  return null;
};

const getInlineMimeType = (file: File) => {
  if (file.type) return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    webm: 'audio/webm',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    pdf: 'application/pdf',
    txt: 'text/plain',
    csv: 'text/csv',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  return mimeTypes[extension || ''] || 'application/octet-stream';
};

const parseXml = (xml: string, fileName: string) => {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.querySelector('parsererror')) throw new Error(`${fileName} berisi XML yang tidak valid.`);
  return document;
};

const getXmlTextNodes = (document: Document | Element, tagName: string) =>
  Array.from(document.getElementsByTagNameNS('*', tagName)).map((node) => node.textContent || '');

const extractOfficeText = async (file: File): Promise<string> => {
  const extension = getFileExtension(file);
  if (extension === 'xlsx' || extension === 'docx' || extension === 'pptx') {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(file);

    if (extension === 'docx') {
      const documentXml = zip.file('word/document.xml');
      if (!documentXml) throw new Error('Dokumen Word tidak memiliki isi yang dapat dibaca.');
      const xml = parseXml(await documentXml.async('text'), file.name);
      return Array.from(xml.getElementsByTagNameNS('*', 'p'))
        .map((paragraph) => getXmlTextNodes(paragraph, 't').join(''))
        .filter(Boolean)
        .join('\n')
        .trim();
    }

    if (extension === 'pptx') {
      const slideFiles = Object.keys(zip.files)
        .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
        .sort((left, right) => Number(left.match(/slide(\d+)/)?.[1]) - Number(right.match(/slide(\d+)/)?.[1]));
      const slideTexts = await Promise.all(slideFiles.map(async (name, index) => {
        const slide = zip.file(name);
        if (!slide) return '';
        const xml = parseXml(await slide.async('text'), file.name);
        const paragraphs = Array.from(xml.getElementsByTagNameNS('*', 'p'))
          .map((paragraph) => getXmlTextNodes(paragraph, 't').join(''))
          .filter(Boolean);
        return `Slide ${index + 1}: ${paragraphs.join('\n')}`;
      }));
      return slideTexts.filter(Boolean).join('\n');
    }

    const workbookXml = zip.file('xl/workbook.xml');
    const sharedStringsXml = zip.file('xl/sharedStrings.xml');
    if (!workbookXml) throw new Error('Workbook Excel tidak memiliki struktur yang dapat dibaca.');
    const sharedStrings = sharedStringsXml
      ? Array.from(parseXml(await sharedStringsXml.async('text'), file.name).getElementsByTagNameNS('*', 'si'))
        .map((item) => getXmlTextNodes(item, 't').join(''))
      : [];
    const sheetFiles = Object.keys(zip.files)
      .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
      .sort((left, right) => Number(left.match(/sheet(\d+)/)?.[1]) - Number(right.match(/sheet(\d+)/)?.[1]));
    const sheets = await Promise.all(sheetFiles.map(async (name, index) => {
      const sheetFile = zip.file(name);
      if (!sheetFile) return '';
      const sheet = parseXml(await sheetFile.async('text'), file.name);
      const rows = Array.from(sheet.getElementsByTagNameNS('*', 'row')).map((row) =>
        Array.from(row.getElementsByTagNameNS('*', 'c')).map((cell) => {
          const value = cell.getElementsByTagNameNS('*', 'v').item(0)?.textContent || '';
          const inlineText = getXmlTextNodes(cell, 't').join('');
          return cell.getAttribute('t') === 's' ? sharedStrings[Number(value)] || '' : inlineText || value;
        }).filter(Boolean).join(' | ')
      ).filter(Boolean);
      return rows.length ? `Sheet ${index + 1}:\n${rows.join('\n')}` : '';
    }));
    return sheets.filter(Boolean).join('\n\n');
  }

  if (extension === 'xls') {
    const XLSX = await import('@e965/xlsx');
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const sheets = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      return sheet ? `${name}:\n${XLSX.utils.sheet_to_csv(sheet)}` : '';
    }).filter(Boolean);
    if (!sheets.length) throw new Error('Workbook Excel tidak memiliki sheet yang dapat dibaca.');
    return sheets.join('\n\n');
  }
  if (extension === 'doc' || extension === 'ppt') {
    throw new Error(`Format Office .${extension} lama memerlukan Kunci AI. Simpan ulang sebagai .${extension}x untuk ekstraksi lokal.`);
  }
  throw new Error(`Ekstraksi lokal untuk .${extension} belum tersedia.`);
};

const extractPdfText = async (file: File): Promise<string> => {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const document = await pdfjs.getDocument({
    data: await file.arrayBuffer(),
  }).promise;
  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => 'str' in item ? item.str : '')
      .filter(Boolean)
      .join(' ');
    if (text.trim()) pageTexts.push(`Halaman ${pageNumber}:\n${text.trim()}`);
  }
  return pageTexts.join('\n\n');
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const readFileAsBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      reject(new Error(`File ${file.name} tidak dapat dibaca.`));
      return;
    }
    const base64 = reader.result.split(',')[1];
    if (!base64) {
      reject(new Error(`Data file ${file.name} tidak valid.`));
      return;
    }
    resolve(base64);
  };
  reader.onerror = () => reject(reader.error || new Error(`File ${file.name} tidak dapat dibaca.`));
  reader.readAsDataURL(file);
});

const readBlobAsBase64 = (blob: Blob, fileName: string): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      reject(new Error(`File ${fileName} tidak dapat dibaca.`));
      return;
    }
    const base64 = reader.result.split(',')[1];
    if (!base64) {
      reject(new Error(`Data file ${fileName} tidak valid.`));
      return;
    }
    resolve(base64);
  };
  reader.onerror = () => reject(reader.error || new Error(`File ${fileName} tidak dapat dibaca.`));
  reader.readAsDataURL(blob);
});

const getAudioDuration = (file: File): Promise<number> => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const audio = new Audio();
  const timeout = window.setTimeout(() => {
    audio.src = '';
    URL.revokeObjectURL(url);
    reject(new Error(`Durasi audio ${file.name} tidak dapat dibaca.`));
  }, 30000);
  const cleanup = () => {
    window.clearTimeout(timeout);
    audio.removeAttribute('src');
    audio.load();
    URL.revokeObjectURL(url);
  };
  audio.preload = 'metadata';
  audio.onloadedmetadata = () => {
    const duration = audio.duration;
    cleanup();
    if (Number.isFinite(duration) && duration > 0) resolve(duration);
    else reject(new Error(`Durasi audio ${file.name} tidak valid.`));
  };
  audio.onerror = () => {
    cleanup();
    reject(new Error(`Browser tidak dapat membaca metadata audio ${file.name}.`));
  };
  audio.src = url;
});

const encodeMonoPcmWav = (audioBuffer: AudioBuffer): Blob => {
  const samples = audioBuffer.getChannelData(0);
  const wavBuffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(wavBuffer);
  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, AUDIO_SAMPLE_RATE, true);
  view.setUint32(28, AUDIO_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(44 + index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return new Blob([wavBuffer], { type: 'audio/wav' });
};

const formatAudioTimestamp = (seconds: number) => {
  const wholeSeconds = Math.floor(seconds);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const remainingSeconds = wholeSeconds % 60;
  return [hours, minutes, remainingSeconds].map((part) => part.toString().padStart(2, '0')).join(':');
};

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const readFileAsText = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
  reader.onerror = () => reject(reader.error || new Error(`File ${file.name} tidak dapat dibaca.`));
  reader.readAsText(file);
});

const parseJsonObject = (text: string): Record<string, unknown> => {
  const json = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = json.indexOf('{');
  const end = json.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Respons Gemini tidak berisi JSON yang valid.');
  const parsed: unknown = JSON.parse(json.slice(start, end + 1));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Format respons Gemini tidak valid.');
  }
  return parsed as Record<string, unknown>;
};

const normalizeGeneratedNotes = (value: Record<string, unknown>): GeneratedNotes => {
  const actionItems = Array.isArray(value.action_items)
    ? value.action_items
      .map((item): ActionItem | null => {
        if (typeof item === 'string') return { task: item, done: false };
        if (!item || typeof item !== 'object') return null;
        const action = item as { task?: unknown; done?: unknown };
        return typeof action.task === 'string'
          ? { task: action.task, done: typeof action.done === 'boolean' ? action.done : false }
          : null;
      })
      .filter((item): item is ActionItem => item !== null)
    : [];
  return {
    executive_summary: typeof value.executive_summary === 'string' ? value.executive_summary : '',
    key_points: Array.isArray(value.key_points)
      ? value.key_points.filter((point): point is string => typeof point === 'string')
      : [],
    action_items: actionItems,
  };
};

const compressImageFile = async (file: File): Promise<File> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const imageElement = new window.Image();
    imageElement.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(imageElement);
    };
    imageElement.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error(`Gambar ${file.name} tidak dapat dibuka.`));
    };
    imageElement.src = imageUrl;
  });
  const scale = Math.min(1, 1600 / image.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas tidak tersedia untuk kompresi gambar.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error(`Gambar ${file.name} gagal dikompres.`)),
      'image/jpeg',
      0.8
    );
  });
  const jpegName = file.name.replace(/\.[^.]+$/, '.jpg');
  return new File([blob], jpegName, { type: 'image/jpeg', lastModified: file.lastModified });
};

const normalizeStoredMeeting = (value: unknown): Meeting | null => {
  if (!value || typeof value !== 'object') return null;
  const meeting = value as Partial<Meeting>;
  if (typeof meeting.id !== 'string' || typeof meeting.title !== 'string') return null;

  return {
    id: meeting.id,
    title: meeting.title,
    description: typeof meeting.description === 'string' ? meeting.description : null,
    meeting_date: typeof meeting.meeting_date === 'string' ? meeting.meeting_date : new Date().toISOString(),
    status: typeof meeting.status === 'string' ? meeting.status : 'draft',
    ...(typeof meeting.transcript === 'string' ? { transcript: meeting.transcript } : {}),
    ...(typeof meeting.executive_summary === 'string' ? { executive_summary: meeting.executive_summary } : {}),
    ...(Array.isArray(meeting.key_points) ? { key_points: meeting.key_points.filter((point): point is string => typeof point === 'string') } : {}),
    ...(Array.isArray(meeting.action_items) ? {
      action_items: meeting.action_items.filter((item): item is ActionItem =>
        Boolean(item && typeof item.task === 'string' && typeof item.done === 'boolean')
      )
    } : {}),
    ...(typeof meeting.audio_file_name === 'string' ? { audio_file_name: meeting.audio_file_name } : {}),
    ...(typeof meeting.audio_mime_type === 'string' ? { audio_mime_type: meeting.audio_mime_type } : {}),
    ...(Array.isArray(meeting.speakers) ? { speakers: meeting.speakers.filter((s): s is string => typeof s === 'string') } : {})
  };
};

const openMeetingDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = window.indexedDB.open(MEETING_DATABASE, 3);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(SESSIONS_STORE)) {
      const store = database.createObjectStore(SESSIONS_STORE, { keyPath: 'key' });
      store.createIndex('namespace', 'namespace', { unique: false });
    }
    if (database.objectStoreNames.contains('invitation_keys_store')) {
      database.deleteObjectStore('invitation_keys_store');
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Database sesi tidak dapat dibuka.'));
});

const openLegacyAudioDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = window.indexedDB.open(LEGACY_AUDIO_DATABASE, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(LEGACY_AUDIO_STORE)) {
      request.result.createObjectStore(LEGACY_AUDIO_STORE);
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Database audio lama tidak dapat dibuka.'));
});

const loadStoredSessions = async (namespace: string): Promise<StoredSessionRecord[]> => {
  const database = await openMeetingDatabase();
  try {
    return await new Promise<StoredSessionRecord[]>((resolve, reject) => {
      const request = database.transaction(SESSIONS_STORE, 'readonly')
        .objectStore(SESSIONS_STORE)
        .index('namespace')
        .getAll(namespace);
      request.onsuccess = () => resolve(request.result as StoredSessionRecord[]);
      request.onerror = () => reject(request.error || new Error('Data sesi tidak dapat dibaca.'));
    });
  } finally {
    database.close();
  }
};

const saveMeetingsToIndexedDB = async (
  namespace: string,
  meetings: Meeting[],
  importedAudio = new Map<string, Blob>()
) => {
  const database = await openMeetingDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(SESSIONS_STORE, 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.index('namespace').getAll(namespace);
      request.onsuccess = () => {
        const existingById = new Map(
          (request.result as StoredSessionRecord[]).map((record) => [record.meeting.id, record])
        );
        const nextIds = new Set(meetings.map((meeting) => meeting.id));
        for (const meeting of meetings) {
          const previous = existingById.get(meeting.id);
          if (previous
            && !importedAudio.has(meeting.id)
            && JSON.stringify(previous.meeting) === JSON.stringify(meeting)) continue;
          const audioBlob = importedAudio.get(meeting.id) || previous?.audioBlob;
          const record: StoredSessionRecord = {
            key: `${namespace}:${meeting.id}`,
            namespace,
            meeting,
            ...(audioBlob ? { audioBlob } : {})
          };
          store.put(record);
        }
        for (const previous of existingById.values()) {
          if (!nextIds.has(previous.meeting.id)) store.delete(previous.key);
        }
      };
      request.onerror = () => reject(request.error || new Error('Data sesi gagal disiapkan untuk disimpan.'));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Data sesi gagal disimpan.'));
      transaction.onabort = () => reject(transaction.error || new Error('Penyimpanan data sesi dibatalkan.'));
    });
  } finally {
    database.close();
  }
};

const migrateLegacyAudio = async (
  namespace: string,
  meetingIds: string[],
  includeUnscoped: boolean
): Promise<{ audio: Map<string, Blob>; migratedKeys: string[] }> => {
  const audio = new Map<string, Blob>();
  const migratedKeys: string[] = [];
  if (!meetingIds.length) return { audio, migratedKeys };
  const database = await openLegacyAudioDatabase();
  try {
    await Promise.all(meetingIds.map(async (meetingId) => {
      const keys = [`${namespace}:${meetingId}`, ...(includeUnscoped ? [meetingId] : [])];
      for (const key of keys) {
        const blob = await new Promise<Blob | null>((resolve, reject) => {
          const request = database.transaction(LEGACY_AUDIO_STORE, 'readonly')
            .objectStore(LEGACY_AUDIO_STORE)
            .get(key);
          request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
          request.onerror = () => reject(request.error || new Error('Audio lama tidak dapat dibaca.'));
        });
        if (blob) {
          audio.set(meetingId, blob);
          migratedKeys.push(key);
          break;
        }
      }
    }));
    return { audio, migratedKeys };
  } finally {
    database.close();
  }
};

const removeLegacyAudio = async (keys: string[]) => {
  if (!keys.length) return;
  const database = await openLegacyAudioDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(LEGACY_AUDIO_STORE, 'readwrite');
      const store = transaction.objectStore(LEGACY_AUDIO_STORE);
      keys.forEach((key) => store.delete(key));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Audio lama tidak dapat dibersihkan.'));
      transaction.onabort = () => reject(transaction.error || new Error('Pembersihan audio lama dibatalkan.'));
    });
  } finally {
    database.close();
  }
};

const migrateLegacySessions = async (
  namespace: string,
  namespaceStorageKey: string,
  includeGlobalLegacy: boolean
): Promise<Meeting[]> => {
  const sourceKeys = [
    namespaceStorageKey,
    ...(includeGlobalLegacy ? [LEGACY_MEETINGS_STORAGE_KEY, ...LEGACY_MEETINGS_STORAGE_KEYS] : [])
  ];
  const legacyMeetings = new Map<string, Meeting>();
  const keysToRemove: string[] = [];
  for (const key of sourceKeys) {
    const saved = localStorage.getItem(key);
    if (saved === null) continue;
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      throw new Error(`Data sesi pada "${key}" tidak valid.`);
    }
    parsed
      .map(normalizeStoredMeeting)
      .filter((meeting): meeting is Meeting => meeting !== null)
      .forEach((meeting) => {
        if (!legacyMeetings.has(meeting.id)) legacyMeetings.set(meeting.id, meeting);
      });
    keysToRemove.push(key);
  }

  const existingRecords = await loadStoredSessions(namespace);
  const meetingsById = new Map(existingRecords.map((record) => [record.meeting.id,
    record.audioBlob && !record.meeting.audio_file_name
      ? {
        ...record.meeting,
        audio_file_name: `rekaman.${record.audioBlob.type.includes('mp4') ? 'm4a' : 'webm'}`,
        audio_mime_type: record.audioBlob.type
      }
      : record.meeting
  ]));
  for (const meeting of legacyMeetings.values()) {
    if (!meetingsById.has(meeting.id)) meetingsById.set(meeting.id, meeting);
  }
  const meetings = [...meetingsById.values()]
    .sort((left, right) => Date.parse(right.meeting_date) - Date.parse(left.meeting_date));
  if (keysToRemove.length) {
    const meetingIdsWithoutAudio = [...legacyMeetings.keys()].filter((id) =>
      !existingRecords.some((record) => record.meeting.id === id && record.audioBlob)
    );
    const migrated = await migrateLegacyAudio(namespace, meetingIdsWithoutAudio, includeGlobalLegacy);
    const meetingsWithAudioMetadata = meetings.map((meeting) => {
      const audio = migrated.audio.get(meeting.id);
      return audio && !meeting.audio_file_name
        ? {
          ...meeting,
          audio_file_name: `rekaman.${audio.type.includes('mp4') ? 'm4a' : 'webm'}`,
          audio_mime_type: audio.type
        }
        : meeting;
    });
    await saveMeetingsToIndexedDB(namespace, meetingsWithAudioMetadata, migrated.audio);
    await removeLegacyAudio(migrated.migratedKeys);
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    return meetingsWithAudioMetadata.sort(
      (left, right) => Date.parse(right.meeting_date) - Date.parse(left.meeting_date)
    );
  }
  return meetings;
};

const storeMeetingAudio = async (namespace: string, meetingId: string, audioBlob: Blob): Promise<boolean> => {
  const database = await openMeetingDatabase();
  try {
    // Cek kuota penyimpanan sebelum menyimpan (proaktif)
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usagePercent = estimate.quota
        ? Math.round(((estimate.usage || 0) / estimate.quota) * 100)
        : 0;
      if (usagePercent >= STORAGE_SAFE_PERCENT) {
        return false;
      }
    }

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(SESSIONS_STORE, 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const key = `${namespace}:${meetingId}`;
      const request = store.get(key);
      request.onsuccess = () => {
        const record = request.result as StoredSessionRecord | undefined;
        if (!record) {
          transaction.abort();
          reject(new Error('Sesi rapat tidak ditemukan untuk menyimpan audio.'));
          return;
        }
        record.audioBlob = audioBlob;
        store.put(record);
      };
      request.onerror = () => reject(request.error || new Error('Data sesi audio tidak dapat dibaca.'));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Audio gagal disimpan.'));
      transaction.onabort = () => reject(transaction.error || new Error('Penyimpanan audio dibatalkan.'));
    });
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return false;
    }
    throw err;
  } finally {
    database.close();
  }
};

const downloadAudioBlobLocally = async (audioBlob: Blob, sessionName: string): Promise<void> => {
  const fileName = `ABBA_AutoSave_${sessionName}.webm`;
  const url = URL.createObjectURL(audioBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const clearCompletedAudioBlobs = async (namespace: string): Promise<number> => {
  const database = await openMeetingDatabase();
  let cleared = 0;
  try {
    const records = await new Promise<StoredSessionRecord[]>((resolve, reject) => {
      const request = database.transaction(SESSIONS_STORE, 'readonly')
        .objectStore(SESSIONS_STORE)
        .index('namespace')
        .getAll(namespace);
      request.onsuccess = () => resolve(request.result as StoredSessionRecord[]);
      request.onerror = () => reject(request.error || new Error('Gagal membaca data sesi.'));
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(SESSIONS_STORE, 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      for (const record of records) {
        if (record.meeting.status === 'completed' && record.audioBlob) {
          const updatedRecord: StoredSessionRecord = {
            key: record.key,
            namespace: record.namespace,
            meeting: record.meeting,
          };
          store.put(updatedRecord);
          cleared += 1;
        }
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Gagal membersihkan audio lama.'));
      transaction.onabort = () => reject(transaction.error || new Error('Pembersihan audio lama dibatalkan.'));
    });
    return cleared;
  } finally {
    database.close();
  }
};

const getMeetingAudio = async (namespace: string, meetingId: string): Promise<Blob | null> => {
  const database = await openMeetingDatabase();
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const request = database.transaction(SESSIONS_STORE, 'readonly')
        .objectStore(SESSIONS_STORE)
        .get(`${namespace}:${meetingId}`);
      request.onsuccess = () => {
        const record = request.result as StoredSessionRecord | undefined;
        resolve(record?.audioBlob instanceof Blob ? record.audioBlob : null);
      };
      request.onerror = () => reject(request.error || new Error('Audio tidak dapat dibaca.'));
    });
  } finally {
    database.close();
  }
};

const migrateSessionNamespace = async (fromNamespace: string, toNamespace: string) => {
  const database = await openMeetingDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(SESSIONS_STORE, 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const index = store.index('namespace');
      const sourceRequest = index.getAll(fromNamespace);
      const destinationRequest = index.getAll(toNamespace);
      let sourceRecords: StoredSessionRecord[] | null = null;
      let destinationRecords: StoredSessionRecord[] | null = null;
      const migrate = () => {
        if (!sourceRecords || !destinationRecords) return;
        const destinationById = new Map(destinationRecords.map((record) => [record.meeting.id, record]));
        for (const source of sourceRecords) {
          const destination = destinationById.get(source.meeting.id);
          store.put({
            key: `${toNamespace}:${source.meeting.id}`,
            namespace: toNamespace,
            meeting: destination?.meeting || source.meeting,
            ...(destination?.audioBlob || source.audioBlob
              ? { audioBlob: destination?.audioBlob || source.audioBlob }
              : {})
          } satisfies StoredSessionRecord);
          store.delete(source.key);
        }
      };
      sourceRequest.onsuccess = () => {
        sourceRecords = sourceRequest.result as StoredSessionRecord[];
        migrate();
      };
      destinationRequest.onsuccess = () => {
        destinationRecords = destinationRequest.result as StoredSessionRecord[];
        migrate();
      };
      sourceRequest.onerror = () => reject(sourceRequest.error || new Error('Namespace sesi lama tidak dapat dibaca.'));
      destinationRequest.onerror = () => reject(destinationRequest.error || new Error('Namespace sesi baru tidak dapat dibaca.'));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Namespace sesi gagal dipindahkan.'));
      transaction.onabort = () => reject(transaction.error || new Error('Pemindahan namespace sesi dibatalkan.'));
    });
  } finally {
    database.close();
  }
};

const blobToDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => typeof reader.result === 'string'
    ? resolve(reader.result)
    : reject(new Error('Audio tidak dapat disiapkan untuk backup.'));
  reader.onerror = () => reject(reader.error || new Error('Audio tidak dapat dibaca.'));
  reader.readAsDataURL(blob);
});

const dataUrlToBlob = (dataUrl: string): Blob => {
  const match = dataUrl.match(/^data:([^;,]+)?;base64,([\s\S]*)$/);
  if (!match) throw new Error('Format data audio di backup tidak valid.');
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: match[1] || 'application/octet-stream' });
};

const isBackupMeeting = (value: unknown): value is Meeting & { audio_data?: string } => {
  if (!value || typeof value !== 'object') return false;
  const meeting = value as Partial<Meeting> & { audio_data?: unknown };
  return typeof meeting.id === 'string'
    && typeof meeting.title === 'string'
    && (typeof meeting.description === 'string' || meeting.description === null)
    && typeof meeting.meeting_date === 'string'
    && typeof meeting.status === 'string'
    && (meeting.transcript === undefined || typeof meeting.transcript === 'string')
    && (meeting.executive_summary === undefined || typeof meeting.executive_summary === 'string')
    && (meeting.key_points === undefined || (Array.isArray(meeting.key_points) && meeting.key_points.every((point) => typeof point === 'string')))
    && (meeting.action_items === undefined || (Array.isArray(meeting.action_items) && meeting.action_items.every((item) =>
      item && typeof item.task === 'string' && typeof item.done === 'boolean'
    )))
    && (meeting.audio_file_name === undefined || typeof meeting.audio_file_name === 'string')
    && (meeting.audio_mime_type === undefined || typeof meeting.audio_mime_type === 'string')
    && (meeting.audio_data === undefined || typeof meeting.audio_data === 'string');
};

const isTokenRecord = (value: unknown): value is TokenRecord => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<TokenRecord>;
  return typeof record.id === 'string'
    && typeof record.hash === 'string'
    && /^[a-f0-9]{64}$/.test(record.hash)
    && typeof record.label === 'string'
    && (record.role === 'MASTER' || record.role === 'OPERATOR')
    && (record.expiresAt === null || typeof record.expiresAt === 'number')
    && typeof record.active === 'boolean';
};

const isAuthSession = (value: unknown): value is AuthSession => {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<AuthSession>;
  return typeof session.id === 'string'
    && typeof session.hash === 'string'
    && /^[a-f0-9]{64}$/.test(session.hash)
    && (session.role === 'MASTER' || session.role === 'OPERATOR')
    && (session.expiresAt === null || typeof session.expiresAt === 'number');
};

export default function App() {
  const [registry, setRegistry] = useState<TokenRecord[]>([]);
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [loginToken, setLoginToken] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [clockNow, setClockNow] = useState(0);
  const lockSeconds = clockNow > 0
    ? Math.max(0, Math.ceil((lockedUntil - clockNow) / 1000))
    : lockedUntil > 0 ? 60 : 0;

  useEffect(() => {
    let active = true;
    const initializeAuth = async () => {
      try {
        const savedRegistry = localStorage.getItem(TOKEN_REGISTRY_STORAGE);
        let tokenRegistry: TokenRecord[];
        if (savedRegistry === null) {
          tokenRegistry = [{
            id: crypto.randomUUID(),
            hash: DEFAULT_MASTER_TOKEN_HASH,
            label: 'Master',
            role: 'MASTER',
            expiresAt: null,
            active: true
          }];
          localStorage.setItem(TOKEN_REGISTRY_STORAGE, JSON.stringify(tokenRegistry));
        } else {
          const parsed: unknown = JSON.parse(savedRegistry);
          if (!Array.isArray(parsed) || !parsed.every(isTokenRecord)) {
            throw new Error('Daftar token tersimpan tidak valid.');
          }
          tokenRegistry = parsed;
          if (tokenRegistry.length === 0) {
            tokenRegistry = [{
              id: crypto.randomUUID(),
              hash: DEFAULT_MASTER_TOKEN_HASH,
              label: 'Master',
              role: 'MASTER',
              expiresAt: null,
              active: true
            }];
            localStorage.setItem(TOKEN_REGISTRY_STORAGE, JSON.stringify(tokenRegistry));
          }
        }
        const guardValue = localStorage.getItem(LOGIN_GUARD_STORAGE);
        if (guardValue) {
          const guard: unknown = JSON.parse(guardValue);
          if (guard && typeof guard === 'object') {
            const value = guard as { attempts?: unknown; lockedUntil?: unknown };
            if (typeof value.attempts === 'number' && Number.isFinite(value.attempts)) {
              setLoginAttempts(Math.max(0, value.attempts));
            }
            if (typeof value.lockedUntil === 'number' && Number.isFinite(value.lockedUntil)) {
              setLockedUntil(value.lockedUntil);
              setClockNow(Date.now());
            }
          }
        }
        if (!active) return;
        setRegistry(tokenRegistry);
        localStorage.removeItem('abba_trusted_invitation_key');
        const inviteUrl = new URL(window.location.href);
        if (inviteUrl.searchParams.has('token')) {
          inviteUrl.searchParams.delete('token');
          window.history.replaceState(null, '', `${inviteUrl.pathname}${inviteUrl.search}${inviteUrl.hash}`);
          setLoginMessage('Tautan undangan tidak lagi didukung. Masukkan kode token secara manual.');
        }
        const savedSession = localStorage.getItem(AUTH_SESSION_STORAGE);
        if (savedSession) {
          const parsedSession: unknown = JSON.parse(savedSession);
          const sessionRecord = isAuthSession(parsedSession)
            ? tokenRegistry.find((record) => record.id === parsedSession.id
              && record.hash === parsedSession.hash
              && record.role === parsedSession.role
              && record.active)
            : undefined;
          if (sessionRecord && (!sessionRecord.expiresAt || sessionRecord.expiresAt > Date.now())) {
            const validSession: AuthSession = {
              id: sessionRecord.id,
              hash: sessionRecord.hash,
              role: sessionRecord.role,
              expiresAt: sessionRecord.expiresAt
            };
            setAuth(validSession);
            localStorage.setItem(AUTH_SESSION_STORAGE, JSON.stringify(validSession));
          } else {
            localStorage.removeItem(AUTH_SESSION_STORAGE);
            if (sessionRecord?.expiresAt && sessionRecord.expiresAt <= Date.now()) {
              setLoginMessage('Token akses telah kedaluwarsa');
            }
          }
        }
      } catch (error) {
        console.error('Gagal menginisialisasi gerbang akses:', error);
        if (active) setAuthError(error instanceof Error ? error.message : 'Gerbang akses gagal dimuat.');
      } finally {
        if (active) setAuthReady(true);
      }
    };
    void initializeAuth();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!auth?.expiresAt) return undefined;
    const expireSession = () => {
      localStorage.removeItem(AUTH_SESSION_STORAGE);
      setAuth(null);
      setLoginMessage('Token akses telah kedaluwarsa');
    };
    const timeout = window.setTimeout(expireSession, Math.max(0, auth.expiresAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [auth]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (lockedUntil > Date.now()) return;
    try {
      const rawToken = loginToken.trim();
      const tokenHash = await hashTokenSHA256(rawToken);
      const record = registry.find((item) => item.hash === tokenHash);
      if (record?.active && (!record.expiresAt || record.expiresAt > Date.now())) {
        const session: AuthSession = {
          id: record.id,
          hash: record.hash,
          role: record.role,
          expiresAt: record.expiresAt
        };
        localStorage.removeItem(LOGIN_GUARD_STORAGE);
        localStorage.setItem(AUTH_SESSION_STORAGE, JSON.stringify(session));
        setLoginAttempts(0);
        setLockedUntil(0);
        setLoginMessage('');
        setLoginToken('');
        setAuth(session);
        return;
      }
      const nextAttempts = loginAttempts + 1;
      const currentTime = Date.now();
      const nextLockedUntil = nextAttempts >= 5 ? currentTime + 60_000 : 0;
      setLoginAttempts(nextLockedUntil ? 0 : nextAttempts);
      setLockedUntil(nextLockedUntil);
      if (nextLockedUntil) setClockNow(currentTime);
      localStorage.setItem(LOGIN_GUARD_STORAGE, JSON.stringify({
        attempts: nextLockedUntil ? 0 : nextAttempts,
        lockedUntil: nextLockedUntil
      }));
      setLoginMessage(record?.expiresAt && record.expiresAt <= Date.now()
        ? 'Token akses telah kedaluwarsa'
        : 'Token akses tidak valid.');
    } catch (error) {
      console.error('Gagal memverifikasi token akses:', error);
      setLoginMessage('Token tidak dapat diverifikasi. Periksa dukungan Web Crypto browser.');
    }
  };

  const logout = (message = '') => {
    localStorage.removeItem(AUTH_SESSION_STORAGE);
    setAuth(null);
    setLoginToken('');
    setLoginMessage(message);
  };

  const saveRegistry = (nextRegistry: TokenRecord[]) => {
    localStorage.setItem(TOKEN_REGISTRY_STORAGE, JSON.stringify(nextRegistry));
    setRegistry(nextRegistry);
  };

  const rotateMasterToken = async (newHash: string) => {
    if (!auth || auth.role !== 'MASTER') return;
    const oldNamespace = getSessionNamespace(auth);
    const updatedRegistry = registry.map((record) => record.id === auth.id
      ? { ...record, hash: newHash }
      : record);
    const updatedRecord = updatedRegistry.find((record) => record.id === auth.id);
    if (!updatedRecord) throw new Error('Token Master aktif tidak ditemukan.');
    const newAuth: AuthSession = { ...auth, hash: newHash };
    const oldMeetingsKey = getLegacyMeetingsStorageKey(auth);
    const newMeetingsKey = getLegacyMeetingsStorageKey(newAuth);
    const oldApiKey = `abba_api_key_${oldNamespace}`;
    const newApiKey = getApiKeyStorageKey(newAuth);
    const previousApiKey = localStorage.getItem(oldApiKey);
    if (previousApiKey !== null && localStorage.getItem(newApiKey) === null) {
      localStorage.setItem(newApiKey, previousApiKey);
    }
    await migrateLegacySessions(getSessionNamespace(newAuth), newMeetingsKey, false);
    await migrateSessionNamespace(oldNamespace, getSessionNamespace(newAuth));
    localStorage.removeItem(oldMeetingsKey);
    localStorage.removeItem(oldApiKey);
    saveRegistry(updatedRegistry);
    localStorage.setItem(AUTH_SESSION_STORAGE, JSON.stringify(newAuth));
    setAuth(newAuth);
  };

  if (!authReady) {
    return <main className="auth-screen"><p>Memuat gerbang akses...</p></main>;
  }
  if (authError) {
    return <main className="auth-screen"><section className="auth-card"><h1>Gerbang akses gagal dimuat</h1><p role="alert">{authError}</p></section></main>;
  }
  if (!auth) {
    const locked = lockSeconds > 0;
    return (
      <main className="auth-screen">
        <form className="auth-card" onSubmit={(event) => void handleLogin(event)}>
          <img src="/logo-abba.png" alt="" />
          <h1>ABBA Smart Meeting</h1>
          <p>Masukkan kode token untuk melanjutkan.</p>
          <input
            id="access-token"
            type="password"
            autoComplete="current-password"
            value={loginToken}
            onChange={(event) => setLoginToken(event.target.value)}
            placeholder="Masukkan Kode Token..."
            aria-label="Masukkan Kode Token"
            disabled={locked}
            autoFocus
          />
          {loginMessage && <p className="auth-message" role="alert">{loginMessage}</p>}
          {locked && <p className="auth-message" role="status">Terlalu banyak percobaan. Coba lagi dalam {lockSeconds} detik.</p>}
          <button
    type="button"
    className="no-print"
    onClick={() => {
      if (!selectedMeeting) return;
      const title = selectedMeeting.title || 'NOTULA RAPAT';
      const dateStr = selectedMeeting.date || '';
      const sum = selectedMeeting.executiveSummary || '-';
      const pts = (selectedMeeting.keyPoints || []).map((p) => `• ${p}`).join('\n');
      const acts = (selectedMeeting.actionItems || []).map((a) => `${a.done ? '☑' : '☐'} ${a.task}`).join('\n');
      const waText = `*${title.toUpperCase()}*\n_${dateStr}_\n\n*RINGKASAN EKSEKUTIF*\n${sum}\n\n*POIN PEMBAHASAN*\n${pts || '-'}\n\n*TINDAK LANJUT*\n${acts || '-'}`;
      navigator.clipboard.writeText(waText);
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2000);
    }}
    style={{
      padding: '5px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 700,
      background: 'rgba(16, 185, 129, 0.16)',
      border: '1px solid rgba(16, 185, 129, 0.4)',
      color: '#6ee7b7',
      cursor: 'pointer'
    }}
  >
    {copiedWa ? '✓ Tersalin WA' : '📲 Salin WA'}
  </button>
  <button onClick={printMeetingNotes} className="action-pill pill-secondary" style={{ padding: '6px 12px', fontSize: '0.775rem' }}>
                          <Printer size={12} /> {t('printPdf')}
                        </button>
                        <button onClick={() => setShowShareModal(true)} className="action-pill pill-secondary" style={{ padding: '6px 12px', fontSize: '0.775rem' }}>
                          <Share2 size={12} /> {t('share')}
                        </button>
                      </div>
                    )}
                  </div>

                  {executiveSummary ? (
                    <div className="notula-content">
                      <div className="notula-section">
                        <div className="section-tag">
                          <Tag size={12} /> {t('executiveSummary').toUpperCase()}
                        </div>
                        <div className="summary-bubble">
                          {executiveSummary}
                        </div>
                      </div>

                      {keyPoints.length > 0 && (
                        <div className="notula-section">
                          <div className="section-tag">
                            <Tag size={12} /> {t('keyPoints').toUpperCase()}
                          </div>
                          <div className="points-list">
                            {keyPoints.map((pt, i) => (
                              <div key={i} className="point-item">
                                <div className="point-bullet"></div>
                                <span>{pt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {actionItems.length > 0 && (
                        <div className="notula-section">
                          <div className="section-tag">
                            <Tag size={12} /> {t('actionItems').toUpperCase()}
                          </div>
                          <div className="task-capsule-list">
                            {actionItems.map((item, idx) => (
                              <button
                                type="button"
                                key={idx}
                                onClick={() => toggleTaskDone(idx)}
                                aria-pressed={item.done}
                                className={`task-capsule ${item.done ? 'task-done' : ''}`}
                              >
                                {item.done ? (
                                  <CheckCircle2 size={18} color="#10b981" />
                                ) : (
                                  <Circle size={18} color="#64748b" />
                                )}
                                <span>{item.task}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="empty-notula">
                      <div className="empty-icon-circle">
                        <Sparkles size={28} color="#38bdf8" />
                      </div>
                      <h5>{t('noNotes')}</h5>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Dashboard Home */
          <div className="dashboard-view">
            <div className="dash-hero">
              <div>
                <h1 className="dash-title">{t('meetingList')}</h1>
                <p className="dash-subtitle">{t('meetingArchive')}</p>
              </div>

              <div className="dash-controls">
                <div className="search-capsule">
                  <Search size={15} color="#64748b" />
                  <input
                    type="text"
                    placeholder={t('searchMeeting')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button type="button" onClick={openCreateMeetingModal} className="btn-add-session">
                  <span>{t('newMeeting')}</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">{t('loadingMeetings')}</div>
            ) : filteredMeetings.length === 0 ? (
              <div className="glass-card empty-dashboard">
                <Calendar size={44} color="#475569" />
                <p>{t('noMeetings')}</p>
              </div>
            ) : (
              <div className="capsule-grid">
                {filteredMeetings.map((m) => (
                  <article key={m.id} className="meeting-grid-card" onClick={() => openMeetingDetail(m)}>
                    <div className="meeting-card-top">
                      <span className={`pill-badge-sm ${m.status === 'completed' ? 'badge-done' : 'badge-pending'}`}>
                        {m.status === 'completed' ? t('completed') : t('draft')}
                      </span>
                      <h3 title={m.title}>{m.title}</h3>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteMeeting(m.id);
                        }}
                        title={t('deleteMeeting')}
                        aria-label={`${t('deleteMeeting')}: ${m.title}`}
                        className="card-delete-btn"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="meeting-card-bottom">
                      <span className="card-date">
                        <Clock size={12} />
                        {new Date(m.meeting_date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <button
                        type="button"
                        className="meeting-open-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openMeetingDetail(m);
                        }}
                      >
                        {t('openMeeting')} <span aria-hidden="true">↗</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
        </div>

      {selectedMeeting && (
        <article className="print-document" aria-hidden="true">
          <header className="print-letterhead">
            <div className="print-letterhead-brand">
              <span className="print-logo-frame">
                <img src="/logo-abba.png" alt="" />
              </span>
              <div className="print-logo">ABBA SMART MEETING</div>
            </div>
            <p>NOTULA RAPAT</p>
            <h1>{selectedMeeting.title}</h1>
            <div className="print-meeting-meta">
              <span><strong>{t('date')}:</strong> {new Date(selectedMeeting.meeting_date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {selectedMeeting.description && <span><strong>{t('agenda')}:</strong> {selectedMeeting.description}</span>}
            </div>
          </header>
          <section className="print-section">
            <h2>1. Ringkasan Eksekutif</h2>
            <p>{executiveSummary || 'Ringkasan eksekutif belum tersedia.'}</p>
          </section>
          <section className="print-section">
            <h2>2. Poin Pembahasan</h2>
            {keyPoints.length > 0
              ? <ul>{keyPoints.map((point, index) => <li key={index}>{point}</li>)}</ul>
              : <p>Belum ada poin pembahasan.</p>}
          </section>
          <section className="print-section">
            <h2>3. Checklist Tugas dan Tindak Lanjut</h2>
            <table className="print-task-table">
              <thead>
                <tr><th>No.</th><th>Tugas / Tindak Lanjut</th><th>Status</th></tr>
              </thead>
              <tbody>
                {actionItems.length > 0
                  ? actionItems.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.task}</td>
                      <td>{item.done ? '[X] Selesai' : '[ ] Belum selesai'}</td>
                    </tr>
                  ))
                  : <tr><td colSpan={3}>Belum ada tugas tindak lanjut.</td></tr>}
              </tbody>
            </table>
          </section>
          <footer className="print-footer">{t('createdWith')}</footer>
        </article>
      )}

      {showSettingsModal && (
        <div className="modal-backdrop-blur" onClick={() => setShowSettingsModal(false)}>
          <div className="glass-modal settings-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header settings-modal-header">
              <div className="settings-title">
                <SettingsIcon size={18} />
                <h4>{t('settings')}</h4>
              </div>
              <button type="button" className="settings-close-button" aria-label={t('close')} onClick={() => setShowSettingsModal(false)}>
                <X size={17} />
              </button>
            </div>

            <div className={`settings-grid ${auth.role === 'MASTER' ? 'has-token-manager' : ''}`}>
              <div className="settings-main-column">
                <section className="settings-section">
                  <label className="api-key-label" htmlFor="app-language">{t('language')}</label>
                  <select
                    id="app-language"
                    className="modal-input settings-select"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value as AppLanguage)}
                  >
                    <option value="id">{t('indonesian')}</option>
                    <option value="en">{t('english')}</option>
                  </select>
                </section>

                <section className="settings-section">
                  <div className="settings-section-heading">
                    <label className="api-key-label" htmlFor="gemini-api-key">{t('geminiKey')}</label>
                    <span className={`settings-key-status ${geminiApiKey ? 'is-active' : ''}`}>
                      <i /> {geminiApiKey ? t('keyActive') : t('keyInactive')}
                    </span>
                  </div>
                  <input
                    id="gemini-api-key"
                    className="modal-input"
                    type="password"
                    autoComplete="new-password"
                    placeholder={geminiApiKey ? t('keyPlaceholderSet') : t('keyPlaceholderEmpty')}
                    value={apiKeyDraft}
                    onChange={(event) => setApiKeyDraft(event.target.value)}
                  />
                  <div className="settings-inline-actions">
                    {geminiApiKey && (
                      <button type="button" className="btn-key-remove" onClick={removeGeminiApiKey}>{t('removeKey')}</button>
                    )}
                    <button type="button" className="btn-modal-save" onClick={saveGeminiApiKey}>{t('saveKey')}</button>
                  </div>
                </section>

                <section className="settings-section">
                  <div className="settings-data-actions">
                    <button type="button" className="settings-data-button" onClick={() => void backupMeetings()}>
                      <Archive size={15} /> {t('backup')}
                    </button>
                    <button type="button" className="settings-data-button" onClick={() => backupRestoreRef.current?.click()}>
                      <ArchiveRestore size={15} /> {t('restore')}
                    </button>
                  </div>
                </section>
              </div>

              {auth.role === 'MASTER' && (
                <section className="settings-section token-manager settings-admin-column">
                  <h5>Kelola Token Akses</h5>
                  <label className="api-key-label" htmlFor="new-token-code">Nama / Kode Token</label>
                  <div className="token-code-input">
                    <input
                      id="new-token-code"
                      className="modal-input"
                      value={newTokenCode}
                      onChange={(event) => setNewTokenCode(event.target.value)}
                      placeholder="Contoh: TIM-B3"
                      autoComplete="off"
                      maxLength={32}
                    />
                    <button type="button" className="token-random-button" onClick={() => setNewTokenCode(generateRandomAccessToken())}>
                      Acak
                    </button>
                  </div>
                  <select
                    className="modal-input settings-select token-duration-select"
                    value={newTokenDuration}
                    onChange={(event) => setNewTokenDuration(event.target.value as 'never' | '7' | '30')}
                    aria-label="Masa berlaku token baru"
                  >
                    <option value="never">Tanpa Batas</option>
                    <option value="7">7 Hari</option>
                    <option value="30">30 Hari</option>
                  </select>
                  <button type="button" className="settings-data-button token-generate-button" onClick={() => void createAccessToken()}>
                    + Simpan Token
                  </button>
                  {generatedToken && (
                    <div className="token-once-banner" role="status">
                      <strong>Simpan kode sekarang — hanya hash yang disimpan</strong>
                      <code>{generatedToken}</code>
                      <button type="button" onClick={() => void copyGeneratedToken(generatedToken)}>Salin</button>
                    </div>
                  )}

                  <div className="token-list">
                    {registry.map((record) => {
                      const protectedSession = record.id === auth.id
                        || (record.role === 'MASTER' && record.active && activeMasterCount <= 1);
                      return (
                        <div className="token-list-item" key={record.id}>
                          <div>
                            <strong>{record.label}</strong>
                            <span>{record.role} · {record.expiresAt ? new Date(record.expiresAt).toLocaleDateString() : 'Tanpa batas'} · {record.active ? 'Aktif' : 'Nonaktif'}</span>
                          </div>
                          {protectedSession
                            ? <span className="token-session-badge">SESI AKTIF</span>
                            : (
                              <div className="token-row-actions">
                                <button type="button" onClick={() => toggleAccessToken(record.id)}>
                                  {record.active ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>
                                <button type="button" onClick={() => removeAccessToken(record.id)}>Hapus</button>
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="master-token-rotation">
                    <h5>Ubah Token Master</h5>
                    <label className="api-key-label" htmlFor="master-token-replacement">Kode token Master baru</label>
                    <input
                      id="master-token-replacement"
                      className="modal-input"
                      type="password"
                      autoComplete="new-password"
                      value={masterTokenDraft}
                      onChange={(event) => setMasterTokenDraft(event.target.value)}
                      placeholder="Masukkan kode pribadi baru"
                    />
                    <button type="button" className="settings-data-button token-generate-button" onClick={() => void rotateCurrentMasterToken()}>
                      Ubah Token Master
                    </button>
                    {rotatedMasterToken && (
                      <div className="token-once-banner" role="status">
                        <strong>Salin token Master sekarang — kode tidak disimpan dalam bentuk teks biasa</strong>
                        <code>{rotatedMasterToken}</code>
                        <button type="button" onClick={() => void copyGeneratedToken(rotatedMasterToken)}>Salin</button>
                      </div>
                    )}
                  </div>
                  {tokenManagerError && <p className="token-manager-error" role="alert">{tokenManagerError}</p>}
                </section>
              )}
            </div>
            <div className="settings-storage-footer">
              <span>
                Storage: {storageUsageBytes === null
                  ? storageEstimateUnavailable ? 'tidak tersedia' : 'menghitung...'
                  : `${(storageUsageBytes / (1024 * 1024)).toFixed(1)} MB digunakan`}
              </span>
              <button
                type="button"
                className="settings-clear-audio-button"
                onClick={handleClearCompletedAudio}
                title={t('clearOldAudio')}
              >
                <Trash2 size={14} /> {t('clearOldAudio')}
              </button>
              {backupReminder
                ? <span className="backup-reminder-badge">Backup terakhir lebih dari 7 hari yang lalu</span>
                : lastBackupAt !== null && <span>Backup terakhir: {new Date(lastBackupAt).toLocaleDateString()}</span>}
            </div>

            <section className="settings-section storage-output-panel">
              <div className="settings-section-heading">
                <label className="api-key-label">{t('storagePanel')}</label>
                <span className="settings-key-status">
                  <i />
                  {outputFolderHandle ? 'Folder Aktif' : 'Downloads Default'}
                </span>
              </div>

              <div className="storage-progress-wrap">
                <div className="storage-progress-label">
                  <span>{t('storageUsed')}</span>
                  <span className="storage-progress-value">
                    {storageUsageBytes === null
                      ? storageEstimateUnavailable ? 'tidak tersedia' : 'menghitung...'
                      : `${(storageUsageBytes / (1024 * 1024)).toFixed(2)} MB`}
                  </span>
                </div>
                {storageUsageBytes !== null && navigator.storage && typeof navigator.storage.estimate === 'function' ? (
                  <div className="storage-progress-bar">
                    <div
                      className="storage-progress-fill"
                      style={{
                        width: Math.min(100, (storageUsageBytes / ((navigator.storage as any).quota || 1) * 100)),
                      }}
                    />
                  </div>
                ) : null}
              </div>

              <div className="storage-folder-actions">
                {typeof (window as unknown as WindowWithFileSystemAccess).showDirectoryPicker !== 'undefined' ? (
                  <button
                    type="button"
                    className={`settings-data-button ${outputFolderHandle ? 'is-active' : ''}`}
                    onClick={handlePickOutputFolder}
                  >
                    <Download size={13} /> {outputFolderHandle ? 'Ubah Folder Output' : t('btnPickFolder')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="settings-data-button is-disabled"
                    disabled
                    title={t('btnPickFolderNotSupported')}
                  >
                    <Download size={13} /> {t('btnPickFolderNotSupported')}
                  </button>
                )}
                {outputFolderHandle && (
                  <span className="storage-folder-name">{t('folderSelected')} {outputFolderName}</span>
                )}
              </div>

              <div className="storage-audio-list-wrap">
                <label className="api-key-label">{t('colTitle')}</label>
                {getSessionsWithAudio().length === 0 ? (
                  <p className="storage-empty">{t('storageNoAudio')}</p>
                ) : (
                  <div className="storage-audio-list">
                    {getSessionsWithAudio().map((meeting) => {
                      const blobSize = audioBlobSizes[meeting.id] ?? 0;
                      return (
                        <div key={meeting.id} className="storage-audio-row">
                          <div className="storage-audio-info">
                            <strong>{meeting.title}</strong>
                            <span>{(blobSize / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                          <div className="storage-audio-actions">
                            <button
                              type="button"
                              className="settings-data-button storage-btn-download"
                              onClick={() => void handleDownloadAudio(meeting)}
                              title={t('btnDownloadAudio')}
                            >
                              <Download size={13} /> {t('btnDownloadAudio')}
                            </button>
                            <button
                              type="button"
                              className="settings-data-button storage-btn-delete"
                              onClick={() => void handleDeleteAudioSession(meeting)}
                              title={t('btnDeleteAudio')}
                            >
                              <Trash2 size={13} /> {t('btnDeleteAudio')}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="storage-output-history-wrap">
                <label className="api-key-label">{t('outputHistoryTitle')}</label>
                {outputHistory.length === 0 ? (
                  <p className="storage-empty">{t('outputHistoryEmpty')}</p>
                ) : (
                  <div className="storage-history-list">
                    {outputHistory.map((entry) => (
                      <div key={entry.id} className="storage-history-row">
                        <span className="storage-history-name">{entry.fileName}</span>
                        <span className="storage-history-time">{entry.time}</span>
                        <span className="storage-history-size">{entry.size}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* MODAL BAGIKAN KUSTOM */}
      {showShareModal && (
        <div className="modal-backdrop-blur" onClick={() => setShowShareModal(false)}>
          <div className="glass-modal share-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Share2 size={18} color="#38bdf8" />
                <h4>{t('share')} {t('notes')}</h4>
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ margin: '0.85rem 0' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>{t('presets').toUpperCase()}:</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setSharePreset('all')} className="preset-pill">{t('all')}</button>
                <button type="button" onClick={() => setSharePreset('summary')} className="preset-pill">{t('summaryOnly')}</button>
                <button type="button" onClick={() => setSharePreset('points')} className="preset-pill">{t('pointsOnly')}</button>
                <button type="button" onClick={() => setSharePreset('actions')} className="preset-pill">{t('actionsOnly')}</button>
              </div>
            </div>

            <div className="share-toggles-grid">
              <label className="toggle-chip">
                <input
                  type="checkbox"
                  checked={shareConfig.summary}
                  onChange={(e) => setShareConfig({ ...shareConfig, summary: e.target.checked })}
                />
                <span>{t('executiveSummary')}</span>
              </label>

              <label className="toggle-chip">
                <input
                  type="checkbox"
                  checked={shareConfig.points}
                  onChange={(e) => setShareConfig({ ...shareConfig, points: e.target.checked })}
                />
                <span>{t('keyPoints')}</span>
              </label>

              <label className="toggle-chip">
                <input
                  type="checkbox"
                  checked={shareConfig.actions}
                  onChange={(e) => setShareConfig({ ...shareConfig, actions: e.target.checked })}
                />
                <span>{t('actionItems')}</span>
              </label>

              <label className="toggle-chip">
                <input
                  type="checkbox"
                  checked={shareConfig.transcript}
                  onChange={(e) => setShareConfig({ ...shareConfig, transcript: e.target.checked })}
                />
                <span>{t('transcriptFull')}</span>
              </label>
            </div>

            <div style={{ marginTop: '0.85rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>{t('preview').toUpperCase()}:</span>
              <textarea
                readOnly
                rows={6}
                value={buildCustomShareText()}
                className="modern-textarea"
                style={{ fontSize: '0.8rem', background: '#080d1a', fontFamily: 'monospace' }}
              />
            </div>

            <div className="share-btn-row">
              <button onClick={printMeetingNotes} className="action-pill pill-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                <Printer size={14} /> <span>{t('printPdf')}</span>
              </button>
              <button onClick={copyCustomNotes} className="action-pill pill-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                <span>{copied ? t('copied') : t('copyText')}</span>
              </button>
              <button onClick={sendCustomToWhatsApp} className="action-pill pill-wa" style={{ flex: 1.2, justifyContent: 'center' }}>
                <Send size={14} /> <span>{t('sendWhatsApp')}</span>
              </button>
              <button onClick={downloadCustomTextFile} className="action-pill pill-primary" style={{ flex: 1, justifyContent: 'center' }}>
                <Download size={14} /> <span>{t('downloadText')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifikasi */}
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-notification toast-${toast.type}`}
          role="alert"
          aria-live="polite"
        >
          {toast.message}
        </div>
      ))}

      {/* Modal Sesi Baru */}
      {showCreateModal && (
        <div className="modal-backdrop-blur" onClick={() => setShowCreateModal(false)}>
          <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <Plus size={18} color="#38bdf8" />
              <h4>{t('createMeeting')}</h4>
            </div>
            <form onSubmit={handleCreateMeeting}>
              <div className="form-group-modern">
                <label>{t('meetingTitle')}</label>
                <input
                  type="text"
                  required
                  placeholder={language === 'id' ? 'Misal: Evaluasi Mingguan' : 'e.g. Weekly Review'}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="form-group-modern">
                <label>{t('agenda')}</label>
                <textarea
                  rows={3}
                  placeholder={language === 'id' ? 'Tujuan rapat...' : 'Meeting goals...'}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="modal-btn-row">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-modal-cancel">{t('cancel')}</button>
                <button type="submit" disabled={createLoading} className="btn-modal-save">
                  {createLoading ? t('processing') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
