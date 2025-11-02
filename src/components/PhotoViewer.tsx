import { useState, useEffect, useRef, useCallback } from 'react'
import type { MouseEvent as ReactMouseEvent, FormEvent, ChangeEvent } from 'react'
import { iCloudAPI, Photo, AnalyzeResponse, HistoryEntry } from '../services/api'
import './PhotoViewer.css'

type BackgroundResult = {
  photo: Photo
  analysis: AnalyzeResponse
  artPrompt: string
  promptTemplate?: string | null
  generationPrompt?: string | null
  generatedImage: string
  id: string
}

const buildLegacyGenerationPrompt = (stylePrompt: string): string => {
  return `Transform this image ${stylePrompt}.

Preserve the recognizable likeness of every person or subject, matching faces, expressions, and defining details as closely as possible.

Make the transformation bold and distinctive.`
}

const PHOTOREAL_STYLE_KEYWORDS = [
  'photoreal',
  'photograph',
  'photo-real',
  'cinematic',
  'film still',
  'realistic',
  'dslr',
  'hdr',
  'ultra-detailed'
]

const GRAPHIC_STYLE_KEYWORDS = [
  'poster',
  'graphic',
  'vector',
  'flat',
  'sticker',
  'icon',
  'logo',
  'deco',
  'constructivist',
  'screenprint',
  'minimalist',
  'infographic',
  'schematic'
]

const STYLIZED_STYLE_KEYWORDS = [
  'painting',
  'oil',
  'watercolor',
  'gouache',
  'illustration',
  'concept art',
  'anime',
  'storybook',
  'pastel',
  'chalk',
  'charcoal',
  'sketch',
  'ink',
  'woodblock',
  'mural',
  'graffiti',
  'fresco',
  'tapestry'
]

const SPORTS_KEYWORDS = [
  'soccer',
  'baseball',
  'basketball',
  'football',
  'game',
  'goal',
  'stadium',
  'athletic',
  'competition',
  'cheering',
  'tournament',
  'field'
]

const PORTRAIT_KEYWORDS = [
  'portrait',
  'family',
  'couple',
  'friends',
  'smiling',
  'posing',
  'close-up',
  'wedding',
  'bride',
  'groom',
  'child',
  'baby',
  'group photo'
]

const ANIMAL_KEYWORDS = [
  'dog',
  'cat',
  'puppy',
  'kitten',
  'horse',
  'goat',
  'cow',
  'pet',
  'animal',
  'wildlife'
]

const LANDSCAPE_KEYWORDS = [
  'mountain',
  'valley',
  'forest',
  'trees',
  'river',
  'lake',
  'waterfall',
  'meadow',
  'canyon',
  'desert'
]

const BEACH_KEYWORDS = [
  'beach',
  'ocean',
  'shore',
  'waves',
  'coast',
  'tide',
  'tropical',
  'seaside'
]

const CITY_KEYWORDS = [
  'city',
  'urban',
  'street',
  'downtown',
  'skyscraper',
  'traffic',
  'metropolis'
]

const NIGHT_KEYWORDS = [
  'night',
  'evening',
  'moonlit',
  'starry',
  'fireworks',
  'midnight',
  'twilight'
]

const HOLIDAY_KEYWORDS = [
  'christmas',
  'holiday',
  'festive',
  'halloween',
  'pumpkin',
  'spooky',
  'easter',
  'birthday',
  'celebration'
]

const LIGHTING_MAPPINGS: Array<{ keywords: string[]; cue: string }> = [
  { keywords: ['sunset', 'golden', 'late afternoon', 'sun-drenched'], cue: 'warm golden-hour lighting with gentle highlights' },
  { keywords: ['dawn', 'sunrise', 'morning light'], cue: 'soft morning light with delicate shadows' },
  { keywords: ['night', 'neon', 'city lights', 'midnight', 'fireworks'], cue: 'dramatic low-light contrast with vibrant highlights' },
  { keywords: ['candle', 'cozy', 'fireplace', 'indoor glow'], cue: 'intimate warm indoor lighting and soft falloff' },
  { keywords: ['snow', 'winter', 'frost', 'icy'], cue: 'crisp cool winter lighting with subtle glints' },
  { keywords: ['storm', 'rain', 'overcast', 'mist'], cue: 'moody diffused lighting with atmospheric haze' }
]

const STYLIZED_RENDER_CUES: Array<{ keywords: string[]; cue: string }> = [
  { keywords: ['watercolor', 'ink', 'wash'], cue: 'loose watercolor washes layered with gentle ink linework' },
  { keywords: ['oil', 'impasto', 'baroque'], cue: 'rich oil brushstrokes and layered impasto textures' },
  { keywords: ['gouache', 'poster', 'mid-century'], cue: 'opaque gouache layers with bold poster-style blocking' },
  { keywords: ['woodblock', 'ukiyo', 'print'], cue: 'precise woodblock carving marks with layered ink textures' },
  { keywords: ['stained glass', 'glass', 'mosaic'], cue: 'luminous stained-glass panes with dark leading outlines' },
  { keywords: ['studio ghibli', 'animation', 'anime'], cue: 'hand-painted animation backgrounds with soft atmospheric blooms' },
  { keywords: ['storybook', 'mary blair'], cue: 'playful storybook shapes with simplified, charming forms' },
  { keywords: ['graffiti', 'street art'], cue: 'energetic spray-paint textures and bold street-art linework' }
]

const GRAPHIC_RENDER_CUES: Array<{ keywords: string[]; cue: string }> = [
  { keywords: ['poster', 'propaganda', 'constructivist'], cue: 'bold geometric composition, large typography fields, and high contrast' },
  { keywords: ['sticker', 'kawaii', 'chibi'], cue: 'clean vector outlines, simple cel shading, and sticker-friendly framing' },
  { keywords: ['art deco', 'deco'], cue: 'symmetrical deco framing with metallic accents and tiered shapes' },
  { keywords: ['minimalist', 'flat'], cue: 'minimal flat-color planes with crisp negative space' }
]

const PALETTE_CUES: Array<{ keywords: string[]; cue: string }> = [
  { keywords: ['autumn', 'fall', 'pumpkin', 'harvest'], cue: 'warm autumnal oranges, ambers, and deep maroons' },
  { keywords: ['winter', 'snow', 'icy', 'frost'], cue: 'icy blues, silvery whites, and crystalline highlights' },
  { keywords: ['spring', 'garden', 'floral', 'blossom'], cue: 'fresh spring pastels with soft greens and blooming pinks' },
  { keywords: ['summer', 'beach', 'tropical', 'sunny'], cue: 'sun-drenched aquas, corals, and vibrant citrus tones' },
  { keywords: ['neon', 'synthwave', 'cyberpunk', 'retro-futuristic'], cue: 'electric neon magentas, cyan glow, and midnight purples' },
  { keywords: ['halloween', 'spooky', 'gothic'], cue: 'midnight blacks, haunting violets, and candlelit oranges' },
  { keywords: ['christmas', 'holiday', 'festive'], cue: 'rich evergreen, deep crimson, and warm golden highlights' }
]

