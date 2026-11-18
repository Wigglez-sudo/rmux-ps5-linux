// Newest first. The floating card shows the first entry until the reader dismisses it.
// A new id brings the card back for everyone.

export type NewsItem = {
  id: string
  date: string
  author: string
  authorLink: string
  text: string
  link?: string
  linkText?: string
  extraLink?: string
  extraText?: string
}

export const news: NewsItem[] = [
  {
    id: '2026-10-09-vcn',
    date: 'Oct 9, 2026',
    author: '@rmux0',
    authorLink: 'https://x.com/rmux0',
    text: 'VCN hardware video works on PS5. H.264, HEVC and VP9 decode up to 4K and beyond, H.264 encode at under 3% CPU. HEVC encode works I-frame only for now. Needs a kernel built from ps5-linux-patches #38 or newer.',
    link: 'https://guide.rmux.eu/guide/gpu#vcn-hardware-video-decode',
    linkText: 'Read more',
  },
]
