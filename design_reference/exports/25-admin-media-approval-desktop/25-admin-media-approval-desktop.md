---
name: Community Guardian
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf4'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d4e4fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#43474e'
  inverse-surface: '#223144'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#455f88'
  primary: '#002045'
  on-primary: '#ffffff'
  primary-container: '#1a365d'
  on-primary-container: '#86a0cd'
  inverse-primary: '#adc7f7'
  secondary: '#0a6c44'
  on-secondary: '#ffffff'
  secondary-container: '#9ff5c1'
  on-secondary-container: '#167249'
  tertiary: '#371800'
  on-tertiary: '#ffffff'
  tertiary-container: '#572900'
  on-tertiary-container: '#e88532'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#adc7f7'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#2d476f'
  secondary-fixed: '#9ff5c1'
  secondary-fixed-dim: '#83d8a6'
  on-secondary-fixed: '#002111'
  on-secondary-fixed-variant: '#005231'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d4e4fc'
typography:
  display:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: auto
  max-width: 1200px
---

## Brand & Style
The design system is built to project the dual nature of an international NGO: professional rigor and local, grassroots warmth. It serves three distinct audiences: international donors seeking transparency, government partners requiring reliability, and local community members who need to feel safe and included.

The visual style is a **Modern Corporate** approach softened by **Organic Minimalism**. It avoids the sterility of pure tech design by utilizing warm color tints and rounded geometry. The emotional response is one of "sturdy hope"—a sense that the organization is both technically competent and deeply compassionate. Layouts prioritize clarity and breathability to ensure information regarding child welfare is never overwhelming or obscured.

## Colors
The palette is grounded in stability and growth. 

- **Primary (Deep Blue):** Used for headers, primary actions, and authoritative text. It establishes the "Trust" foundation.
- **Secondary (Warm Green):** Used for success states, community-impact metrics, and environment/development-related content.
- **Tertiary (Soft Orange):** Used sparingly as an accent for call-to-actions (CTAs) like "Donate" or "Volunteer" to provide warmth without signaling "danger."
- **Neutrals:** A range of cool grays provides the structure for layout borders and secondary text, ensuring the vibrant primary colors remain the focus.
- **Surface Tints:** Use 5%–8% opacities of the primary and secondary colors for large background sections to differentiate content blocks without using harsh lines.

## Typography
Typography emphasizes legibility and a friendly but firm tone. 

**Montserrat** is used for headings to provide a modern, geometric strength that feels "established." **Inter** is used for all body copy and UI elements; its tall x-height and neutral character ensure that reports and programmatic data are highly readable even on low-resolution mobile devices. 

Line heights are intentionally generous (1.6x for body text) to accommodate readers who may be scanning for critical information. Letter spacing is slightly tightened on large headlines for a more "designed" editorial feel, while labels utilize slight tracking to improve clarity at small sizes.

## Layout & Spacing
The layout follows a **Fixed Grid** model on desktop to maintain a professional, structured appearance, centered within the viewport. 

- **Desktop:** A 12-column grid with a 1200px max-width. Gutters are set to 24px to provide clear breathing room between content modules.
- **Mobile:** A fluid 4-column grid with 16px side margins. 
- **Vertical Rhythm:** Use the `lg` (48px) and `xl` (80px) tokens for section spacing to create a distinct "blocky" feel that helps users digest one topic at a time. 

Content should be grouped in "soft blocks"—sections defined by light background tints (e.g., a very light green tint for "Development Projects") rather than heavy horizontal rules.

## Elevation & Depth
This design system avoids heavy shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**. 

Depth is communicated through:
1.  **Surface Levels:** The base background is white. Secondary content blocks use the `background_tint` (#F7FAFC).
2.  **Subtle Definition:** Cards and interactive elements use a 1px border in a light neutral tone (#E2E8F0) rather than a shadow.
3.  **Active Elevation:** Only the primary CTA buttons and critical "Impact Cards" receive a very soft, high-diffusion shadow (0px 4px 20px rgba(26, 54, 93, 0.08)) to indicate they are "above" the informational plane.

## Shapes
A **Rounded (0.5rem)** logic is applied across the system to reinforce the "Child-Safe" and "Community-Centered" themes. 

- **Small Components:** Checkboxes and small tags use `rounded-sm` (0.25rem).
- **Standard UI:** Buttons, input fields, and standard cards use `rounded-md` (0.5rem).
- **Major Containers:** Large feature sections and hero images use `rounded-xl` (1.5rem) on top or bottom edges to create a soft, welcoming framing effect.
- **Icons:** Use icons with rounded terminals and consistent stroke weights (2px) to match the typography.

## Components
- **Buttons:** Primary buttons are Solid Deep Blue with white text. Secondary buttons use a Green outline. The "Donate" button is the only element allowed to use the Soft Orange background. All buttons have a minimum height of 48px for touch accessibility.
- **Cards:** Used for project highlights. They feature a 1px border, a large image at the top with `rounded-md` top corners, and a 24px internal padding for text.
- **Impact Chips:** Small, rounded labels used for categorizing projects (e.g., "Health," "Education"). They use a light tint of the secondary color with dark green text.
- **Input Fields:** Minimalist design with a light gray border. On focus, the border transitions to Primary Deep Blue with a subtle 2px glow.
- **Lists:** Bullet points in long-form reports should use the Secondary Green color for the icons to make the list feel positive and encouraging.
- **Progress Bars:** Used for fundraising or project milestones. The track is light gray, and the filler is the Warm Green, emphasizing growth.