---
name: Kinetic Clinical Intelligence
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3f4850'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#006577'
  on-tertiary: '#ffffff'
  tertiary-container: '#008096'
  on-tertiary-container: '#f9fdff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-metric:
    fontFamily: JetBrains Mono
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
  badge:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system serves physical therapists, orthopedic clinicians, and rehabilitation specialists who monitor patient recovery through on-device machine learning kinematics. The aesthetic is anchored in **Clinical Precision & Modern Functionalism**: high visual clarity, low cognitive strain, and absolute trust. 

The emotional tone balances surgical objectivity with human empathy. Clinicians must scan telemetry arrays, range-of-motion (ROM) graphs, tempo deltas, and flagged movement compensations rapidly without fatigue. 

Visual foundations prioritize:
- **Calibrated Data Density:** Information-rich layouts that emphasize scan paths and minimize decorative chrome.
- **Structural Integrity:** Crisp borders, distinct surface hierarchy, and rigorous alignment.
- **Visual Confidence:** Semantic color is reserved for diagnostic feedback, kinematic bounds, confidence ratings, and clinical actions, never used purely as ornamentation.

## Colors

The palette is engineered for clinical legibility and diagnostic precision under varied clinic lighting conditions.

### Core Swatches
- **Primary (`#0284c7` - Sky Clinical):** Represents primary interactive controls, active program paths, and confirmed tracking states. Deep variant `#0369a1` serves hover and selected states.
- **Secondary (`#4f46e5` - Kinematic Indigo):** Identifies target baselines, reference angle vectors, and expected movement curves.
- **Tertiary (`#06b6d4` - Telemetry Cyan):** Reserved for live sensor feeds, active ROM trace curves, and instantaneous velocity.
- **Neutral (`#64748b` - Slate Medium):** Structural foundation for non-active indicators, secondary labels, and neutral states.

### Canvas & Surfaces
- **Canvas Base:** `#f8fafc` (Light Slate). Minimizes eye strain during prolonged screen sessions while creating contrast against white surfaces.
- **Surface Elevation 0 (Resting Cards):** `#ffffff` (Pure White).
- **Surface Elevation 1 (Interactive / Flyout Layers):** `#ffffff` with structural border `#e2e8f0`.
- **Subsurface Well:** `#f1f5f9` (Used for telemetry graph backgrounds, scrubbers, and segmented control wells).

### Clinical Semantics & Confidence Flags
- **Success / High ML Confidence:** `#10b981` (Base), `#059669` (Dark). Applied to validated repetitions, target thresholds achieved, and ML confidence ≥ 92%.
- **Warning / Compensation Detected:** `#f59e0b` (Base), `#d97706` (Dark). Applied to mild deviation, tempo lag, or borderline sensor confidence.
- **Critical / Flagged Pain / Abstained:** `#ef4444` (Base), `#dc2626` (Dark). High-priority indicators for compensatory injury risk, sharp pain self-reporting, or program non-adherence.

## Typography

Typography relies on a paired hierarchy: **Inter** handles narrative clarity, clinical labels, and standard navigation, while **JetBrains Mono** guarantees fixed-width tabular alignment for degrees, angular velocity, confidence percentages, and timestamps.

- **Tabular Numerals Everywhere:** All instances of Inter displaying numerical datasets must explicitly employ `font-variant-numeric: tabular-nums lining-nums` to prevent column shifting during live scrubbing.
- **Typeform Density:** Headers are compact, favoring tighter letter-spacing and firm line heights to ensure multi-parameter dashboards do not wrap unexpectedly.
- **Monospace Application:** JetBrains Mono is restricted to telemetry values, angle notations (e.g., `138.4°`), confidence brackets (`[98.2%]`), and scrub timelines.

## Layout & Spacing

Layouts follow a responsive, high-density fluid grid system designed to support clinical workflows across workstation monitors, clinic tablets, and patient cart touchscreens.

### Grid Architecture
- **Desktop (≥ 1280px):** 12-column layout with `gutter-desktop` (24px) and `margin-desktop` (32px). Primary view splits: 8-column kinematic visualizer/player paired with 4-column clinical review & calibration controls.
- **Tablet / Small Laptop (768px - 1279px):** 8-column layout with `gutter` (16px) and `margin-tablet` (24px). Telemetry panels fold into synchronized drawer segments or tabbed cards.
- **Mobile Handheld (< 768px):** 4-column layout with `gutter` (16px) and `margin` (16px). Stacked sequential cards; scrub controls collapse into sticky bottom trays.

### Spacing Principles
- Density is calibrated to balance touch-target compliance (minimum 40px hit areas) with maximum data visibility per viewport.
- Internal component spacing prefers `space-sm` (8px) and `space-md` (12px) to keep data-label pairs unified.

