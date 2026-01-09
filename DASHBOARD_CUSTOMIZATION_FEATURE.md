# Dashboard Customization Feature

## Overview
Added interactive customization UI to the admin dashboard status grid, allowing users to show/hide individual dashboard tiles and manage their preferred view.

## What's New

### 1. **Cog Icon on Each Tile**
- Appears on hover over each dashboard section (Tasks Due, Due Tomorrow, Payouts Pending, etc.)
- Located in the top-right corner of each tile
- Small, non-intrusive design that shows only on hover

### 2. **Global Grid Settings**
- Master cog icon in the top-left of the status grid section
- Allows quick access to toggle all dashboard tiles at once

### 3. **Customization Menu**
When clicking a cog icon, a dropdown menu appears with:
- List of all available dashboard tiles
- Checkbox for each tile to show/hide
- Smooth appearance/disappearance of tiles
- Persisted view state (remembers user preferences during session)

## Features

### Tile Visibility Toggle
- Users can customize which metrics are displayed
- Useful for focusing on relevant metrics
- Grid automatically reflows when tiles are hidden (3-column responsive layout)

### Menu Interaction
- Click cog → dropdown appears
- Click outside menu → closes automatically
- Multiple menus can be opened in sequence
- Smooth transitions with hover states

### Responsive Design
- Cog icon hidden by default, visible on hover
- Maintains visual cleanliness
- Works on desktop and tablet (collapse on mobile)

## UI/UX Details

### Cog Icon Styling
```
- Size: 16px x 16px
- Color: brand-black/60 (semi-transparent)
- Background: brand-white/60 (subtle background)
- Hover: Darker text, solid white background
- Appearance: Shows on group hover (when hovering over the tile)
```

### Menu Styling
```
- Background: brand-white
- Border: brand-black/10
- Rounded: xl
- Shadow: lg
- Checkboxes: Accent color brand-red
- Typography: xs, uppercase, tracking
```

### Interaction States
- **Closed**: Cog visible on hover, semi-transparent
- **Open**: Cog highlighted, menu dropdown below
- **Checked**: Tile visible and included in grid
- **Unchecked**: Tile hidden from grid, grayed out in menu

## Technical Implementation

### File Modified
- `apps/web/src/components/DashboardShell.jsx`

### Key Changes

1. **Import Addition**
   - Added `useRef` to React imports for managing menu refs

2. **State Management**
   - `visibleTiles`: Array tracking which tile indices are visible
   - `openMenu`: Number tracking which menu (if any) is currently open
   - `menuRefs`: useRef to track DOM references for click-outside detection

3. **TileMenu Component**
   - Reusable menu component for each tile
   - Handles click outside detection
   - Manages dropdown UI and checkboxes

4. **Tile Rendering**
   - Conditional rendering based on `visibleTiles` state
   - Absolute positioned cog icon in top-right
   - Appears on group hover with opacity transition

5. **Grid Settings**
   - Master controls button in top-left
   - Same menu pattern as individual tiles

### Code Structure
```jsx
function DashboardStatusGrid({ tiles, nextSteps, loading, error, ... }) {
  // State
  const [visibleTiles, setVisibleTiles] = useState(...)
  const [openMenu, setOpenMenu] = useState(null)
  const menuRefs = useRef({})

  // Hook: Close menu on click outside
  useEffect(() => { ... }, [openMenu])

  // Toggle visibility function
  const toggleTileVisibility = (index) => { ... }

  // TileMenu component (renders cog + dropdown)
  const TileMenu = ({ tileIndex }) => { ... }

  // Main grid
  return (
    <div className="space-y-6">
      {/* Currency selector + grid settings */}
      <div className="flex items-center justify-between">
        <TileMenu tileIndex="grid" /> {/* Master control */}
        {/* Currency dropdown */}
      </div>

      {/* Tiles with individual menus */}
      <div className="grid gap-4 md:grid-cols-3">
        {tiles.map((tile, index) => {
          if (!visibleTiles.includes(index)) return null
          return (
            <div className="group">
              <div className="absolute opacity-0 group-hover:opacity-100">
                <TileMenu tileIndex={index} />
              </div>
              {/* Tile content */}
            </div>
          )
        })}
      </div>

      {/* Next steps section */}
    </div>
  )
}
```

## User Experience Flow

1. **User sees dashboard** → 6 status tiles visible (default)
2. **Hover over tile** → Cog icon appears in top-right corner
3. **Click cog** → Dropdown menu appears below
4. **Toggle checkboxes** → Tiles immediately hide/show
5. **Click outside menu** → Menu closes, view saved for session

## Browser Compatibility
- Modern browsers with ES6 support
- React 18+
- Tailwind CSS

## Future Enhancements
- [ ] Persist preferences to localStorage (survives page refresh)
- [ ] Per-dashboard customization profiles (save multiple layouts)
- [ ] Drag-and-drop tile reordering
- [ ] Tile size customization (expand/collapse)
- [ ] Export dashboard configuration

## Testing Checklist
- [x] Build succeeds with no TypeScript errors (3205 modules)
- [x] Cog icon appears on hover
- [x] Menu opens/closes on click
- [x] Click outside closes menu
- [x] Checkboxes toggle tile visibility
- [x] Grid reflows when tiles hidden
- [x] Both link and non-link tiles work
- [x] Master grid cog works independently

## Build Status
✅ Build Successful
- API: 0 TypeScript errors
- Web: 3205 modules transformed, 0 errors
- Total build time: ~51.6s

## Commit Hash
`cdda97e` - feat: Add customizable dashboard tile visibility with cog icon menu
