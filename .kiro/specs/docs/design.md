Design Guide
## Compact Layout & Color Scheme Reference



---

## Quick Reference

### Essential Theme Colors
```typescript
// Import and declare
import { useTheme } from '@mui/material';
const theme = useTheme();

// Primary colors (ALWAYS use theme)
theme.palette.primary.main           // Headers, borders, icons, links
theme.palette.primary.light          // Light backgrounds
`${theme.palette.primary.light}15`   // 15% opacity backgrounds
theme.palette.text.primary           // Main text
theme.palette.text.secondary         // Secondary text

// Semantic colors (hardcoded)
'#e8f5e8' / '#2e7d32'  // Success/Green
'#fff3e0' / '#f57c00'  // Warning/Orange
'#ffebee' / '#d32f2f'  // Error/Red

// Standard backgrounds (hardcoded)
'grey.50'    // Page background
'#f8f9fa'    // Card backgrounds
'white'      // Table, dialogs
'divider'    // Borders
```

### Key Measurements
- **Chip height**: 28px (summary), 24px (table)
- **Input height**: 32px
- **Font sizes**: 0.75rem (body), 0.875rem (subtitle), 1.25rem (title)
- **Padding**: 1.5 (sections), 6px 8px (cells)
- **Border radius**: 1.5 (cards)
- **Icon sizes**: 28px (header), 16px (buttons), 18px (actions)

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Theme Implementation Guide](#theme-implementation-guide)
4. [Layout Structure](#layout-structure)
5. [Component Specifications](#component-specifications)
6. [Typography Scale](#typography-scale)
7. [Spacing System](#spacing-system)
8. [Implementation Examples](#implementation-examples)

---

## Design Philosophy

### Core Principles
- **Information Density**: Maximize visible data without overwhelming users
- **Minimal Scrolling**: Optimize vertical space to show 40-50% more content
- **Consistent Hierarchy**: Clear visual structure with reduced spacing
- **Professional Aesthetics**: Clean, modern appearance with subtle gradients
- **Full Width Utilization**: Use entire viewport width effectively

### Key Metrics
- **Vertical Space Saved**: ~200-250px per page
- **More Visible Rows**: 40-50% increase in table rows without scrolling
- **Header Reduction**: ~40% smaller than standard layout
- **Table Density**: ~30% more compact per row

---

## Color Palette

> **IMPORTANT**: Always use `theme.palette` references instead of hardcoded color values for primary colors. This ensures consistency across the application and supports future theme switching.

### Theme Integration (Required)
```typescript
import { useTheme } from '@mui/material';

const MyComponent = () => {
  const theme = useTheme();
  
  // Now you can use theme.palette.primary.main, etc.
}
```

### Primary Colors (Theme-Based)
```typescript
// Main Brand Color - ALWAYS use theme reference
primary.main: theme.palette.primary.main  // Used for headers, primary actions, borders
primary.light: theme.palette.primary.light  // Light variant for backgrounds

// Primary Color with Opacity
primary.light15: `${theme.palette.primary.light}15`  // 15% opacity for subtle backgrounds

// Text Colors
text.primary: theme.palette.text.primary  // Main text color (#2c3e50 or similar)
text.secondary: theme.palette.text.secondary  // Secondary text, descriptions
text.disabled: theme.palette.text.disabled  // Disabled states

// Background Colors (Hardcoded - Standard across app)
background.page: 'grey.50'  // #fafafa - Main page background (lighter than grey.100)
background.card: '#f8f9fa'  // Summary cards, analytics sections
background.white: '#ffffff'  // Table, dialog backgrounds
background.gradient: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, #ffffff 100%)`
```

### When to Use Theme vs Hardcoded Colors

**✅ ALWAYS Use Theme Colors For:**
- Primary brand colors → `theme.palette.primary.main`
- Light backgrounds → `${theme.palette.primary.light}15`
- Text colors → `theme.palette.text.primary`
- Interactive elements (buttons, links)
- Table headers
- Icon containers
- Primary borders

**✅ Use Hardcoded Colors For:**
- Semantic status colors (success, warning, error)
- Standard background shades (grey.50, #f8f9fa)
- Specific UI states that shouldn't change with theme
- Standard Material Design colors

### Status Colors (Semantic - Hardcoded)
> **Note**: These colors are hardcoded as they represent semantic meaning that should remain consistent regardless of theme.

```typescript
// Status Indicators with Semantic Meaning
status.draft: {
  background: 'default',  // Grey (Material-UI default)
  icon: <DraftIcon />
}

status.pending: {
  background: '#fff3e0',  // Light orange background
  color: '#f57c00',       // Orange text (#f57c00)
  icon: <PendingIcon />
}

status.accepted: {
  background: '#e8f5e8',  // Light green background
  color: '#2e7d32',       // Green text (#2e7d32)
  icon: <ApproveIcon />
}

status.rejected: {
  background: '#ffebee',  // Light red background
  color: '#d32f2f',       // Red text (#d32f2f)
  icon: <RejectIcon />
}

status.completed: {
  background: 'info',     // Blue (Material-UI info)
  icon: <ApproveIcon />
}

status.cancelled: {
  background: 'secondary', // Grey (Material-UI secondary)
  icon: <RejectIcon />
}

// Urgent/Hot Status (for high priority items)
status.urgent: {
  background: '#d32f2f',  // Red background
  hover: '#b71c1c',       // Darker red for hover
  color: 'white'
}
```

### Chip Colors (Summary Cards)
```typescript
// Total Count Chip (Uses Theme)
chip.total: {
  bgcolor: `${theme.palette.primary.light}15`,  // 15% opacity of primary light
  color: theme.palette.primary.main,
  fontWeight: 600,
  height: 28,
  fontSize: '0.75rem',
  iconColor: theme.palette.primary.main,
  iconSize: 16
}

// Accepted/Approved Chip (Semantic Green)
chip.accepted: {
  bgcolor: '#e8f5e8',  // Light green
  color: '#2e7d32',    // Dark green
  fontWeight: 600,
  height: 28,
  fontSize: '0.75rem',
  iconColor: '#2e7d32',
  iconSize: 16
}

// Pending Chip (Semantic Orange)
chip.pending: {
  bgcolor: '#fff3e0',  // Light orange
  color: '#f57c00',    // Dark orange
  fontWeight: 600,
  height: 28,
  fontSize: '0.75rem',
  iconColor: '#f57c00',
  iconSize: 16
}

// Rejected Chip (Semantic Red)
chip.rejected: {
  bgcolor: '#ffebee',  // Light red
  color: '#d32f2f',    // Dark red
  fontWeight: 600,
  height: 28,
  fontSize: '0.75rem',
  iconColor: '#d32f2f',
  iconSize: 16
}

// Value/Amount Chip (Uses Theme)
chip.value: {
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  fontWeight: 600,
  height: 28,
  fontSize: '0.75rem'
}

// Info/Secondary Chips
chip.info: {
  color: 'info',
  fontWeight: 600,
  height: 28,
  fontSize: '0.75rem'
}
```

### Border Colors
```typescript
borders: {
  divider: 'divider',                      // Standard divider color (Material-UI)
  primary: theme.palette.primary.main,     // For header bottom border (2px solid)
  card: 'divider',                         // Card borders (1px solid)
  table: 'none'                            // Table cells have no borders
}
```

### Text Colors (Theme-Based)
```typescript
text: {
  primary: theme.palette.text.primary,     // Main headings, body text
  secondary: theme.palette.text.secondary, // Subtitles, descriptions
  disabled: theme.palette.text.disabled    // Disabled states
}

// Special text colors (context-specific)
text.special: {
  link: theme.palette.primary.main,        // Links, IDs, clickable text
  success: '#2e7d32',                      // Success messages, positive values
  warning: '#f57c00',                      // Warning messages
  error: '#d32f2f'                         // Error messages, negative values
}
```

### Hover & Interaction Colors
```typescript
hover: {
  tableRow: 'rgba(25, 118, 210, 0.04)',   // Table row hover (4% opacity)
  button: 'rgba(25, 118, 210, 0.08)',     // Button hover (8% opacity)
  iconButton: 'rgba(0, 0, 0, 0.04)'       // Icon button hover
}

alternating: {
  evenRow: 'rgba(0, 0, 0, 0.02)'          // Even table rows (2% opacity)
}
```

### Transparency Values Reference
```typescript
opacity: {
  subtle: '15',      // 15% - For subtle backgrounds (${theme.palette.primary.light}15)
  hover: '0.04',     // 4% - For hover effects on light backgrounds
  hoverDark: '0.08', // 8% - For hover effects on buttons
  stripe: '0.02'     // 2% - For alternating row backgrounds
}
```

---

## Theme Implementation Guide

### Step 1: Import useTheme Hook
```typescript
import { useTheme } from '@mui/material';
```

### Step 2: Declare Theme in Component
```typescript
const MyComponent = () => {
  const theme = useTheme();
  
  // Now you can access:
  // - theme.palette.primary.main
  // - theme.palette.primary.light
  // - theme.palette.text.primary
  // - theme.palette.text.secondary
  // etc.
}
```

### Step 3: Use Theme Colors in Styles
```typescript
// ✅ CORRECT - Using theme
<Box sx={{
  borderColor: theme.palette.primary.main,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.text.primary,
  background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, #ffffff 100%)`,
}}>

// ❌ INCORRECT - Hardcoded colors
<Box sx={{
  borderColor: '#1565c0',
  backgroundColor: '#1565c0',
  color: '#2c3e50',
  background: 'linear-gradient(135deg, #e3f2fd15 0%, #ffffff 100%)',
}}>
```

### Complete Color Usage Examples

#### Header Section
```typescript
<Box sx={{
  borderBottom: '2px solid',
  borderColor: theme.palette.primary.main,  // ✅ Theme-based
  background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, #ffffff 100%)`,  // ✅ Theme-based
}}>
  <Box sx={{
    backgroundColor: theme.palette.primary.main,  // ✅ Theme-based
  }}>
    <Icon sx={{ color: 'white' }} />  // ✅ White is standard
  </Box>
  <Typography sx={{
    color: theme.palette.text.primary,  // ✅ Theme-based
  }}>
    Title
  </Typography>
</Box>
```

#### Summary Chips
```typescript
// Total chip - uses theme
<Chip
  sx={{
    bgcolor: `${theme.palette.primary.light}15`,  // ✅ Theme-based
    color: theme.palette.primary.main,             // ✅ Theme-based
    '& .MuiChip-icon': { 
      color: theme.palette.primary.main            // ✅ Theme-based
    }
  }}
/>

// Status chips - use semantic colors
<Chip
  sx={{
    bgcolor: '#e8f5e8',  // ✅ Semantic green (hardcoded)
    color: '#2e7d32',    // ✅ Semantic green (hardcoded)
  }}
/>
```

#### Table Headers
```typescript
<TableCell sx={{
  backgroundColor: theme.palette.primary.main,  // ✅ Theme-based
  color: 'white',                               // ✅ White is standard
}}>
```

#### Table Body
```typescript
<TableRow sx={{
  '&:hover': { 
    backgroundColor: 'rgba(25, 118, 210, 0.04)'  // ✅ Hover effect (hardcoded)
  },
  '&:nth-of-type(even)': { 
    backgroundColor: 'rgba(0, 0, 0, 0.02)'       // ✅ Stripe effect (hardcoded)
  }
}}>
  <TableCell>
    <Typography sx={{
      color: theme.palette.primary.main  // ✅ Theme-based for links/IDs
    }}>
      ID-001
    </Typography>
  </TableCell>
</TableRow>
```

### Color Decision Tree

```
Is it a primary brand color?
├─ YES → Use theme.palette.primary.main or theme.palette.primary.light
└─ NO → Is it a semantic status color?
    ├─ YES → Use hardcoded semantic color (#e8f5e8, #fff3e0, #ffebee, etc.)
    └─ NO → Is it a standard background/text?
        ├─ YES → Use Material-UI standard (grey.50, white, divider, etc.)
        └─ NO → Is it a hover/interaction effect?
            └─ YES → Use rgba with appropriate opacity
```

---

## Layout Structure

### Page Container
```tsx
<Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 1.5 }}>
  <Container maxWidth={false} sx={{ px: 2 }}>
    {/* Content */}
  </Container>
</Box>
```

**Key Properties**:
- `maxWidth={false}`: Full width utilization
- `px: 2`: Horizontal padding (16px)
- `py: 1.5`: Vertical padding (12px)
- `bgcolor: 'grey.50'`: Light background

### Section Hierarchy
```
1. Header Section (Ultra Compact)
   ├── Icon + Title + Subtitle
   └── Action Buttons

2. Summary Cards (Compact)
   └── Status Chips in horizontal row

3. Custom Analytics (Optional)
   └── Progress bars, charts, metrics

4. Search & Filter (Inline)
   └── Search field + Filter dropdown

5. Data Table (Optimized)
   ├── Table Header
   ├── Table Body (scrollable)
   └── Pagination
```

---

## Component Specifications

### 1. Header Section

#### Container
```tsx
<Box sx={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mb: 1.5,                    // Margin bottom: 12px
  pb: 1,                      // Padding bottom: 8px
  borderBottom: '2px solid',
  borderColor: theme.palette.primary.main,
  background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, #ffffff 100%)`
}}>
```

#### Icon Container
```tsx
<Box sx={{
  p: 1,                       // Padding: 8px
  borderRadius: 1.5,          // Border radius: 12px
  backgroundColor: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
  <Icon sx={{ fontSize: 28, color: 'white' }} />
</Box>
```

#### Title Typography
```tsx
<Typography variant="h5" sx={{
  fontWeight: 700,
  mb: 0,
  color: '#2c3e50',
  fontSize: '1.25rem',        // 20px
  lineHeight: 1.2
}}>
  {documentTitle}
</Typography>
```

#### Subtitle Typography
```tsx
<Typography variant="caption" sx={{
  color: 'text.secondary',
  fontSize: '0.75rem'         // 12px
}}>
  {description}
</Typography>
```

### 2. Summary Cards

#### Container
```tsx
<Box sx={{
  display: 'flex',
  gap: 1,                     // Gap: 8px
  mb: 1.5,                    // Margin bottom: 12px
  flexWrap: 'wrap',
  p: 1.5,                     // Padding: 12px
  backgroundColor: '#f8f9fa',
  borderRadius: 1.5,          // Border radius: 12px
  border: '1px solid',
  borderColor: 'divider'
}}>
```

#### Chip Specifications
```tsx
<Chip
  icon={<Icon />}
  label="Text"
  size="small"
  sx={{
    bgcolor: '#color',
    color: '#color',
    fontWeight: 600,
    height: 28,               // Fixed height: 28px
    fontSize: '0.75rem',      // 12px
    '& .MuiChip-icon': { 
      color: '#color', 
      fontSize: 16            // Icon size: 16px
    }
  }}
/>
```

### 3. Search & Filter Section

#### Container
```tsx
<Box sx={{
  display: 'flex',
  gap: 1.5,                   // Gap: 12px
  mb: 1.5,                    // Margin bottom: 12px
  p: 1.5,                     // Padding: 12px
  backgroundColor: '#f8f9fa',
  borderRadius: 1.5,
  border: '1px solid',
  borderColor: 'divider'
}}>
```

#### Search Field
```tsx
<TextField
  size="small"
  placeholder="Search..."
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <SearchIcon sx={{ fontSize: 18 }} />
      </InputAdornment>
    ),
    sx: { 
      height: 32,             // Fixed height: 32px
      fontSize: '0.75rem'     // 12px
    }
  }}
/>
```

### 4. Data Table

#### Table Container
```tsx
<TableContainer sx={{
  maxHeight: 'calc(100vh - 320px)',  // Dynamic height based on viewport
  overflow: 'auto',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1.5
}}>
```

#### Table Component
```tsx
<Table 
  stickyHeader 
  size="small"                // Compact table size
  sx={{ minWidth: 1200 }}
>
```

#### Table Header Cells
```tsx
<TableCell sx={{
  fontWeight: 700,
  fontSize: '0.75rem',        // 12px
  p: '6px 8px',               // Padding: 6px vertical, 8px horizontal
  bgcolor: 'grey.100',
  borderBottom: '2px solid',
  borderColor: 'divider',
  whiteSpace: 'nowrap'
}}>
```

#### Table Body Cells
```tsx
<TableCell sx={{
  fontSize: '0.75rem',        // 12px
  p: '6px 8px',               // Padding: 6px vertical, 8px horizontal
  verticalAlign: 'middle'
}}>
```

#### Checkbox
```tsx
<Checkbox
  size="small"
  sx={{ p: 0 }}               // No padding
/>
```

#### Icon Buttons
```tsx
<IconButton 
  size="small" 
  sx={{ p: 0.5 }}             // Padding: 4px
>
  <Icon sx={{ fontSize: 18 }} />
</IconButton>
```

#### Status Chips (in table)
```tsx
<Chip
  icon={<StatusIcon />}
  label="Status"
  size="small"
  sx={{
    height: 24,               // Fixed height: 24px
    fontSize: '0.7rem',       // 11.2px
    fontWeight: 600,
    '& .MuiChip-icon': { 
      fontSize: 14            // Icon size: 14px
    }
  }}
/>
```

### 5. Pagination

#### Container
```tsx
<TablePagination
  component="div"
  rowsPerPageOptions={[10, 25, 50, 100]}
  sx={{
    '.MuiTablePagination-toolbar': {
      minHeight: 40,          // Toolbar height: 40px
      padding: '4px 12px'     // Reduced padding
    },
    '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
      fontSize: '0.75rem',    // 12px
      m: 0
    },
    '.MuiTablePagination-select': {
      fontSize: '0.75rem'     // 12px
    },
    '.MuiIconButton-root': {
      padding: '4px',
      '& .MuiSvgIcon-root': {
        fontSize: 16          // Icon size: 16px
      }
    }
  }}
/>
```

### 6. Action Buttons

#### Primary Action Button
```tsx
<Button
  variant="contained"
  size="small"
  startIcon={<Icon sx={{ fontSize: 16 }} />}
  sx={{
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.75rem',      // 12px
    py: 0.5,                  // Vertical padding: 4px
    px: 1.5                   // Horizontal padding: 12px
  }}
>
  Action
</Button>
```

#### Secondary Action Button
```tsx
<Button
  variant="outlined"
  size="small"
  startIcon={<Icon sx={{ fontSize: 16 }} />}
  sx={{
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.75rem',      // 12px
    py: 0.5,                  // Vertical padding: 4px
    px: 1.5                   // Horizontal padding: 12px
  }}
>
  Action
</Button>
```

---

## Typography Scale

### Heading Hierarchy
```typescript
// Page Title
h5: {
  fontSize: '1.25rem',        // 20px
  fontWeight: 700,
  lineHeight: 1.2,
  color: '#2c3e50'
}

// Section Title
subtitle2: {
  fontSize: '0.875rem',       // 14px
  fontWeight: 600,
  color: 'text.primary'
}

// Subtitle/Description
caption: {
  fontSize: '0.75rem',        // 12px
  color: 'text.secondary'
}

// Body Text (Table, Forms)
body2: {
  fontSize: '0.75rem',        // 12px
  color: 'text.primary'
}

// Small Text (Chips, Labels)
small: {
  fontSize: '0.7rem',         // 11.2px
  fontWeight: 600
}
```

---

## Spacing System

### Margin & Padding Scale
```typescript
spacing: {
  0: 0,
  0.5: '4px',
  1: '8px',
  1.5: '12px',
  2: '16px',
  2.5: '20px',
  3: '24px'
}

// Usage in Commercial Module
compact: {
  section.mb: 1.5,            // 12px between sections
  card.p: 1.5,                // 12px card padding
  header.py: 1.5,             // 12px header vertical padding
  header.mb: 1.5,             // 12px header margin bottom
  chip.gap: 1,                // 8px gap between chips
  button.py: 0.5,             // 4px button vertical padding
  button.px: 1.5,             // 12px button horizontal padding
  table.cell.p: '6px 8px',    // 6px vertical, 8px horizontal
  icon.button.p: 0.5          // 4px icon button padding
}
```

### Border Radius Scale
```typescript
borderRadius: {
  small: 1,                   // 8px
  medium: 1.5,                // 12px
  large: 2                    // 16px
}

// Usage
card: 1.5,                    // 12px
button: 1,                    // 8px (default)
chip: 16,                     // 16px (default)
iconContainer: 1.5            // 12px
```

---

## Implementation Examples

### Example 1: Complete Header Implementation
```tsx
<Box sx={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mb: 1.5,
  pb: 1,
  borderBottom: '2px solid',
  borderColor: theme.palette.primary.main,
  background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, #ffffff 100%)`
}}>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Box sx={{
      p: 1,
      borderRadius: 1.5,
      backgroundColor: theme.palette.primary.main,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <ReceiptIcon sx={{ fontSize: 28, color: 'white' }} />
    </Box>
    <Box>
      <Typography variant="h5" sx={{
        fontWeight: 700,
        mb: 0,
        color: '#2c3e50',
        fontSize: '1.25rem',
        lineHeight: 1.2
      }}>
        Quotation Management
      </Typography>
      <Typography variant="caption" sx={{
        color: 'text.secondary',
        fontSize: '0.75rem'
      }}>
        Manage quotations, track client responses, and handle approvals
      </Typography>
    </Box>
  </Box>
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
    <Button
      variant="contained"
      size="small"
      startIcon={<AddIcon sx={{ fontSize: 16 }} />}
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.75rem',
        py: 0.5,
        px: 1.5
      }}
    >
      Create New
    </Button>
  </Box>
</Box>
```

### Example 2: Summary Cards with Status Chips
```tsx
<Box sx={{
  display: 'flex',
  gap: 1,
  mb: 1.5,
  flexWrap: 'wrap',
  p: 1.5,
  backgroundColor: '#f8f9fa',
  borderRadius: 1.5,
  border: '1px solid',
  borderColor: 'divider'
}}>
  <Chip
    icon={<ReceiptIcon />}
    label={`${totalCount} Total`}
    size="small"
    sx={{
      bgcolor: `${theme.palette.primary.light}15`,
      color: theme.palette.primary.main,
      fontWeight: 600,
      height: 28,
      fontSize: '0.75rem',
      '& .MuiChip-icon': { 
        color: theme.palette.primary.main, 
        fontSize: 16 
      }
    }}
  />
  <Chip
    icon={<ApproveIcon />}
    label={`${acceptedCount} Accepted`}
    size="small"
    sx={{
      bgcolor: '#e8f5e8',
      color: '#2e7d32',
      fontWeight: 600,
      height: 28,
      fontSize: '0.75rem',
      '& .MuiChip-icon': { 
        color: '#2e7d32', 
        fontSize: 16 
      }
    }}
  />
  <Chip
    icon={<PendingIcon />}
    label={`${pendingCount} Pending`}
    size="small"
    sx={{
      bgcolor: '#fff3e0',
      color: '#f57c00',
      fontWeight: 600,
      height: 28,
      fontSize: '0.75rem',
      '& .MuiChip-icon': { 
        color: '#f57c00', 
        fontSize: 16 
      }
    }}
  />
  <Chip
    icon={<RejectIcon />}
    label={`${rejectedCount} Rejected`}
    size="small"
    sx={{
      bgcolor: '#ffebee',
      color: '#d32f2f',
      fontWeight: 600,
      height: 28,
      fontSize: '0.75rem',
      '& .MuiChip-icon': { 
        color: '#d32f2f', 
        fontSize: 16 
      }
    }}
  />
</Box>
```

### Example 3: Compact Data Table
```tsx
<TableContainer sx={{
  maxHeight: 'calc(100vh - 320px)',
  overflow: 'auto',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1.5
}}>
  <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox" sx={{ p: '6px 8px' }}>
          <Checkbox size="small" sx={{ p: 0 }} />
        </TableCell>
        <TableCell sx={{
          fontWeight: 700,
          fontSize: '0.75rem',
          p: '6px 8px',
          bgcolor: 'grey.100',
          borderBottom: '2px solid',
          borderColor: 'divider'
        }}>
          Document No
        </TableCell>
        <TableCell sx={{
          fontWeight: 700,
          fontSize: '0.75rem',
          p: '6px 8px',
          bgcolor: 'grey.100',
          borderBottom: '2px solid',
          borderColor: 'divider'
        }}>
          Status
        </TableCell>
        {/* More columns */}
      </TableRow>
    </TableHead>
    <TableBody>
      {data.map((row) => (
        <TableRow key={row.id} hover>
          <TableCell padding="checkbox" sx={{ p: '6px 8px' }}>
            <Checkbox size="small" sx={{ p: 0 }} />
          </TableCell>
          <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
            {row.documentNo}
          </TableCell>
          <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
            <Chip
              icon={getStatusIcon(row.status)}
              label={row.status}
              size="small"
              color={getStatusColor(row.status)}
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 600,
                '& .MuiChip-icon': { fontSize: 14 }
              }}
            />
          </TableCell>
          {/* More cells */}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

### Example 4: Custom Analytics Section
```tsx
<Box sx={{
  p: 1.5,
  mb: 1.5,
  backgroundColor: '#f8f9fa',
  borderRadius: 1.5,
  border: '1px solid',
  borderColor: 'divider'
}}>
  <Typography variant="subtitle2" sx={{ 
    fontWeight: 600, 
    mb: 1.5, 
    color: theme.palette.text.primary, 
    fontSize: '0.875rem' 
  }}>
    Project Progress
  </Typography>
  {projects.map((project) => (
    <Box key={project.id} sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
          {project.name}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 'bold' }}>
          {project.progress}%
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={project.progress}
        color={getProgressColor(project.progress)}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
  ))}
</Box>
```

---

## Module-Specific Customizations

### BOQ Module
- **Additional Metrics**: Progress percentage, cost variance, earned value
- **Version Control**: Version number display, revision tracking
- **Analytics**: Progress bars for multiple projects
- **Custom Chips**: Approved count, In Progress count, Current Versions count

### Purchase Order Module
- **Vendor Information**: Vendor name, contact, email display
- **Delivery Tracking**: Goods received status, delivery date
- **Approval Workflow**: Approval status, three-way matching
- **Custom Chips**: Delivered count, Approved count, Rejected count

### Quotation Module
- **Client Information**: Client name, contact, email display
- **Validity Period**: Valid until date display
- **Response Tracking**: Client response status
- **Custom Chips**: Total count, Accepted count, Pending count, Rejected count

---

## Responsive Considerations

### Breakpoints
```typescript
// Adjust layout for different screen sizes
xs: 0,      // Extra small devices (phones)
sm: 600,    // Small devices (tablets)
md: 900,    // Medium devices (small laptops)
lg: 1200,   // Large devices (desktops)
xl: 1536    // Extra large devices (large desktops)
```

### Responsive Adjustments
```tsx
// Example: Stack chips vertically on small screens
<Box sx={{
  display: 'flex',
  gap: 1,
  flexWrap: 'wrap',
  flexDirection: { xs: 'column', sm: 'row' }  // Stack on mobile
}}>
```

---

## Accessibility Guidelines

### Color Contrast
- All text meets WCAG AA standards (4.5:1 for normal text)
- Status colors have sufficient contrast with backgrounds
- Icon colors match text colors for consistency

### Interactive Elements
- Minimum touch target size: 32px (buttons, checkboxes)
- Icon buttons have adequate padding: 4px minimum
- Hover states clearly indicate interactivity

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order follows logical flow
- Focus indicators are visible

---

## Best Practices

### DO ✅
- **ALWAYS** import and use `useTheme` hook for primary colors
- Use `theme.palette.primary.main` instead of hardcoded blue colors
- Use `theme.palette.text.primary` for main text colors
- Use semantic colors (#e8f5e8, #fff3e0, #ffebee) for status indicators
- Maintain the spacing scale (0.5, 1, 1.5, 2, etc.)
- Keep typography sizes consistent across similar elements
- Implement full-width containers with `maxWidth={false}`
- Use `calc(100vh - Xpx)` for dynamic table heights
- Add tooltips for truncated text
- Use sticky headers for long tables
- Test color consistency across different modules

### DON'T ❌
- **NEVER** hardcode primary brand colors (#1565c0, #e3f2fd, etc.)
- Don't skip the `useTheme` hook - it's required for consistency
- Don't use custom colors outside the defined palette
- Don't increase spacing beyond the compact specifications
- Don't mix different font sizes for the same element type
- Don't use full-width containers without horizontal padding
- Don't hardcode table heights (use viewport-relative values)
- Don't remove hover states from interactive elements
- Don't sacrifice accessibility for compactness

## Common Mistakes & Solutions

### ❌ Mistake 1: Hardcoded Primary Colors
```typescript
// WRONG
<Box sx={{ borderColor: '#1565c0' }}>
```
**Solution:**
```typescript
// CORRECT
const theme = useTheme();
<Box sx={{ borderColor: theme.palette.primary.main }}>
```

### ❌ Mistake 2: Forgetting Theme Import
```typescript
// WRONG - theme is undefined
<Box sx={{ color: theme.palette.primary.main }}>
```
**Solution:**
```typescript
// CORRECT
import { useTheme } from '@mui/material';

const MyComponent = () => {
  const theme = useTheme();
  return <Box sx={{ color: theme.palette.primary.main }}>
}
```

### ❌ Mistake 3: Using Theme for Semantic Colors
```typescript
// WRONG - semantic colors should be hardcoded
<Chip sx={{ bgcolor: theme.palette.success.light }}>
```
**Solution:**
```typescript
// CORRECT - use standard semantic colors
<Chip sx={{ bgcolor: '#e8f5e8', color: '#2e7d32' }}>
```

### ❌ Mistake 4: Incorrect Opacity Syntax
```typescript
// WRONG
<Box sx={{ bgcolor: theme.palette.primary.light + '15' }}>
```
**Solution:**
```typescript
// CORRECT - use template literal
<Box sx={{ bgcolor: `${theme.palette.primary.light}15` }}>
```

### ❌ Mistake 5: Mixing Old and New Patterns
```typescript
// WRONG - inconsistent color usage
<Box sx={{ 
  borderColor: theme.palette.primary.main,  // Theme-based ✓
  backgroundColor: '#1565c0'                 // Hardcoded ✗
}}>
```
**Solution:**
```typescript
// CORRECT - consistent theme usage
<Box sx={{ 
  borderColor: theme.palette.primary.main,
  backgroundColor: theme.palette.primary.main
}}>
```

---

## Migration Checklist

When applying this design to other modules:

### Theme Integration (CRITICAL)
- [ ] Import `useTheme` from '@mui/material'
- [ ] Declare `const theme = useTheme()` at component level
- [ ] Replace all hardcoded primary colors with `theme.palette.primary.main`
- [ ] Replace all light backgrounds with `${theme.palette.primary.light}15`
- [ ] Replace all text colors with `theme.palette.text.primary` or appropriate variant
- [ ] Keep semantic status colors as hardcoded values (#e8f5e8, #fff3e0, #ffebee)
- [ ] Verify no hardcoded blue colors remain (#1565c0, #e3f2fd, etc.)

### Layout & Spacing
- [ ] Update page container to use `maxWidth={false}` and `px: 2`
- [ ] Change background from `grey.100` to `grey.50`
- [ ] Reduce header padding from `py: 3` to `py: 1.5`
- [ ] Change title from `h4` to `h5` (1.25rem)
- [ ] Change subtitle to `caption` (0.75rem)
- [ ] Update summary cards padding from `p: 2` to `p: 1.5`
- [ ] Reduce all margin-bottom values by ~40%
- [ ] Tighten border radius values (2 → 1.5)

### Components
- [ ] Set chip heights to 28px with 0.75rem font
- [ ] Set chip icon sizes to 16px
- [ ] Add `size="small"` to Table component
- [ ] Reduce table cell padding to `6px 8px`
- [ ] Set table font size to 0.75rem
- [ ] Update table max-height to `calc(100vh - 320px)`
- [ ] Set pagination toolbar height to 40px
- [ ] Update pagination font sizes to 0.75rem
- [ ] Change pagination options to [10, 25, 50, 100]

### Colors & Effects
- [ ] Apply theme-based color scheme consistently
- [ ] Add table row hover effect: `rgba(25, 118, 210, 0.04)`
- [ ] Add alternating row colors: `rgba(0, 0, 0, 0.02)` for even rows
- [ ] Use semantic colors for status indicators
- [ ] Verify proper contrast ratios (WCAG AA)

### Testing
- [ ] Test responsive behavior on all screen sizes
- [ ] Verify accessibility (contrast, keyboard navigation)
- [ ] Test with real data to ensure readability
- [ ] Compare visually with Commercial module pages
- [ ] Test theme color consistency across modules
- [ ] Verify all interactive elements work correctly

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | November 2024 | Added comprehensive theme implementation guide, color decision tree, and proper theme.palette usage patterns |
| 1.0 | November 2024 | Initial design guide created from Commercial module implementation |

---

## References

- [Material-UI Documentation](https://mui.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- Commercial Module Implementation Files:
  - `src/components/QuantityTakeOff/CommonDraft/EnterpriseDrafts.tsx`
  - `src/components/QuantityTakeOff/BOQ/EnterpriseBOQDrafts.tsx`
  - `src/components/QuantityTakeOff/quotation/EnterpriseQuotationDrafts.tsx`
  - `src/components/QuantityTakeOff/purchase-order/EnterprisePurchaseOrderDrafts.tsx`

---

## Summary: Key Takeaways

### 🎨 Color Implementation (Most Important)
1. **ALWAYS** use `useTheme` hook: `const theme = useTheme()`
2. **Primary colors** → `theme.palette.primary.main` (never hardcode)
3. **Light backgrounds** → `${theme.palette.primary.light}15`
4. **Text colors** → `theme.palette.text.primary`
5. **Semantic colors** → Hardcoded (#e8f5e8, #fff3e0, #ffebee)

### 📏 Sizing Standards
- **Chips**: 28px (summary), 24px (table)
- **Inputs**: 32px height
- **Fonts**: 0.75rem (body), 0.875rem (subtitle), 1.25rem (title)
- **Padding**: 1.5 (sections), 6px 8px (cells)
- **Icons**: 28px (header), 16px (buttons), 18px (actions)

### 🎯 Quick Implementation Steps
1. Import `useTheme` from '@mui/material'
2. Declare `const theme = useTheme()` in component
3. Replace all `#1565c0` with `theme.palette.primary.main`
4. Replace all `#e3f2fd` with `${theme.palette.primary.light}15`
5. Apply compact spacing (py: 1.5, mb: 1.5, p: 1.5)
6. Use size="small" for tables and buttons
7. Set proper font sizes (0.75rem for most text)
8. Test visual consistency with Commercial module

### ✅ Verification Checklist
- [ ] No hardcoded blue colors (#1565c0, #e3f2fd)
- [ ] All primary colors use theme.palette
- [ ] Semantic colors are hardcoded
- [ ] Spacing follows compact pattern
- [ ] Typography sizes are consistent
- [ ] Components match Commercial module visually

---

**Last Updated**: November 2024  
**Maintained By**: Development Team  
**Status**: Active Reference Document  
**Version**: 1.1