## Elevation & Depth

This system avoids expressive or dramatic skeuomorphism in favor of **Low-Contrast Outlines paired with Diffuse Ambient Stacking**. Surfaces communicate their operational tier cleanly without muddying dense diagnostic values.

### Structural Depth Scale
- **Tier 0 (Base Canvas):** `#f8fafc`. Flat foundation. No drop shadows.
- **Tier 1 (Clinical Cards & Telemetry Pods):** `#ffffff` fill bounded by a crisp 1px solid `#e2e8f0` stroke. Shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
- **Tier 2 (Floating Popovers & Scrub Hovercards):** `#ffffff` with border `#cbd5e1`. Shadow: `0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.04)`.
- **Tier 3 (Clinical Modals & Critical Overrides):** `#ffffff` surrounded by `#94a3b8` border. Shadow: `0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)`. Backdropped by `rgba(15, 23, 42, 0.40)` with `backdrop-filter: blur(2px)`.

Active, interactive telemetry cards gain a 1px border state shift to `#0284c7` accompanied by an ambient glow: `0 0 0 3px rgba(2, 132, 199, 0.10)`.

## Shapes

The interface adopts a **Soft (`1`)** shape language. Soft rounding balances modern software design with the disciplined, structured geometry necessary for high-density clinical dashboards.

- **Standard Elements (Buttons, Inputs, Metric Badges):** 0.25rem (4px) corner radius. Keeps edges crisp and aligns strictly against data columns.
- **Containers & Surfaces (Cards, Telemetry Panels):** 0.5rem (8px) corner radius.
- **Pills & Status Indicators:** Fully rounded (`rounded-full` / 9999px) strictly for confidence tags, pain status pills, and tracking node dots to differentiate metadata from structural bounding boxes.

## Components

### Buttons & Clinical Triggers
- **Primary Action (e.g., "Approve Protocol", "Calibrate Baseline"):** Solid `#0284c7` background, white text, 4px border radius. Hover: `#0369a1`. Active: `#075985`. Focus ring: 2px offset with `rgba(2, 132, 199, 0.4)`.
- **Destructive / Flag Action (e.g., "Halt Movement", "Reject Repetition"):** Solid `#ef4444` background with hover to `#dc2626`.
- **Secondary / Action Ghost:** White background, 1px border `#cbd5e1`, slate text `#334155`. Hover: `#f8fafc` background with border `#94a3b8`.

### High-Density Data Cards
- Pure `#ffffff` surface, 8px border radius, 1px `#e2e8f0` border.
- Header row contains the anatomical joint / movement title (`headline-sm`), active confidence badge, and a three-dot menu for sensor channel configuration.
- Padding: strictly `space-md` (12px) to maximize data yield without crowding.

### Telemetry Dials & ROM Range Gauges
- Circular arc tracks drawn with `#e2e8f0` background strokes (4px thickness).
- Active dynamic arc rendered in `#0284c7` (primary) or `#06b6d4` (instantaneous ROM).
- Target baseline threshold depicted by a 2px tick mark in `#4f46e5`.
- Dial centers host tabular mono metrics (`display-metric`) with a subdued unit label beneath (`label-mono`).

### Dual-Handle Range Indicator Sliders
- Used by clinicians to trim and set valid ROM windows (e.g., 20° extension to 125° flexion).
- Track: 6px height in `#f1f5f9` with 1px inset border `#e2e8f0`. Active zone between handles filled with `#0284c7` at 20% opacity.
- Handles: 16px circular sliders in white with a 2px `#0284c7` solid border, displaying real-time degree flags pinned directly above each handle.

### Segmented Tabs
- Container styled as an inset surface well: `#f1f5f9` background, 4px radius, 4px internal padding.
- Selected segment: `#ffffff` pill, subtle shadow `0 1px 3px rgba(15, 23, 42, 0.08)`, text `#0f172a` font-weight 600. Unselected segments: `#64748b` text, transparent background.

### Kinematic Player Chrome
- Integrated bar positioned beneath skeletal wireframe or depth-stream visualizer.
- Timeline scrubber features color-coded micro-segments indicating ML confidence and pain-flag events along the time domain: green segment for verified reps, amber for compensation, red for patient-flagged pain.
- Playhead is a high-contrast `#0284c7` vertical line with an instantaneous angle badge anchored to its top.

### Form Inputs & Clinical Radios
- Inputs use 1px border `#cbd5e1`, 4px radius, and `#ffffff` background. Active focus shifts border to `#0284c7` with ring shadow.
- Number inputs for clinical degrees lock text to `JetBrains Mono` and include built-in stepper increment arrows (+1° / -1°).