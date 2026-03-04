# 2D Plan Viewer - Architecture Specification

***

## **1. Overview**

This document describes the architecture of an interactive 2D plan viewing application built with React 19, TypeScript, and Vite. The application demonstrates modern React patterns including hooks, context API, and component composition while implementing cursor-fixed zooming, panning, and real-time action logging.

***

## **2. Technology Stack**

### Core Technologies
- **React 19.2.0**: Latest React with enhanced hooks and concurrent features
- **TypeScript 5.9.3**: Type-safe development with strict mode enabled
- **Vite 7.3.1**: Next-generation frontend build tool for fast HMR and optimized builds

### Styling
- **SCSS Modules**: Component-scoped styles with CSS modules pattern
- **Sass 1.97.3**: Advanced CSS preprocessing with variables and mixins

### Development Tools
- **ESLint 9.39.1**: Code quality and consistency enforcement
- **TypeScript ESLint**: Type-aware linting rules
- **React Hooks ESLint Plugin**: Ensures proper hooks usage

***

## **3. Project Structure**

```
src/
├── App.tsx                    # Root component, layout composition
├── App.module.scss            # Root component styles
├── main.tsx                   # Application entry point
├── index.scss                 # Global styles
├── types.ts                   # Shared TypeScript type definitions
├── components/
│   ├── PlanViewer.tsx        # Core viewer with zoom/pan logic
│   ├── PlanViewer.module.scss
│   ├── ActionLog.tsx         # Action logging display
│   └── ActionLog.module.scss
├── contexts/
│   └── LogContext.tsx        # Shared state for action logging
├── styles/
│   ├── _variables.scss       # SCSS variables (colors, spacing)
│   ├── _utils.scss          # Utility classes and mixins
│   └── _elements.scss       # Base element styles
└── assets/                   # Static assets and images
```

***

## **4. State Management**

The application uses **React Context API** for shared state management:

### LogContext

Centralized state for action logs with the following interface:

```typescript
interface LogEntry {
  timestamp: number;
  action: string;
}

interface LogContextType {
  logEntries: LogEntry[];
  addLogEntry: (action: string) => void;
  clearLog: () => void;
}
```

**Responsibilities:**
- Maintains an immutable array of user actions with timestamps
- Provides `addLogEntry` for recording new actions
- Provides `clearLog` for resetting the log
- Exposes a custom `useLog` hook for safe context consumption

***

## **5. Component Architecture**

### 5.1 App.tsx

**Role:** Root component orchestrating the application layout

**Responsibilities:**
- Wraps children with `LogProvider` for context access
- Defines main layout structure (header, viewer, log panels)
- Manages overall application styling and composition

**State:** None (stateless layout component)

### 5.2 PlanViewer.tsx

**Role:** Core interactive component managing zoom and pan functionality

**Key Features:**

#### Zoom Logic
- Mouse wheel event handling with cursor-fixed zooming
- Zoom range: 0.25x (25%) to 5x (500%)
- Maintains the point under the cursor during zoom operations
- Uses multiplicative delta for smooth, consistent zoom feel

#### Pan Logic
- Click-and-drag functionality with visual feedback
- State tracking for mouse down, move, and up events
- Delta calculation relative to start position
- Boundary-free panning for maximum flexibility

#### Image Positioning
- CSS transforms for GPU-accelerated rendering
- Transform origin set to `top left` with calculated offsets
- Performant rendering without layout thrashing

**State Management:**
```typescript
const [zoom, setZoom] = useState(1);
const [pan, setPan] = useState({ x: 0, y: 0 });
const [isPanning, setIsPanning] = useState(false);
const [panStart, setPanStart] = useState({ x: 0, y: 0 });
```

**Refs:**
- `containerRef`: Reference to the viewport container
- `imageRef`: Reference to the image element

**Hooks Used:**
- `useState`: For zoom level, pan position, and panning state
- `useRef`: For DOM references
- `useCallback`: For optimized event handlers
- `useEffect`: For event listener management and initialization
- `useLog`: For action logging integration

**Event Handlers:**
- `handleWheel`: Manages zoom with cursor-fixed behavior
- `handleMouseDown`: Initiates panning
- `handleMouseMove`: Tracks pan delta
- `handleMouseUp`: Completes panning
- `handleDoubleClick`: Resets view to default state

### 5.3 ActionLog.tsx

**Role:** Displays user interaction history

**Features:**
- Timestamp formatting with high-precision milliseconds
- Color-coded action types (zoom-in, zoom-out, pan, reset)
- Scrollable table view for extensive logs
- Clear functionality to reset the log
- Auto-scroll to newest entries

**State:** None (consumes LogContext)

**Display Format:**
```
Timestamp (HH:MM:SS.mmm) | Action
-------------------------|---------
10:23:45.123            | Zoom In
10:23:47.456            | Pan
```

### 5.4 LogContext.tsx

**Role:** Provides shared state management for action logging

**Implementation Details:**
- Context creation with proper TypeScript types
- Custom `useLog` hook with error handling for improper usage
- State management for log entries with immutable updates
- Timestamp generation using `Date.now()` for high precision

***

## **6. Implementation Details**

### 6.1 Zoom Implementation

