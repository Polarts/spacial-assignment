# 2D Plan Viewer - Frontend Application

An interactive 2D plan viewing application with zoom, pan, and real-time action logging capabilities. Built as a technical demonstration of React state management, mouse event handling, and component composition.

## 🚀 Features

- **Interactive Zoom & Pan**: Smooth zoom using mouse wheel with cursor-fixed zooming
- **Intuitive Controls**: Click and drag to pan, double-click to reset view
- **Real-time Action Logging**: All user interactions are logged with timestamps
- **Responsive Design**: Clean, modern UI built with SCSS modules
- **Type-Safe**: Full TypeScript implementation with strict type checking

## 🛠️ Tech Stack

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

## 📚 Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Setup and getting started
- **[Architecture](Architecture.md)** - Detailed technical architecture and design patterns

## 🚦 Getting Started

See the [Quick Start Guide](QUICKSTART.md) for detailed setup instructions.

**Quick Overview:**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The application will be available at `http://localhost:5173`

## 📝 Usage

1. **Zoom**: Use mouse wheel to zoom in/out
2. **Pan**: Click and drag to move the plan
3. **Reset**: Double-click or press the Reset button to restore default view
4. **View Log**: All actions are automatically logged in the right panel
5. **Clear Log**: Click the Clear button to reset the action history

## 🎯 Key Implementation Highlights

### Zoom Implementation
- **Cursor-fixed zooming**: Zoom maintains the point under the cursor
- **Zoom limits**: Constrained between 25% and 500%
- **Smooth interpolation**: Uses multiplicative delta for consistent feel

### Pan Implementation
- **State tracking**: Monitors mouse down, move, and up events
- **Visual feedback**: Cursor changes between `grab` and `grabbing`
- **Boundary-free**: Allows unlimited panning for flexibility

### Performance Optimizations
- **CSS Transforms**: Uses `transform: translate() scale()` for GPU acceleration
- **Event Handler Memoization**: `useCallback` prevents unnecessary re-renders
- **Ref-based DOM Access**: Direct DOM manipulation where appropriate

For detailed architecture information, see [Architecture.md](Architecture.md).

## 📄 License

Private project - All rights reserved

## 🤝 Contributing

This is a technical demonstration project. For inquiries, please contact the repository owner.
