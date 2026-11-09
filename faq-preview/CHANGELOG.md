# Changelog

## 2026-11-09
- Made search global across all 84 questions and answers; clearing search restores the selected category, while selecting a category exits search.
- Expanded all six service/process/pricing categories to 10 questions each (84 total) and synchronized structured data.
- Packaged a standalone faq-preview for the preview repository with local asset copies instead of external symlinks.
- Aligned answer paragraphs with question text by removing the extra left inset at all breakpoints.
- Tightened answer line-height to 1.4 and moved question text and toggle icons closer to card edges, retaining inset answer text.
- Doubled card side padding, question vertical padding, and answer bottom padding for more breathing room.
- Increased question typography to 22px desktop and 18px mobile while retaining compact card spacing.
- Reduced FAQ cards to 920px with tighter spacing and removed duplicate category headings; retained accessible category labels.
- Increased answer text to 20px desktop / 17px mobile and centered FAQ groups at a maximum width of 1080px.
- Removed visible answer permalinks and expanded all 40 answers with project context and practical scope details; synchronized FAQPage JSON-LD.
- Matched Branding FAQ typography, plus/minus icons, circular hover state, and opening/closing transitions with reduced-motion support.
- Versioned local CSS and JavaScript URLs by content hash to prevent stale browser assets from breaking the updated category filter.
- Made About Halo Lab the first/default category, removed All questions, and expanded the introduction to 24 questions with case-study links.
- Added stable question anchors and FAQPage JSON-LD matching the HTML answers; kept all content available without JavaScript.
- Removed the repeated Frequently Asked Questions eyebrow from every category heading.
- Changed FAQ groups to a single column with each category heading above its question cards.
- Replaced category tabs with blog-style filters and an All questions default; search combines with the selected category.
- Restored the final CTA gradient stacking context and readable text contrast.
- Matched FAQ cards to the Branding service page: white surface, dark text, rounded corners.
- Removed Quick topics and made final CTA content independent of scroll entrance animations.
- Removed the “Still have a question? / We’re here to help” row beneath the FAQ.

## 2026-11-07
- Rebuilt the local FAQ preview around the existing Projects page shell from halo-outer-glow/_site/projects.html.
- Reused the site header, footer, project CTA, Suisse typography, local assets, and global interactions.
- Added dark FAQ layout, Projects-style search and underline categories; preserved search, empty state, URL category selection, and native accordions.
- Shared css, js, fonts, and images resolve through local symlinks to halo-outer-glow. This preview is local-only and has not been republished.
