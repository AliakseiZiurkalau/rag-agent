# 🏗️ Архитектура React Frontend

## 📐 Общая схема

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    React App                          │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              App.tsx (Root)                     │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │  │  │
│  │  │  │  Header  │  │   Tabs   │  │ SourceModal  │  │  │  │
│  │  │  └──────────┘  └──────────┘  └──────────────┘  │  │  │
│  │  │                                                  │  │  │
│  │  │  ┌──────────────────────────────────────────┐  │  │  │
│  │  │  │         Tab Content (Active)             │  │  │  │
│  │  │  │  • XWikiTab                              │  │  │  │
│  │  │  │  • DocumentsTab                          │  │  │  │
│  │  │  │  • ChatTab                               │  │  │  │
│  │  │  │  • SettingsTab                           │  │  │  │
│  │  │  └──────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/EventSource
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                           │
│                   (localhost:8000)                           │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

```
┌──────────────┐
│   User       │
│   Action     │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────────────────────────┐
│                    React Component                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Event Handler (onClick, onChange, etc.)           │  │
│  └────────────┬───────────────────────────────────────┘  │
└───────────────┼──────────────────────────────────────────┘
                │
                ↓
┌───────────────────────────────────────────────────────────┐
│              State Management Layer                        │
│  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │  React Query     │  │  Zustand Store               │  │
│  │  (Server State)  │  │  (Client State)              │  │
│  │  • Caching       │  │  • chatStore (messages)      │  │
│  │  • Refetching    │  │  • modalStore (modal state)  │  │
│  │  • Mutations     │  │                              │  │
│  └────────┬─────────┘  └──────────────────────────────┘  │
└───────────┼──────────────────────────────────────────────┘
            │
            ↓
┌───────────────────────────────────────────────────────────┐
│                    API Client (Axios)                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  • healthApi                                       │  │
│  │  • statsApi                                        │  │
│  │  • documentsApi                                    │  │
│  │  • queryApi                                        │  │
│  │  • settingsApi                                     │  │
│  │  • modelsApi                                       │  │
│  │  • apiModelsApi                                    │  │
│  │  • xwikiApi                                        │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
            │
            ↓ HTTP Request
┌───────────────────────────────────────────────────────────┐
│                  FastAPI Backend                           │
│                  /api/* endpoints                          │
└───────────────────────────────────────────────────────────┘
            │
            ↓ HTTP Response
┌───────────────────────────────────────────────────────────┐
│              React Query Cache                             │
│  • Automatic caching                                       │
│  • Background refetching                                   │
│  • Optimistic updates                                      │
└───────────────────────────────────────────────────────────┘
            │
            ↓ Re-render
┌───────────────────────────────────────────────────────────┐
│              React Component                               │
│  • Updated UI                                              │
│  • New data displayed                                      │
└───────────────────────────────────────────────────────────┘
```

## 🗂️ Folder Structure

```
frontend/src/
│
├── api/                    # API Layer
│   └── client.ts          # Axios client + all API methods
│
├── components/            # React Components
│   ├── tabs/             # Tab Components
│   │   ├── XWikiTab.tsx
│   │   ├── DocumentsTab.tsx
│   │   ├── ChatTab.tsx
│   │   └── SettingsTab.tsx
│   ├── Header.tsx        # Header with status
│   ├── Tabs.tsx          # Tab navigation
│   ├── SourceModal.tsx   # Modal for sources
│   └── ModelDownloadProgress.tsx  # Progress bar
│
├── hooks/                # Custom React Hooks
│   ├── useDocuments.ts   # Documents CRUD
│   ├── useHealthCheck.ts # Health check
│   └── useStats.ts       # Statistics
│
├── store/                # State Management (Zustand)
│   ├── chatStore.ts      # Chat messages state
│   └── modalStore.ts     # Modal state
│
├── types/                # TypeScript Types
│   └── index.ts          # All type definitions
│
├── App.tsx               # Root component
├── main.tsx              # Entry point
└── index.css             # Global styles
```

## 🔌 Component Communication

### Parent → Child (Props)
```typescript
// App.tsx
<Header isHealthy={isHealthy} />
<Tabs activeTab={activeTab} onTabChange={setActiveTab} />
```

### Child → Parent (Callbacks)
```typescript
// Tabs.tsx
<button onClick={() => onTabChange('chat')}>
  Chat
</button>
```

### Sibling → Sibling (Shared State)
```typescript
// ChatTab.tsx
const { openModal } = useModalStore()
openModal(source)

// SourceModal.tsx
const { isOpen, source, closeModal } = useModalStore()
```

## 🎣 Hooks Pattern