type PromptMode = 'photoreal' | 'stylized' | 'graphic'
type SceneFocus = 'sports' | 'portrait' | 'animals' | 'landscape' | 'beach' | 'city' | 'night' | 'general'

const containsKeyword = (textLower: string, keywords: string[]) => {
  return keywords.some((keyword) => textLower.includes(keyword))
}

const ensureSentence = (text: string): string => {
  const trimmed = text.trim()
  if (!trimmed) return ''
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

const extractSubjectCue = (description: string): string => {
  if (!description) return ''
  const sentences = description
    .split(/[.!?]/)
    .map((part) => part.trim())
    .filter(Boolean)

  return sentences[0] || ''
}

const determinePromptMode = (_analysis: string, stylePrompt: string): PromptMode => {
  const styleLower = stylePrompt.toLowerCase()

  if (containsKeyword(styleLower, PHOTOREAL_STYLE_KEYWORDS)) {
    return 'photoreal'
  }

  if (containsKeyword(styleLower, GRAPHIC_STYLE_KEYWORDS)) {
    return 'graphic'
  }

  if (containsKeyword(styleLower, STYLIZED_STYLE_KEYWORDS)) {
    return 'stylized'
  }

  // Default to stylized when in doubt, but lean photoreal if the style prompt is sparse.
  return stylePrompt.trim().length > 0 ? 'stylized' : 'photoreal'
}

const determineSceneFocus = (analysisLower: string): SceneFocus => {
  if (containsKeyword(analysisLower, SPORTS_KEYWORDS)) return 'sports'
  if (containsKeyword(analysisLower, ANIMAL_KEYWORDS)) return 'animals'
  if (containsKeyword(analysisLower, PORTRAIT_KEYWORDS)) return 'portrait'
  if (containsKeyword(analysisLower, BEACH_KEYWORDS)) return 'beach'
  if (containsKeyword(analysisLower, LANDSCAPE_KEYWORDS)) return 'landscape'
  if (containsKeyword(analysisLower, CITY_KEYWORDS)) return 'city'
  if (containsKeyword(analysisLower, NIGHT_KEYWORDS)) return 'night'
  return 'general'
}

const pickLightingCue = (analysisLower: string, styleLower: string): string => {
  for (const mapping of LIGHTING_MAPPINGS) {
    if (containsKeyword(analysisLower, mapping.keywords) || containsKeyword(styleLower, mapping.keywords)) {
      return mapping.cue
    }
  }
  return 'balanced, natural lighting'
}

const pickCameraCue = (sceneFocus: SceneFocus): string => {
  switch (sceneFocus) {
    case 'portrait':
      return 'a shallow depth of field reminiscent of an 85mm portrait lens'
    case 'sports':
      return 'a fast shutter feel that freezes motion with dynamic framing'
    case 'animals':
      return 'a telephoto perspective that keeps the subject crisp against a soft background'
    case 'landscape':
      return 'a wide-angle sense of scale that preserves sweeping depth'
    case 'beach':
      return 'a wide coastal perspective with gentle atmospheric haze'
    case 'city':
      return 'a cinematic street-level perspective with layered depth'
    case 'night':
      return 'carefully controlled highlights and subtle long-exposure glow'
    default:
      return 'natural depth and crisp focus that feels cinematic'
  }
}

const pickStylizedRenderCue = (styleLower: string): string => {
  for (const mapping of STYLIZED_RENDER_CUES) {
    if (containsKeyword(styleLower, mapping.keywords)) {
      return mapping.cue
    }
  }
  return 'expressive brushwork and stylized detailing'
}

const pickGraphicRenderCue = (styleLower: string): string => {
  for (const mapping of GRAPHIC_RENDER_CUES) {
    if (containsKeyword(styleLower, mapping.keywords)) {
      return mapping.cue
    }
  }
  return 'high-contrast graphic shapes with confident, clean linework'
}

const pickPaletteCue = (analysisLower: string, styleLower: string): string => {
  for (const mapping of PALETTE_CUES) {
    if (containsKeyword(analysisLower, mapping.keywords) || containsKeyword(styleLower, mapping.keywords)) {
      return mapping.cue
    }
  }

  if (containsKeyword(analysisLower, HOLIDAY_KEYWORDS) || containsKeyword(styleLower, HOLIDAY_KEYWORDS)) {
    return 'festive tones with luminous accent colors'
  }

  return 'a harmonious palette that reinforces the chosen style'
}

const buildEnhancedGenerationPrompt = (description: string, stylePrompt: string): string => {
  const cleanStylePrompt = stylePrompt.trim()
  if (!cleanStylePrompt) {
    return ''
  }

  const analysisText = description?.trim() ?? ''
  const analysisLower = analysisText.toLowerCase()
  const styleLower = cleanStylePrompt.toLowerCase()

  const mode = determinePromptMode(analysisText, cleanStylePrompt)
  const sceneFocus = determineSceneFocus(analysisLower)
  const subjectCue = extractSubjectCue(analysisText)
  const subjectSentence = subjectCue
    ? ensureSentence(`Focus on the main subjects described: ${subjectCue}`)
    : ''

  if (mode === 'photoreal') {
    const lightingCue = pickLightingCue(analysisLower, styleLower)
    const cameraCue = pickCameraCue(sceneFocus)
    return [
      ensureSentence(`Transform this image ${cleanStylePrompt}`),
      subjectSentence,
      ensureSentence('Preserve the recognizable likeness of every person or subject, matching faces, expressions, and defining details as closely as possible'),
      ensureSentence(`Render the scene with ${lightingCue} and ${cameraCue}`),
      'Deliver a photorealistic result with lifelike textures, depth, and atmosphere.'
    ]
      .filter(Boolean)
      .join('\n\n')
  }

  if (mode === 'graphic') {
    const renderCue = pickGraphicRenderCue(styleLower)
    const paletteCue = pickPaletteCue(analysisLower, styleLower)
    return [
      ensureSentence(`Transform this image ${cleanStylePrompt}`),
      subjectSentence,
      ensureSentence('Preserve the recognizable likeness of every person or subject, matching faces, expressions, and defining details as closely as possible'),
      ensureSentence(`Design the composition with ${renderCue}`),
      ensureSentence(`Apply ${paletteCue} while keeping key subjects instantly recognizable`)
    ]
      .filter(Boolean)
      .join('\n\n')
  }

  const renderCue = pickStylizedRenderCue(styleLower)
  const paletteCue = pickPaletteCue(analysisLower, styleLower)

  return [
    ensureSentence(`Transform this image ${cleanStylePrompt}`),
    subjectSentence,
    ensureSentence('Preserve the recognizable likeness of every person or subject, matching faces, expressions, and defining details as closely as possible'),
    ensureSentence(`Reimagine the scene with ${renderCue}`),
    ensureSentence(`Use ${paletteCue} and preserve the emotional focus of the moment`)
  ]
    .filter(Boolean)
    .join('\n\n')
}

const buildGenerationPrompt = (description: string, stylePrompt: string): string => {
  const enhanced = buildEnhancedGenerationPrompt(description, stylePrompt)
  if (!enhanced || enhanced.trim().length === 0) {
    return buildLegacyGenerationPrompt(stylePrompt)
  }
  return enhanced
}

const DEFAULT_SLIDESHOW_INTERVAL_MS = 8000
const HISTORY_REFRESH_INTERVAL_MS = 180000
const SLIDESHOW_SPEED_OPTIONS = [3000, 5000, 8000, 12000, 20000, 30000]
const ADMIN_PASSWORD = 'football'
const STORAGE_KEYS = {
  slideshowSpeed: 'ourwallpaper::slideshow-speed-ms',
  slideshowPlaying: 'ourwallpaper::slideshow-playing',
  adminVerified: 'ourwallpaper::admin-verified',
  kioskMode: 'ourwallpaper::slideshow-only'
}

function PhotoViewer() {
  const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(null)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null)
  const [artPrompt, setArtPrompt] = useState<string | null>(null)
  const [promptTemplate, setPromptTemplate] = useState<string | null>(null)
  const [generationPrompt, setGenerationPrompt] = useState<string | null>(null)
  const [showPromptInfo, setShowPromptInfo] = useState(false)
  const [showWorkflowInfo, setShowWorkflowInfo] = useState(false)
  const [filmstripWidth, setFilmstripWidth] = useState(360)
  const [hoverPreview, setHoverPreview] = useState<{
    top: number
    entryId: string
    generated: string
    original?: string
    isLoading: boolean
  } | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [generatedId, setGeneratedId] = useState<string | null>(null)
  
  // Processing stages: 'analyzing', 'prompting', 'generating', 'complete'
  const [stage, setStage] = useState<'analyzing' | 'prompting' | 'generating' | 'complete' | null>(null)
  const [backgroundStage, setBackgroundStage] = useState<'analyzing' | 'prompting' | 'generating' | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)
  
  // History and generation control
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyThumbnails, setHistoryThumbnails] = useState<Record<string, string>>({})
  const [historyOriginalPhotos, setHistoryOriginalPhotos] = useState<Record<string, Photo>>({})
  const [unseenQueue, setUnseenQueue] = useState<string[]>([])
  const [priorityQueue, setPriorityQueue] = useState<string[]>([])
  const [currentOriginalFilename, setCurrentOriginalFilename] = useState<string | null>(null)
  const [pinnedOriginal, setPinnedOriginal] = useState<string | null>(null)
  const [pinnedTargetId, setPinnedTargetId] = useState<string | null>(null)
  const [pinnedLoading, setPinnedLoading] = useState(false)
  const pinnedPreviousSlideshow = useRef<boolean>(true)
  const [generationPaused, setGenerationPaused] = useState(true)
  const [slideshowPlaying, setSlideshowPlaying] = useState(true)
  const [slideshowSpeedMs, setSlideshowSpeedMs] = useState(DEFAULT_SLIDESHOW_INTERVAL_MS)
  const [thumbnailsLoading, setThumbnailsLoading] = useState(true)
  const [missingOriginal, setMissingOriginal] = useState(false)
  const [slideshowOnly, setSlideshowOnly] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = window.localStorage.getItem(STORAGE_KEYS.kioskMode)
    if (stored === null) return true
    return stored === 'true'
  })
  const [adminVerified, setAdminVerified] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [adminPasswordInput, setAdminPasswordInput] = useState('')
  const [adminError, setAdminError] = useState('')

  // Prevent duplicate initialization in React StrictMode
  const processing = useRef(false)
  const backgroundProcessing = useRef(false)
  const filmstripResizeActive = useRef(false)
  const filmstripResizeData = useRef<{ startX: number; startWidth: number }>({ startX: 0, startWidth: filmstripWidth })
  const viewerRef = useRef<HTMLDivElement>(null)
  const historyOriginalRequests = useRef(new Set<string>())
  const generationPausedRef = useRef(true)
  const generatedIdRef = useRef<string | null>(generatedId)
  const historyThumbnailsRef = useRef<Record<string, string>>(historyThumbnails)
  const cycleTimerRef = useRef<number | null>(null)
  const historyIdsRef = useRef<string[]>([])
 
  useEffect(() => {
    generationPausedRef.current = generationPaused
  }, [generationPaused])

  useEffect(() => {
    generatedIdRef.current = generatedId
  }, [generatedId])

  useEffect(() => {
    historyThumbnailsRef.current = historyThumbnails
  }, [historyThumbnails])
 
  useEffect(() => {
    setHistory([])
    setHistoryThumbnails({})
    historyThumbnailsRef.current = {}
    setHistoryOriginalPhotos({})
    setUnseenQueue([])
    setPriorityQueue([])
    historyIdsRef.current = []
  }, [pinnedOriginal])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.kioskMode, String(slideshowOnly))
    }
  }, [slideshowOnly])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('slideshow-only-mode', slideshowOnly)

      return () => {
        document.body.classList.remove('slideshow-only-mode')
      }
    }
  }, [slideshowOnly])

  useEffect(() => {
    if (slideshowOnly) {
      setError('')
      return
    }
  }, [slideshowOnly])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault()
        setSlideshowOnly((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!filmstripResizeActive.current) return
      const delta = event.clientX - filmstripResizeData.current.startX
      const newWidth = Math.min(500, Math.max(200, filmstripResizeData.current.startWidth + delta))
      setFilmstripWidth(newWidth)
    }

    const handleMouseUp = () => {
      if (filmstripResizeActive.current) {
        filmstripResizeActive.current = false
        document.body.classList.remove('resizing-filmstrip')
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const startFilmstripResize = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (slideshowOnly) return
    filmstripResizeActive.current = true
    filmstripResizeData.current = { startX: event.clientX, startWidth: filmstripWidth }
    document.body.classList.add('resizing-filmstrip')
  }

  const handleThumbnailEnter = (event: ReactMouseEvent<HTMLDivElement>, entry: HistoryEntry) => {
    if (!viewerRef.current || slideshowOnly) return
    const rect = event.currentTarget.getBoundingClientRect()
    const top = Math.max(24, rect.top)
    const generated = historyThumbnails[entry.id]
    if (!generated) return

    const originalPhoto = historyOriginalPhotos[entry.id]
    const original = originalPhoto?.data ?? null
    setHoverPreview({
      top,
      entryId: entry.id,
      generated,
      original,
      isLoading: !original
    })

    if (!original && !historyOriginalRequests.current.has(entry.id) && !slideshowOnly) {
      historyOriginalRequests.current.add(entry.id)

      iCloudAPI
        .getPhotoByFilename(entry.original_filename)
        .then((photo) => {
          setHistoryOriginalPhotos((prev) => {
            if (prev[entry.id]) {
              return prev
            }
            return { ...prev, [entry.id]: photo }
          })

          setHoverPreview((prev) => {
            if (!prev || prev.entryId !== entry.id) {
              return prev
            }
            return {
              ...prev,
              original: photo.data,
              isLoading: false
            }
          })
        })
        .catch((err) => {
          console.error('Failed to load original for hover preview:', err)
          setHoverPreview((prev) => {
            if (!prev || prev.entryId !== entry.id) {
              return prev
            }
            return {
              ...prev,
              isLoading: false
            }
          })
        })
        .finally(() => {
          historyOriginalRequests.current.delete(entry.id)
        })
    }
  }

  const handleThumbnailLeave = () => {
    if (slideshowOnly) return
    setHoverPreview(null)
  }

  const openAdminDialog = () => {
    setAdminError('')
    setAdminPasswordInput('')
    setShowAdminDialog(true)
  }

  const closeAdminDialog = () => {
    setShowAdminDialog(false)
    setAdminPasswordInput('')
    setAdminError('')
  }

  const handleAdminPasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (adminPasswordInput.trim().toLowerCase() === ADMIN_PASSWORD) {
      setAdminVerified(true)
      setAdminError('')
      setAdminPasswordInput('')
    } else {
      setAdminError('Incorrect password. Please try again.')
    }
  }

  const handleAdminAction = () => {
    if (!adminVerified) {
      return
    }

    if (!isAdmin) {
      setIsAdmin(true)
    }

    if (generationPausedRef.current) {
      resumeGeneration()
      fetchAndProcessPhoto()
    } else {
      pauseGeneration()
    }

    closeAdminDialog()
  }

  const applyBackgroundResult = (result: BackgroundResult) => {
    setError('')
    setHoverPreview(null)
    setCurrentPhoto(result.photo)
    setAnalysis(result.analysis)
    setArtPrompt(result.artPrompt)
    setPromptTemplate(result.promptTemplate ?? null)
    setGenerationPrompt(result.generationPrompt ?? null)
    setGeneratedImage(result.generatedImage)
    setGeneratedId(result.id)
    setHistoryOriginalPhotos((prev) => (prev[result.id] ? prev : { ...prev, [result.id]: result.photo }))
    setShowOriginal(false)
    setShowPromptInfo(false)
    setStage('complete')
  }

  const fetchAndProcessPhoto = async () => {
    // Prevent duplicate calls
    if (processing.current) {
      console.log('⏭️ Skipping duplicate fetch - already processing')
      return
    }
    
    processing.current = true
    setError('')
    setHoverPreview(null)
    setAnalysis(null)
    setArtPrompt(null)
    setPromptTemplate(null)
    setGenerationPrompt(null)
    setShowPromptInfo(false)
    setGeneratedImage(null)
    setStage(null)
    setShowOriginal(false)

    try {
      console.log('📸 Fetching random photo...')
      const photo = await iCloudAPI.getRandomPhoto()
      setCurrentPhoto(photo)
      console.log(`✅ Got photo: ${photo.filename}`)
      
      // Step 1: Analyze the image
      console.log('👁️ Analyzing image...')
      setStage('analyzing')
      const analysisResult = await iCloudAPI.analyzeImage(photo)
      setAnalysis(analysisResult)
      console.log('✅ Analysis complete')
      
      // Step 2: Generate creative art prompt based on analysis
      console.log('🎨 Generating art prompt...')
      setStage('prompting')
      const promptResult = await iCloudAPI.generatePrompt(analysisResult.description, photo.filename)
      setArtPrompt(promptResult.art_prompt)
      setPromptTemplate(promptResult.prompt_template)
      console.log(`✨ Prompt generated: ${promptResult.art_prompt}`)
      
      // Step 3: Generate styled image using the AI-generated prompt
      console.log('🍌 Generating styled image...')
      setStage('generating')
      const generationPromptText = buildGenerationPrompt(analysisResult.description, promptResult.art_prompt)
      setGenerationPrompt(generationPromptText)
      const generateResult = await iCloudAPI.generateImage(
        photo, 
        analysisResult.description,
        promptResult.art_prompt,
        promptResult.prompt_template,
        generationPromptText
      )
      setGeneratedImage(generateResult.generated_image)
      setGeneratedId(generateResult.id)
      setHistoryOriginalPhotos((prev) => (prev[generateResult.id] ? prev : { ...prev, [generateResult.id]: photo }))
      setPromptTemplate(generateResult.prompt_template ?? promptResult.prompt_template)
      setStage('complete')
      console.log('✅ Generation complete')
      
      // Fetch updated history
      await fetchHistory()
      
    } catch (err: any) {
      console.error('❌ Error:', err)
      setStage(null)
      setError(err.response?.data?.detail || 'Failed to process image')
    } finally {
      processing.current = false
    }
  }

  const removeHistoryEntry = useCallback((id: string) => {
    historyOriginalRequests.current.delete(id)
    setHistory((prev) => prev.filter((entry) => entry.id !== id))
    setHistoryThumbnails((prev) => {
      if (!(id in prev)) return prev
      const { [id]: _removed, ...rest } = prev
      return rest
    })
    setHistoryOriginalPhotos((prev) => {
      if (!(id in prev)) return prev
      const { [id]: _removed, ...rest } = prev
      return rest
    })
    setGeneratedId((prev) => (prev === id ? null : prev))

    if (generatedIdRef.current === id) {
      generatedIdRef.current = null
      setGeneratedImage(null)
      setAnalysis(null)
      setArtPrompt(null)
      setPromptTemplate(null)
      setGenerationPrompt(null)
      setShowOriginal(false)
      setCurrentPhoto(null)
    }
  }, [])

  const loadHistoryThumbnails = useCallback(async (entries: HistoryEntry[]) => {
    const missing = entries.filter((entry) => !historyThumbnailsRef.current[entry.id])
    const concurrency = 10

    for (let i = 0; i < missing.length; i += concurrency) {
      const batch = missing.slice(i, i + concurrency)
      await Promise.all(
        batch.map(async (entry) => {
          try {
            const imageData = await iCloudAPI.getGeneratedImage(entry.filename)
            setHistoryThumbnails((prev) => ({ ...prev, [entry.id]: imageData.data }))
          } catch (err) {
            console.error(`Failed to load thumbnail for ${entry.filename}:`, err)
            removeHistoryEntry(entry.id)
          }
        })
      )
    }
  }, [removeHistoryEntry, slideshowOnly])

  const fetchHistory = useCallback(async () => {
    try {
      setThumbnailsLoading(true)
      if (pinnedOriginal) {
        setPinnedLoading(true)
      }
      const historyData = await iCloudAPI.getGeneratedHistory(pinnedOriginal ?? undefined)
 
       if (pinnedOriginal && historyData.history.length === 0) {
         setError('No generated variations found for this photo yet')
         setPinnedLoading(false)
         setPinnedTargetId(null)
         setPinnedOriginal(null)
         return
       }
 
       setHistory(historyData.history)
 
      if (pinnedOriginal && historyData.history.length > 0) {
        const normalize = (value: string | null | undefined) => {
          if (!value) return null
          const parts = value.split(/[\\\/]/)
          return parts[parts.length - 1]?.toLowerCase() ?? value.toLowerCase()
        }

        const targetOriginal = normalize(pinnedOriginal)
        const targetEntry = historyData.history.find((entry) => entry.id === pinnedTargetId)
          ?? historyData.history.find((entry) => normalize(entry.original_filename) === targetOriginal)
          ?? historyData.history[0]

        if (targetEntry) {
          setGeneratedId(targetEntry.id)
          setPinnedTargetId(targetEntry.id)
          void viewHistoryImage(targetEntry, { fromAutoCycle: true })
        }
      }

      // Load thumbnails for all history items
      await loadHistoryThumbnails(historyData.history)
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      if (pinnedOriginal) {
        setPinnedLoading(false)
      }
      setThumbnailsLoading(false)
    }
  }, [loadHistoryThumbnails, pinnedOriginal, slideshowOnly])

  const togglePinnedOriginal = useCallback(() => {
    if (!currentOriginalFilename) {
      return
    }
 
    setPinnedOriginal((prev) => {
      if (prev && prev === currentOriginalFilename) {
        setPinnedTargetId(null)
        setSlideshowPlaying(pinnedPreviousSlideshow.current)
        return null
      }
      pinnedPreviousSlideshow.current = slideshowPlaying
      setPinnedTargetId(generatedId)
      setSlideshowPlaying(false)
      if (cycleTimerRef.current !== null) {
        window.clearTimeout(cycleTimerRef.current)
        cycleTimerRef.current = null
      }
      return currentOriginalFilename
    })
  }, [currentOriginalFilename, generatedId])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    void fetchHistory()

    const intervalId = window.setInterval(() => {
      void fetchHistory()
    }, HISTORY_REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [fetchHistory])

  const viewHistoryImage = useCallback(async (entry: HistoryEntry, options?: { fromAutoCycle?: boolean }) => {
    const fromAutoCycle = options?.fromAutoCycle ?? false
    try {
      if (fromAutoCycle) {
        console.log(`🔁 Cycling to history image: ${entry.filename}`)
      } else {
        console.log(`📷 Viewing history image: ${entry.filename}`)
      }
      setHoverPreview(null)
      setError('')
      
      // Focus on the selected history entry
      if (!fromAutoCycle) {
        setShowPromptInfo(false)
      }

      // Update metadata immediately
      setGeneratedId(entry.id)
      setAnalysis({ filename: entry.original_filename, description: entry.description, analysis_time: entry.generation_time })
      setArtPrompt(entry.prompt)
      setPromptTemplate(entry.prompt_template || null)
      setGenerationPrompt(entry.generation_prompt || null)
      setStage('complete')
      setShowOriginal(false)
      setMissingOriginal(false)
      setCurrentOriginalFilename(entry.original_filename || null)

      // Display cached generated image instantly if available
      if (historyThumbnailsRef.current[entry.id]) {
        setGeneratedImage(historyThumbnailsRef.current[entry.id])
      } else {
        try {
          const imageData = await iCloudAPI.getGeneratedImage(entry.filename)
          setHistoryThumbnails((prev) => ({ ...prev, [entry.id]: imageData.data }))
          setGeneratedImage(imageData.data)
        } catch (imgErr) {
          console.error('Failed to load history image:', imgErr)
          if (slideshowOnly) {
            removeHistoryEntry(entry.id)
            return
          }
          setError('Failed to load generated image')
          removeHistoryEntry(entry.id)
          return
        }
      }

      // Fetch the original photo asynchronously (for toggle)
      const cachedOriginal = historyOriginalPhotos[entry.id]
      if (cachedOriginal) {
        setCurrentPhoto(cachedOriginal)
      } else {
        if (!fromAutoCycle) {
          console.log(`📸 Fetching original photo: ${entry.original_filename}`)
        }
        try {
          const originalPhoto = await iCloudAPI.getPhotoByFilename(entry.original_filename)
          setCurrentPhoto(originalPhoto)
          setHistoryOriginalPhotos((prev) => ({ ...prev, [entry.id]: originalPhoto }))
          setMissingOriginal(false)
        } catch (photoErr) {
          console.error('Failed to load original photo:', photoErr)
          setMissingOriginal(true)
        }
      }
    } catch (err) {
      console.error('Failed to load history entry:', err)
      setError('Failed to load history image')
    }
  }, [historyOriginalPhotos, removeHistoryEntry, slideshowOnly])

  useEffect(() => {
    if (history.length === 0) {
      historyIdsRef.current = []
      setUnseenQueue([])
      setPriorityQueue([])
      return
    }

    const historyIds = history.map((entry) => entry.id)
    const prevHistoryIds = historyIdsRef.current
    historyIdsRef.current = historyIds

    const newIds = historyIds.filter((id) => !prevHistoryIds.includes(id) && id !== generatedId)

    setUnseenQueue((prev) => {
      const filtered = prev.filter((id) => historyIds.includes(id) && id !== generatedId)
      const additions = historyIds.filter(
        (id) => id !== generatedId && !filtered.includes(id) && !newIds.includes(id)
      )
      return [...filtered, ...newIds, ...additions]
    })

    if (newIds.length > 0) {
      setPriorityQueue((prev) => {
        const next = [...newIds, ...prev]
        const unique: string[] = []
        for (const id of next) {
          if (id !== generatedId && !unique.includes(id)) {
            unique.push(id)
          }
        }
        return unique.slice(0, 3)
      })
    } else {
      setPriorityQueue((prev) => prev.filter((id) => historyIds.includes(id) && id !== generatedId))
    }
  }, [history, generatedId])

  useEffect(() => {
    if (!generatedId) return
    setUnseenQueue((prev) => prev.filter((id) => id !== generatedId))
    setPriorityQueue((prev) => prev.filter((id) => id !== generatedId))
  }, [generatedId])

  useEffect(() => {
    const clearTimer = () => {
      if (cycleTimerRef.current !== null) {
        window.clearTimeout(cycleTimerRef.current)
        cycleTimerRef.current = null
      }
    }

    clearTimer()

    if (!slideshowPlaying || history.length === 0) {
      return clearTimer
    }

    cycleTimerRef.current = window.setTimeout(() => {
      const historyMap = new Map(history.map((entry) => [entry.id, entry]))
      let nextId: string | undefined
      let usedPriority = false

      if (priorityQueue.length > 0) {
        nextId = priorityQueue[0]
        usedPriority = true
      } else if (unseenQueue.length > 0) {
        const index = Math.floor(Math.random() * unseenQueue.length)
        nextId = unseenQueue[index]
      } else {
        const currentId = generatedIdRef.current
        const fallbackIds = history.map((entry) => entry.id).filter((id) => id !== currentId)
        if (fallbackIds.length === 0) return
        nextId = fallbackIds[Math.floor(Math.random() * fallbackIds.length)]
        const refill = fallbackIds.filter((id) => id !== nextId)
        setUnseenQueue(refill)
      }

      if (!nextId) return

      const selectedId = nextId

      setPriorityQueue((prev) =>
        prev.filter((id, idx) => {
          if (id === selectedId) return false
          if (usedPriority && idx === 0) return false
          return true
        })
      )
      setUnseenQueue((prev) => {
        const filtered = prev.filter((id) => id !== selectedId)
        if (filtered.length > 0) {
          return filtered
        }
        const currentId = generatedIdRef.current
        const refill = history
          .map((entry) => entry.id)
          .filter((id) => id !== selectedId && id !== currentId)
        return refill
      })

      const nextEntry = historyMap.get(selectedId)
      if (nextEntry) {
        void viewHistoryImage(nextEntry, { fromAutoCycle: true })
      }
    }, slideshowSpeedMs)

    return clearTimer
  }, [slideshowPlaying, history, generatedId, viewHistoryImage, slideshowSpeedMs, priorityQueue, unseenQueue])

  const pauseGeneration = () => {
    if (generationPausedRef.current) return
    console.log('⏹️  Pausing image generation')
    generationPausedRef.current = true
    setGenerationPaused(true)
    setBackgroundStage(null)
  }

  const resumeGeneration = () => {
    if (!generationPausedRef.current) return
    console.log('▶️  Resuming image generation')
    generationPausedRef.current = false
    setGenerationPaused(false)
    setHoverPreview(null)
    setShowPromptInfo(false)

    if (!backgroundProcessing.current && stage === 'complete') {
      setTimeout(() => {
        if (!backgroundProcessing.current && !generationPausedRef.current) {
          fetchAndProcessPhotoBackground()
        }
      }, 0)
    }
  }

  const toggleGeneration = () => {
    if (!isAdmin) {
      openAdminDialog()
      return
    }

    const wasPaused = generationPausedRef.current

    if (wasPaused) {
      resumeGeneration()
      if (!processing.current && !backgroundProcessing.current) {
        fetchAndProcessPhoto()
      }
    } else {
      pauseGeneration()
    }
  }

  const fetchAndProcessPhotoBackground = async () => {
    if (backgroundProcessing.current) {
      console.log('⏭️ Background processing already in progress')
      return
    }

    if (generationPausedRef.current) {
      console.log('⏹️ Background processing skipped - image generation paused')
      return
    }
    
    backgroundProcessing.current = true

    const cleanup = () => {
      setBackgroundStage(null)
      backgroundProcessing.current = false
    }

    try {
      console.log('🔄 [Background] Starting next photo processing...')
      setBackgroundStage('analyzing')
      const photo = await iCloudAPI.getRandomPhoto()
      console.log(`🔄 [Background] Got photo: ${photo.filename}`)

      if (generationPausedRef.current) {
        cleanup()
        return
      }
      
      const analysisResult = await iCloudAPI.analyzeImage(photo)
      console.log('🔄 [Background] Analysis complete')

      if (generationPausedRef.current) {
        cleanup()
        return
      }
      
      setBackgroundStage('prompting')
      const promptResult = await iCloudAPI.generatePrompt(analysisResult.description, photo.filename)
      console.log(`🔄 [Background] Prompt: ${promptResult.art_prompt}`)

      if (generationPausedRef.current) {
        cleanup()
        return
      }
      
      setBackgroundStage('generating')
      const generationPromptText = buildGenerationPrompt(analysisResult.description, promptResult.art_prompt)
      const generateResult = await iCloudAPI.generateImage(
        photo,
        analysisResult.description,
        promptResult.art_prompt,
        promptResult.prompt_template,
        generationPromptText
      )
      console.log('🔄 [Background] Generation complete - preparing to swap in new image!')

      if (generationPausedRef.current) {
        cleanup()
        return
      }

      const completedResult: BackgroundResult = {
        photo,
        analysis: analysisResult,
        artPrompt: promptResult.art_prompt,
        promptTemplate: generateResult.prompt_template ?? promptResult.prompt_template ?? null,
        generationPrompt: generateResult.generation_prompt ?? generationPromptText,
        generatedImage: generateResult.generated_image,
        id: generateResult.id
      }

      setHistoryOriginalPhotos((prev) => (prev[generateResult.id] ? prev : { ...prev, [generateResult.id]: photo }))

      await fetchHistory()

      if (generationPausedRef.current) {
        cleanup()
        return
      }

      cleanup()

      applyBackgroundResult(completedResult)

      if (!generationPausedRef.current) {
        setTimeout(() => {
          if (!generationPausedRef.current) {
            fetchAndProcessPhotoBackground()
          }
        }, 100)
      }

    } catch (err: any) {
      console.error('❌ [Background] Error:', err)
      cleanup()
      if (!generationPausedRef.current) {
        setTimeout(() => {
          if (!generationPausedRef.current) {
            fetchAndProcessPhotoBackground()
          }
        }, 2000)
      }
    }
  }

  // Start background processing when current image is complete
  useEffect(() => {
    if (stage === 'complete' && !backgroundProcessing.current && !generationPaused) {
      console.log('🔄 Starting background processing for next image...')
      fetchAndProcessPhotoBackground()
    }
  }, [stage, generationPaused])

  useEffect(() => {
    if (history.length > 0 && !generatedId && !pinnedOriginal) {
      const randomIndex = Math.floor(Math.random() * history.length)
      const randomEntry = history[randomIndex]
      if (randomEntry) {
        void viewHistoryImage(randomEntry, { fromAutoCycle: true })
      }
    }
  }, [history, generatedId, pinnedOriginal, viewHistoryImage])

  useEffect(() => {
    if (pinnedOriginal && !pinnedLoading && history.length > 0) {
      setSlideshowPlaying(true)
    }
  }, [pinnedOriginal, pinnedLoading, history.length])

  const isCurrentPinned = Boolean(pinnedOriginal && currentOriginalFilename && pinnedOriginal === currentOriginalFilename)

  // Determine which image to show
  const displayImage = showOriginal
    ? currentPhoto?.data
    : (generatedImage || currentPhoto?.data)

  return (
    <div className="photo-viewer" ref={viewerRef}>
      {error && !slideshowOnly && (
        <div className="error-message">{error}</div>
      )}

      {slideshowOnly && (
        <button
          className="info-icon-button floating"
          onClick={() => {
            setShowPromptInfo(false)
            setShowWorkflowInfo(true)
          }}
          title="How the app works"
          aria-label="Show workflow overview"
        >
          <span className="info-icon">i</span>
        </button>
      )}

      {!slideshowOnly && showWorkflowInfo && (
        <div className="workflow-popup" role="dialog" aria-modal="true">
          <div className="workflow-content">
            <div className="workflow-header">
              <h4>How This Slideshow Works</h4>
              <button
                className="workflow-close"
                onClick={() => setShowWorkflowInfo(false)}
                aria-label="Close workflow overview"
              >
                ✕
              </button>
            </div>
            <ol className="workflow-steps">
              <li>On startup a random local image is selected.</li>
              <li>The image is resized and analysed with Google Gemini 2.5 Flash.</li>
              <li>The description feeds a prompt that selects a fitting art style.</li>
              <li>Gemini 2.5 Flash Image ("Nano Banana") generates the final artwork.</li>
              <li>The generated piece, analysis, and prompts display immediately while the next photo starts processing in the background.</li>
              <li>Clicking a history thumbnail replays its saved prompts while background generation continues.</li>
            </ol>
            <p className="workflow-note">
              Background processing keeps one finished image ready so the slideshow feels continuous even while models are working.
            </p>
          </div>
        </div>
      )}

      {!slideshowOnly && showAdminDialog && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h4>Admin Controls</h4>
              <button
                className="admin-modal-close"
                onClick={closeAdminDialog}
                aria-label="Close admin controls"
              >
                ✕
              </button>
            </div>
            {adminVerified ? (
              <div className="admin-modal-body">
                <p className="admin-modal-text">
                  {generationPaused
                    ? 'Start image generation when you are ready.'
                    : 'Image generation is currently running.'}
                </p>
                <button
                  type="button"
                  className="admin-modal-primary"
                  onClick={handleAdminAction}
                >
                  {generationPaused ? 'Start Image Generation' : 'Stop Image Generation'}
                </button>
                <p className="admin-modal-hint">
                  Generation controls appear in the footer while admin mode is active.
                </p>
              </div>
            ) : (
              <form className="admin-modal-body" onSubmit={handleAdminPasswordSubmit}>
                <label htmlFor="admin-password" className="admin-modal-label">
                  Admin Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  className="admin-modal-input"
                  value={adminPasswordInput}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setAdminPasswordInput(event.target.value)}
                  autoFocus
                />
                {adminError && <p className="admin-modal-error">{adminError}</p>}
                <div className="admin-modal-actions">
                  <button type="submit" className="admin-modal-primary">
                    Unlock
                  </button>
                  <button type="button" className="admin-modal-secondary" onClick={closeAdminDialog}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Filmstrip - left sidebar with history */}
      {!slideshowOnly && (history.length > 0 || thumbnailsLoading) && (
        <>
          <div className="filmstrip" style={{ width: filmstripWidth }}>
            <h3 className="filmstrip-title">{pinnedOriginal ? 'Variations' : 'Gallery'}</h3>
            {thumbnailsLoading ? (
              <div className="filmstrip-loading" aria-live="polite">
                <div className="spinner small"></div>
                <span>Loading thumbnails…</span>
              </div>
            ) : (
              <div className="filmstrip-scroll">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className={`filmstrip-item ${entry.id === generatedId ? 'active' : ''}`}
                    onClick={() => viewHistoryImage(entry)}
                    onMouseEnter={(event) => handleThumbnailEnter(event, entry)}
                    onMouseLeave={handleThumbnailLeave}
                    title={entry.prompt}
                  >
                    <div className="filmstrip-thumbnail">
                      {historyThumbnailsRef.current[entry.id] ? (
                        <img src={historyThumbnailsRef.current[entry.id]} alt={entry.prompt} />
                      ) : (
                        <div className="filmstrip-placeholder">
                          <span>🎨</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div
            className="filmstrip-resizer"
            onMouseDown={startFilmstripResize}
            role="separator"
            aria-orientation="vertical"
            aria-label={pinnedOriginal ? 'Resize variations thumbnails panel' : 'Resize gallery thumbnails panel'}
          ></div>
        </>
      )}

      {!slideshowOnly && hoverPreview && (
        <div
          className="thumbnail-hover-preview"
          style={{ top: hoverPreview.top, left: filmstripWidth + 24 }}
        >
          <div className="thumbnail-hover-images">
            <div className="thumbnail-hover-image-block">
              <span className="thumbnail-hover-label">Generated</span>
              <img src={hoverPreview.generated} alt="Generated preview" />
            </div>
            <div className="thumbnail-hover-image-block">
              <span className="thumbnail-hover-label">Original</span>
              {hoverPreview.original ? (
                <img src={hoverPreview.original} alt="Original preview" />
              ) : (
                <div className="thumbnail-hover-placeholder" aria-live="polite">
                  {hoverPreview.isLoading ? 'Loading…' : 'Unavailable'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="main-content">
        {/* Main Image Display */}
        <div
          className={`image-container ${slideshowOnly ? 'kiosk-mode' : ''}`}
          onClick={() => {
            if (!generatedImage || stage !== 'complete') return
            if (!showOriginal) {
              if (missingOriginal) {
                return
              }
              setError('')
              setShowOriginal(true)
            } else {
              setError('')
              setShowOriginal(false)
            }
          }}
          role={generatedImage ? 'button' : undefined}
          tabIndex={generatedImage ? 0 : undefined}
          onKeyDown={(event) => {
            if (!generatedImage) return
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              if (!showOriginal) {
                if (missingOriginal) {
                  return
                }
                setError('')
                setShowOriginal(true)
              } else {
                setError('')
                setShowOriginal(false)
              }
            }
          }}
          aria-label={generatedImage ? (showOriginal ? 'Return to generated image' : 'Show original image') : undefined}
        >
          {currentOriginalFilename && (
            <button
              type="button"
              className={`pin-toggle-button ${isCurrentPinned ? 'pinned' : ''}`}
              onClick={(event) => {
                event.stopPropagation()
                togglePinnedOriginal()
              }}
              title={isCurrentPinned ? 'Show all images' : 'Show only variations of this photo'}
              aria-label={isCurrentPinned ? 'Unpin original photo' : 'Pin this original photo'}
              aria-pressed={isCurrentPinned}
            >
              {isCurrentPinned ? '📌' : '📍'}
            </button>
          )}

          {pinnedOriginal && (
             <div className={`pin-status-badge ${isCurrentPinned ? 'active' : ''}`} aria-live="polite">
              {pinnedLoading ? 'Getting variations of this image…' : 'Showing all variations of this image'}
            </div>
          )}

          {displayImage && (
            <img src={displayImage} alt="Photo" className="main-image" />
          )}
          
          {/* Per-image overlay removed; footer now reflects background stages */}

          {/* Toggle button removed; image click handles compare */}

        </div>

        {/* Analysis Panel - only show after analyzing is done */}
         {!slideshowOnly && analysis && (
           <aside className="analysis-panel" aria-live="polite">
            <div className="analysis-header">
              <h3>Image Description</h3>
              <button
                className="info-icon-button"
                onClick={() => setShowWorkflowInfo(true)}
                title="How the app works"
                aria-label="Show workflow overview"
              >
                <span className="info-icon">i</span>
              </button>
            </div>
            <div className="analysis-text" role="document">
              <p>{analysis.description}</p>
            </div>
            {artPrompt && (
              <>
                <div className="prompt-divider"></div>
                <div className="prompt-header">
                  <h3>Image Prompt</h3>
                  {promptTemplate && (
                    <button
                      className="info-icon-button"
                      onClick={() => setShowPromptInfo(true)}
                      title="View prompt template"
                      aria-label="View prompt template"
                    >
                      <span className="info-icon">i</span>
                    </button>
                  )}
                </div>
                <p className="art-prompt-text">"{artPrompt}"</p>
      {showPromptInfo && promptTemplate && (
                  <div className="prompt-info-popup" role="dialog" aria-modal="true">
                    <div className="prompt-info-content">
                      <div className="prompt-info-header">
              <h4>Image Prompt Details</h4>
                        <button
                          className="prompt-info-close"
                          onClick={() => setShowPromptInfo(false)}
                          aria-label="Close prompt details"
                        >
                          ✕
                        </button>
                      </div>
            <div className="prompt-info-sections split">
              <div className="prompt-info-panel" aria-label="Image Prompt Template">
                <h5 className="prompt-info-subtitle">Image Prompt Template</h5>
                <pre className="prompt-info-text">{promptTemplate}</pre>
              </div>
              {generationPrompt && (
                <div className="prompt-info-panel" aria-label="Image Generation Prompt">
                  <h5 className="prompt-info-subtitle">Image Generation Prompt</h5>
                  <pre className="prompt-info-text">{generationPrompt}</pre>
                </div>
              )}
            </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </aside>
        )}
      </div>

      {/* Background Processing Footer */}
      <div className="background-status-footer">
        <div className="footer-left-controls">
          <button
            className={`slideshow-toggle-button ${slideshowPlaying ? '' : 'paused'}`}
            onClick={() => setSlideshowPlaying((prev) => !prev)}
            aria-pressed={slideshowPlaying}
            title={slideshowPlaying ? 'Pause slideshow' : 'Resume slideshow'}
          >
            {slideshowPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
          </button>
          <label htmlFor="slideshow-speed" className="slideshow-speed-label">
            Speed
          </label>
          <select
            id="slideshow-speed"
            className="slideshow-speed-select"
            value={slideshowSpeedMs}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setSlideshowSpeedMs(Number(event.target.value))}
          >
            {SLIDESHOW_SPEED_OPTIONS.map((optionMs) => (
              <option key={optionMs} value={optionMs}>
                {Math.round(optionMs / 1000)}s
              </option>
            ))}
          </select>
          {isAdmin && (
            <>
              <span className="footer-divider" aria-hidden="true"></span>
              <button
                className={`generation-toggle-button ${generationPaused ? 'paused' : ''}`}
                onClick={toggleGeneration}
                title={generationPaused ? 'Start image generation' : 'Stop image generation'}
                aria-pressed={generationPaused}
              >
                {generationPaused ? 'Start Image Generation' : 'Stop Image Generation'}
              </button>
              <span className="background-status-label">Next Image:</span>
              <span className="background-status-text">
                {generationPaused
                  ? 'Paused'
                  : backgroundStage === 'analyzing'
                    ? 'Analysing...'
                    : backgroundStage === 'prompting'
                      ? 'Creating image prompt...'
                      : backgroundStage === 'generating'
                        ? 'Generating image...'
                        : 'Ready'}
              </span>
            </>
          )}
        </div>
        <div className="footer-middle-controls">
          <button
            className={`kiosk-toggle-button ${slideshowOnly ? 'active' : ''}`}
            onClick={() => setSlideshowOnly((prev) => !prev)}
            title={slideshowOnly ? 'Show details' : 'Hide details'}
            aria-pressed={slideshowOnly}
            aria-label="Toggle details view"
          >
            {slideshowOnly ? 'Show Details' : 'Hide Details'}
          </button>
        </div>
        <div className="footer-right-controls">
          <button
            className="settings-button footer-settings-button"
            onClick={openAdminDialog}
            title="Admin settings"
            aria-label="Admin settings"
          >
            ⚙️
          </button>
        </div>
      </div>
    </div>
  )
}

export default PhotoViewer