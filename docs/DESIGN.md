# Quiet Exploration — Design System

## Identity

Calm, curious, clear, and respectful. The audience is employers and clients. Express confidence through evidence and thoughtful decisions. Values copy: “I value clear communication, thoughtful work, and mutual respect.”

## Foundations

| Token | Light | Dark |
| --- | --- | --- |
| Background | `#F7F5EF` | `#171D19` |
| Surface | `#FFFFFF` | `#222A24` |
| Text | `#202722` | `#F1F2EC` |
| Secondary | `#59635C` | `#B3BDB4` |
| Accent | `#315C49` | `#A5C4AE` |
| Divider | `#D9DDD3` | `#3E4A40` |

Self-host Manrope Variable for Latin scripts and Noto Sans Arabic Variable for Arabic. Use one coherent type hierarchy. Large, quiet headlines; smaller uppercase labels; readable body text. Keep the page near 1,180px and long-form content near 740px. Use approximately 20px mobile gutters and fluid desktop gutters. Recheck contrast after token changes.

## Composition

- Portrait and orbit linework introduce curiosity without overwhelming the content.
- Featured work uses an asymmetric hierarchy: one wide project, followed by smaller studies.
- Vector project covers illustrate concepts; they are not screenshots or evidence of measured outcomes.
- About contains the personal story and concise education, not a long scrolling homepage timeline.
- Services explain useful capabilities without unverified commercial promises.
- The journal has an honest empty state until articles are reviewed and migrated.
- Show endorsements only when genuine, consented, moderated, and intentionally published.
- Publish a résumé link only after uploading and verifying a portable PDF. Do not reuse the broken absolute symlink.

## Interaction and accessibility

Use visible focus, semantic landmarks, a skip link, ordinary browser scrolling, accessible dialogs, explicit form labels, and clear success/error states. Theme preference supports light/dark/system and tracks operating-system changes. Use 150–250ms color/transform transitions; disable motion under reduced-motion preferences. No scroll hijacking, fake loading, or content hidden behind entrance animation.

## Localization

All primary visitor pages and forms support English, French, and Arabic. Use logical layout properties and isolate code/email addresses as LTR. Mirror directional icons where appropriate, not logos or imagery. Preserve the current path when switching locale. Do not advertise an unpublished translation in hreflang or sitemaps. Have a human review translations before production.

## Evidence

A valid case study distinguishes the problem, individual or team contribution, decisions, implementation, and lessons. Do not invent business metrics, availability, credentials, client logos, endorsements, or product functionality. Budgetify's older web application is separate from its current Lyvora mobile releases.
