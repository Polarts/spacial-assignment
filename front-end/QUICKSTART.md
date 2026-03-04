# Quick Start Guide - 2D Plan Viewer

## Prerequisites

- **Node.js** 18+ (20.x recommended)
- **npm** or **yarn** package manager
- Modern web browser (Chrome, Firefox, Safari, or Edge)

***

## **Installation**

### 1. Navigate to the Frontend Directory

```bash
cd front-end
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- React and React DOM
- TypeScript
- Vite and plugins
- SCSS/Sass
- ESLint and plugins

***

## **Development**

### Start Development Server

```bash
npm run dev
```

This will:
- Start the Vite development server
- Enable Hot Module Replacement (HMR)
- Open the application at `http://localhost:5173`

**Expected Output:**
```
  VITE v7.3.1  ready in 423 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

***

## **Building for Production**

### Type Check and Build

```bash
npm run build
```

This will:
1. Run TypeScript type checking
2. Build optimized production bundle
3. Output to `dist/` directory

**Build Output:**
- Minified JavaScript bundles
- Optimized CSS
- Compressed assets
- Source maps (for debugging)

### Preview Production Build

```bash
npm run preview
```

This serves the production build locally at `http://localhost:4173` for testing.

***

## **Code Quality**

### Run Linter

```bash
npm run lint
```

This runs ESLint with:
- TypeScript-aware rules
- React hooks validation
- React Refresh rules

***

## **Usage Guide**

### Basic Controls

1. **Zoom In/Out**
   - Use **mouse wheel** to zoom
   - Scroll up = zoom in
   - Scroll down = zoom out
   - Zoom range: 25% to 500%

2. **Pan the View**
   - **Click and drag** anywhere on the plan
   - Cursor changes from `grab` to `grabbing` while panning
   - No boundaries - pan freely in any direction

3. **Reset View**
   - **Double-click** anywhere on the plan, or
   - Click the **Reset** button in the header
   - Resets zoom to 100% and centers the plan

4. **View Action Log**
   - All interactions appear in the right panel
   - Shows timestamp and action type
   - Color-coded for different actions

5. **Clear Log**
   - Click **Clear** button to reset action history

### Action Types

The log tracks these interactions:
- 🔍 **Zoom In** - Zoomed in via mouse wheel
- 🔍 **Zoom Out** - Zoomed out via mouse wheel
- 🖐️ **Pan** - Moved the view by dragging
- 🔄 **Reset** - Restored default view

***

## **Project Scripts**

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start development server with HMR |
| `build` | `tsc -b && vite build` | Type-check and build for production |
| `preview` | `vite preview` | Preview production build locally |
| `lint` | `eslint .` | Run ESLint on source code |

***

## **Configuration Files**

### TypeScript

- **`tsconfig.json`** - Base TypeScript configuration
- **`tsconfig.app.json`** - Application source code settings
- **`tsconfig.node.json`** - Vite config and Node.js code settings

### Vite

- **`vite.config.ts`** - Vite bundler configuration
  - React plugin enabled
  - Defines root and build directories

### ESLint

- **`eslint.config.js`** - Linting rules and plugins
  - Flat config format
  - TypeScript and React rules enabled

### Package Management

- **`package.json`** - Dependencies and scripts

***

## **Troubleshooting**

### Port Already in Use

If port 5173 is occupied:

```bash
npm run dev -- --port 3000
```

Or edit `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 3000
  }
})
```

### Module Not Found Errors

Clear node modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

Verify TypeScript installation:

```bash
npm list typescript
```

Run type checking separately:

```bash
npx tsc --noEmit
```

### Build Fails

1. Check Node.js version:
   ```bash
   node --version  # Should be 18+
   ```

2. Clear Vite cache:
   ```bash
   rm -rf node_modules/.vite
   ```

3. Rebuild:
   ```bash
   npm run build
   ```

### HMR Not Working

1. Check browser console for errors
2. Restart development server
3. Clear browser cache
4. Check file watchers limit (Linux/Mac):
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

***

## **Development Tips**

### Fast Refresh

Vite provides instant HMR:
- Edit `.tsx` files → see changes immediately
- Edit `.scss` files → styles update without reload
- State is preserved during HMR when possible

### Browser DevTools

**React DevTools:**
- Install browser extension for React component inspection
- View component hierarchy and props
- Track re-renders and performance

**Console Logging:**
- Check browser console for runtime errors
- Use React DevTools Profiler for performance analysis

### VS Code Extensions (Recommended)

- **ESLint** - Inline linting
- **TypeScript** - Language support (built-in)
- **Sass** - SCSS syntax highlighting
- **Vite** - Vite-specific features
- **React Developer Tools** - Component inspection

***

## **Next Steps**

1. Explore the codebase in `src/`
2. Review [Architecture.md](Architecture.md) for detailed design
3. Check [README.md](README.md) for feature overview
4. Modify components and see live updates
5. Add your own features or styles

***

## **Getting Help**

- Review the [Architecture documentation](Architecture.md)
- Check [Vite documentation](https://vitejs.dev/)
- Review [React documentation](https://react.dev/)
- Inspect browser console for errors