### Custom Hook Example
```typescript
// useDocuments.ts
export const useDocuments = () => {
  const queryClient = useQueryClient()

  // Query for fetching
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.list,
  })

  // Mutation for uploading
  const uploadMutation = useMutation({
    mutationFn: documentsApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  return {
    documents,
    isLoading,
    upload: uploadMutation.mutateAsync,
  }
}
```

### Usage in Component
```typescript
// DocumentsTab.tsx
const { documents, upload, isLoading } = useDocuments()

const handleUpload = async (file: File) => {
  await upload(file)
}
```

## 🏪 State Management Strategy

### Server State (React Query)
- Documents list
- Health status
- Statistics
- Settings
- Models list

**Why?** Automatic caching, refetching, and synchronization

### Client State (Zustand)
- Chat messages
- Modal open/close
- Current chunk index

**Why?** Simple, fast, no server sync needed

### Local State (useState)
- Form inputs
- UI toggles
- Temporary data

**Why?** Component-specific, doesn't need sharing

## 🔄 React Query Flow

```
Component Mount
     ↓
useQuery Hook
     ↓
Check Cache ──→ Cache Hit ──→ Return Cached Data
     │                              ↓
     │                         Background Refetch
     │                              ↓
     │                         Update Cache
     │
Cache Miss
     ↓
Fetch from API
     ↓
Store in Cache
     ↓
Return Data
     ↓
Component Renders
```

## 🎨 Styling Strategy

### TailwindCSS Utility Classes
```tsx
<button className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark">
  Click Me
</button>
```

### Custom CSS (index.css)
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

### Conditional Classes
```tsx
className={`
  p-4 rounded-lg
  ${status === 'success' ? 'bg-green-50 text-green-700' : ''}
  ${status === 'error' ? 'bg-red-50 text-red-700' : ''}
`}
```

## 🔐 Type Safety

### API Response Types
```typescript
interface Document {
  filename: string
  file_hash: string
  chunks_count: number
  text_length: number
}
```

### Component Props Types
```typescript
interface HeaderProps {
  isHealthy: boolean
}

export default function Header({ isHealthy }: HeaderProps) {
  // TypeScript knows isHealthy is boolean
}
```

### Hook Return Types
```typescript
const useDocuments = (): {
  documents: Document[]
  isLoading: boolean
  upload: (file: File) => Promise<UploadResponse>
} => {
  // Implementation
}
```

## 🚀 Performance Optimizations

### 1. Code Splitting
Vite automatically splits code by routes/components

### 2. React Query Caching
```typescript
{
  staleTime: 30000,  // Data fresh for 30s
  cacheTime: 300000, // Keep in cache for 5min
}
```

### 3. Lazy Loading
```typescript
const SettingsTab = lazy(() => import('./tabs/SettingsTab'))
```

### 4. Memoization
```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])
```

## 🧪 Testing Strategy

### Unit Tests (Components)
```typescript
test('Header shows online status', () => {
  render(<Header isHealthy={true} />)
  expect(screen.getByText('Система работает')).toBeInTheDocument()
})
```

### Integration Tests (Hooks)
```typescript
test('useDocuments fetches and caches', async () => {
  const { result } = renderHook(() => useDocuments())
  await waitFor(() => expect(result.current.documents).toHaveLength(3))
})
```

### E2E Tests (User Flows)
```typescript
test('user can upload document and ask question', async () => {
  // Upload document
  // Navigate to chat
  // Ask question
  // Verify answer
})
```

## 📦 Build Process

```
npm run build
     ↓
TypeScript Compilation
     ↓
Vite Bundling
     ↓
TailwindCSS Processing
     ↓
Code Minification
     ↓
Asset Optimization
     ↓
Output to ../static-react/
```

## 🔧 Development Workflow

```
1. npm run dev
   ↓
2. Vite Dev Server starts
   ↓
3. Hot Module Replacement active
   ↓
4. Edit component
   ↓
5. Browser updates instantly
   ↓
6. TypeScript checks in background
   ↓
7. ESLint validates code
```

## 🎯 Best Practices Used

✅ **Single Responsibility** - Each component does one thing
✅ **DRY** - Reusable hooks and components
✅ **Type Safety** - Full TypeScript coverage
✅ **Error Handling** - Try-catch + error states
✅ **Loading States** - User feedback during operations
✅ **Optimistic Updates** - Instant UI feedback
✅ **Accessibility** - Semantic HTML + ARIA
✅ **Performance** - Lazy loading + memoization
✅ **Code Organization** - Clear folder structure
✅ **Documentation** - Comments + README

---

**Архитектура спроектирована для:**
- 🚀 Высокой производительности
- 🔧 Легкой поддержки
- 📈 Масштабируемости
- 🛡️ Надежности
- 👥 Командной разработки