**Algorithm:**
1. Calculate mouse position relative to container
2. Store the world coordinates at cursor position before zoom
3. Update zoom level (clamped to min/max)
4. Calculate new pan position to maintain cursor position
5. Log the action

**Formula:**
```typescript
// Calculate cursor position in world coordinates
const worldX = (mouseX - panX) / currentZoom;
const worldY = (mouseY - panY) / currentZoom;

// After zoom, adjust pan to maintain world position under cursor
newPanX = mouseX - worldX * newZoom;
newPanY = mouseY - worldY * newZoom;
```

**Constraints:**
- Minimum zoom: 0.25 (25%)
- Maximum zoom: 5 (500%)
- Zoom delta: 0.1 per wheel event

### 6.2 Pan Implementation

**State Machine:**
1. **Idle**: No panning active, cursor shows `grab`
2. **Panning**: Mouse down, tracking movement, cursor shows `grabbing`
3. **Idle**: Mouse up, pan position committed

**Delta Calculation:**
```typescript
const deltaX = currentMouseX - panStartX;
const deltaY = currentMouseY - panStartY;
setPan({ x: initialPanX + deltaX, y: initialPanY + deltaY });
```

**Features:**
- Visual feedback via cursor changes
- Smooth tracking with immediate visual updates
- No boundaries (unlimited panning for flexibility)

### 6.3 Performance Optimizations

#### GPU Acceleration
Uses CSS `transform` property for hardware-accelerated rendering:
```css
transform: translate(${pan.x}px, ${pan.y}px) scale(${zoom});
```

#### Event Handler Memoization
All event handlers wrapped in `useCallback` with proper dependencies to prevent unnecessary re-renders.

#### Ref-based DOM Access
Direct DOM manipulation via refs where appropriate, avoiding unnecessary React reconciliation.

#### Event Listener Management
- Cleanup in `useEffect` return functions
- Proper dependency arrays for effect hooks
- Passive event listeners where appropriate

***

## **7. Styling Architecture**

### 7.1 SCSS Modules

**Component Scoping:**
Each component has its own `.module.scss` file, providing:
- Automatic class name hashing for uniqueness
- No global namespace pollution
- Co-located styles with components

### 7.2 Global Styles

**Structure:**
- `_variables.scss`: Color palette, spacing scale, typography
- `_utils.scss`: Utility classes and mixins (flexbox helpers, etc.)
- `_elements.scss`: Base element styles (body, html, buttons)
- `index.scss`: Entry point importing all global styles

### 7.3 Design System

**Variables:**
- Colors: Primary, secondary, backgrounds, text colors
- Spacing: Consistent scale (4px, 8px, 16px, 24px, 32px, 48px)
- Typography: Font families, sizes, weights
- Borders: Radius values, border widths

***

## **8. Type System**

### 8.1 Shared Types

Defined in `types.ts`:
```typescript
export interface LogEntry {
  timestamp: number;
  action: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface ViewState {
  zoom: number;
  pan: Position;
}
```

### 8.2 TypeScript Configuration

**Strict Mode Features:**
- `strict: true`: Enables all strict type checking
- `noUnusedLocals: true`: Errors on unused variables
- `noUnusedParameters: true`: Errors on unused parameters
- `noFallthroughCasesInSwitch: true`: Errors on switch fallthrough

**Separate Configs:**
- `tsconfig.json`: Base configuration
- `tsconfig.app.json`: Application source code
- `tsconfig.node.json`: Vite configuration and Node.js code

***

## **9. Build System**

### 9.1 Vite Configuration

**Features:**
- React plugin with Fast Refresh (HMR)
- TypeScript compilation
- SCSS preprocessing
- Production optimizations (minification, tree-shaking)

**Development:**
- Hot Module Replacement (HMR) for instant updates
- Fast cold start and rebuild times
- Optimized dependency pre-bundling

**Production:**
- Minified output
- Code splitting
- Tree-shaking for smaller bundles
- Asset optimization

### 9.2 Linting

**ESLint Configuration:**
- Flat config format (eslint.config.js)
- TypeScript-aware rules
- React hooks rules
- React Refresh rules for HMR

***

## **10. Design Patterns**

### 10.1 Custom Hooks

- `useLog`: Encapsulates LogContext consumption with error handling

### 10.2 Composition

- Components composed via props and children
- Context providers for cross-cutting concerns

### 10.3 Immutability

- State updates use immutable patterns
- Spread operators for object/array updates

### 10.4 Separation of Concerns

- Logic: Component files (`.tsx`)
- Styles: Module SCSS files (`.module.scss`)
- Types: Shared type definitions (`types.ts`)
- Context: Separate context providers

***

## **11. Future Enhancements**

Potential improvements for production deployment:

1. **Multi-layer Support**: Handle multiple plan layers/overlays
2. **Measurement Tools**: Distance and area measurement
3. **Annotations**: Add markers, notes, and drawings
4. **Touch Support**: Mobile gesture handling
5. **Keyboard Shortcuts**: Accessibility and power user features
6. **Export Functionality**: Save view state or screenshots
7. **Collaborative Features**: Real-time multi-user viewing
8. **Backend Integration**: Load plans from API
9. **Authentication**: User management and permissions
10. **Plan Comparison**: Side-by-side or overlay comparison
