# Stay preview

## 2026-08-26

- Removed hero portraits and Show me demo from the published preview; retained the description, bottom alignment and hero entrance.

- Published the locally reviewed Stay case experiment: hero copy, logo/portraits and demo CTA, dark gradient, homepage-style hero entrance and header Contact us button.
- Added three-column About layout, compact Services tags, sticky process titles and inline Deliverables above media.
- Reused the frosted cookie banner with a small Oreo logo and black Customize hover.
- Hero summary: “Making insurance in Germany easier to understand, with expert guidance at every step.”
- Other previews are unchanged. The demo CTA retains the contact-page destination; this preview is noindex.
- Excluded a legacy authenticated Vimeo sizing request from the public bundle; embedded video players retain their original dimensions and responsive styles.

Rebuild after running Eleventy in the source project:

```sh
python3 scripts/package-stay-preview.py ../halo-website/_site
```
