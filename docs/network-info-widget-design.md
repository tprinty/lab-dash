# Network Info Widget - Implementation Plan

## Overview

This document outlines the steps to create a new widget for Lab Dash that displays the server's public IP address and measures network latency/speed to a configurable target host.

---

## Visual Design

### Layout Structure

The widget will use a compact card layout consistent with other Lab Dash widgets (like PiholeWidget and DiskMonitorWidget). It will be a standard single-width widget that fits in the dashboard grid.

```
┌─────────────────────────────────────┐
│  🌐  Network Info                   │  <- Header with icon and title
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────┐ ┌──────────────┐ │
│  │  PUBLIC IP    │ │   LATENCY    │ │  <- Two colored stat boxes
│  │   🌍 IP       │ │    📡 Ping   │ │     (2x1 grid layout)
│  │  203.0.113.42 │ │    12 ms     │ │
│  └───────────────┘ └──────────────┘ │
│                                     │
│  Target: google.com                 │  <- Small footer showing target host
│                                     │
└─────────────────────────────────────┘
```

### Color Scheme

Following the existing widget patterns (PiholeWidget uses colored Paper components):

| Stat Box | Background Color | Description |
|----------|------------------|-------------|
| Public IP | `#006179` (teal/cyan) | Matches "Queries Today" in PiholeWidget |
| Latency | `#004A28` (dark green) | Matches "Domains on Adlists" in PiholeWidget |

Alternative: Use a single-row layout with both values if space is tight.

### Component Styling

- **Container**: Uses `CardContent` with `padding: 0` for full control
- **Stat Boxes**: Material-UI `Paper` components with `elevation={0}` and colored backgrounds
- **Typography**:
  - Labels: `fontSize: '0.75rem'`, white text
  - Values: `fontSize: '0.95rem'`, `fontWeight: bold`, white text
- **Icons**: React Icons (`FaGlobe` for IP, `FaNetworkWired` or `MdSpeed` for latency)
- **Grid**: Material-UI `Grid2` with `spacing={0.4}` between stat boxes

### States

**Loading State:**
- Centered `CircularProgress` spinner with "Loading network info..." text

**Error State:**
- Centered error message with "Retry" button (matches WeatherWidget pattern)

**Not Configured State:**
- Message: "Please configure the target host in settings"

### Responsive Behavior

- Stat boxes stack vertically on mobile (`xs: 12`) and horizontally on larger screens (`xs: 6`)
- Font sizes scale down slightly on mobile using responsive `sx` props
- Widget maintains minimum height of ~120px

---

## Configuration Options

When adding or editing the widget, users will have access to these settings:

### Target Host (Required)
- **Field Type**: Text input
- **Description**: The hostname or IP address to ping for latency measurement
- **Examples**: `google.com`, `8.8.8.8`, `192.168.1.1`, `cloudflare.com`
- **Validation**: Must be a valid hostname or IP address
- **Default**: `8.8.8.8` (Google DNS)

### Refresh Interval
- **Field Type**: Dropdown select
- **Options**:
  - 10 seconds
  - 30 seconds (default)
  - 1 minute
  - 5 minutes
- **Description**: How often to refresh the public IP and ping data

### Display Options
- **Show Label**: Toggle to show/hide the "Network Info" header (default: on)
- **Display Name**: Custom name for the widget header (default: "Network Info")
- **Show Target Host**: Toggle to show/hide the target hostname in the footer (default: on)

### Configuration Form Preview

```
┌─────────────────────────────────────────────────┐
│  Network Info Widget Settings                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Target Host *                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ google.com                              │   │
│  └─────────────────────────────────────────┘   │
│  Hostname or IP address to measure latency     │
│                                                 │
│  Refresh Interval                               │
│  ┌─────────────────────────────────────────┐   │
│  │ 30 seconds                          ▼   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ☑ Show Label                                  │
│                                                 │
│  Display Name                                   │
│  ┌─────────────────────────────────────────┐   │
│  │ Network Info                            │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ☑ Show Target Host                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Step 1: Define the Widget Type

Add a new entry `NETWORK_INFO_WIDGET = 'network-info-widget'` to the `ITEM_TYPE` enum in `/frontend/src/types/index.ts`. This enum is the central registry for all widget types in the application and is used throughout the codebase to identify and route widget logic.

---

## Step 2: Create the Backend API Route

Create a new route file at `/backend/src/routes/network.route.ts` with two endpoints. The first endpoint `GET /api/network/public-ip` will fetch the server's public IP address by querying an external service (such as ipify.org or ifconfig.me). The second endpoint `GET /api/network/ping` will accept a `host` query parameter and measure the round-trip latency to that host using ICMP ping or TCP connection timing. Both endpoints should include appropriate rate limiting to prevent abuse.

---

## Step 3: Register the Backend Route

Import and register the new network route in `/backend/src/app.ts`. This connects the route handlers to the Express application so the endpoints become accessible to the frontend.

---

## Step 4: Add Frontend API Methods

Add static methods to the `DashApi` class in `/frontend/src/api/dash-api.ts` to call the new backend endpoints. These methods (`getPublicIp()` and `getPingStats(host)`) will handle the HTTP requests and return typed responses for use by the widget component.

---

## Step 5: Create the Base Widget Component

Create the main widget component at `/frontend/src/components/dashboard/base-items/widgets/NetworkInfoWidget.tsx`. This component will fetch data from the API on mount and at a configurable refresh interval. It should display the public IP address prominently, show the latency to the target host in milliseconds, and handle loading and error states gracefully. The component receives configuration via the `config` prop and must be wrapped in the standard `WidgetContainer` component.

---

## Step 6: Create the Sortable Wrapper Component

Create `/frontend/src/components/dashboard/sortable-items/widgets/SortableNetworkInfo.tsx` to wrap the base widget with drag-and-drop functionality. This wrapper uses the `@dnd-kit/sortable` library hooks and places the widget inside a `Grid2` component with appropriate sizing for the dashboard grid layout.

---

## Step 7: Create the Configuration Form

Create `/frontend/src/components/forms/configs/NetworkInfoWidgetConfig.tsx` to provide a user interface for configuring the widget. The form should allow users to specify the target hostname or IP address to ping, set the refresh interval, and toggle which information to display. Use `react-hook-form-mui` components to match the existing form patterns in the application.

---

## Step 8: Register Widget in Selection Menu

Add an entry to the `WIDGET_OPTIONS` array in `/frontend/src/components/forms/AddEditForm/constants.ts`. This makes the widget appear in the "Add Widget" menu with an appropriate icon, label, and description so users can add it to their dashboard.

---

## Step 9: Add Widget Rendering to Dashboard Grid

Update `/frontend/src/components/dashboard/DashboardGrid.tsx` to import the new `SortableNetworkInfo` component and add a case in the switch statement that maps `ITEM_TYPE.NETWORK_INFO_WIDGET` to the sortable component. This enables the dashboard to render the widget when it appears in the user's configuration.

---

## Step 10: Map Widget Type to Configuration Form

Update `/frontend/src/components/forms/AddEditForm/createWidgetConfig.ts` to map the new widget type to its configuration component. This ensures that when a user adds or edits the widget, the correct configuration form is displayed.

---

## Testing Checklist

- Verify public IP is fetched and displayed correctly
- Verify ping latency is measured and displayed for various hosts
- Confirm widget appears in the add widget menu
- Test drag-and-drop functionality on the dashboard
- Test configuration form saves and loads settings properly
- Verify refresh interval updates data as expected
- Test error handling when network requests fail
- Confirm rate limiting prevents excessive API calls
