export interface CurrentSongSvgView {
  height: number
  title: string
  link: string
  artists: string
  coverImageBase64: string | null
  songName: string
  currentlyPlaying: boolean
  songDurationMs: number
  songProgressMs: number
  songPopularity: number
  isSongExplicit: boolean
}