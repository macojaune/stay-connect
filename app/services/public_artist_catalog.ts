// A public release counts once, including featured credits but excluding private releases.
export const PUBLIC_ARTIST_RELEASES = `
  from releases
  where releases.is_secret = false
    and (releases.artist_id = artists.id or exists (
      select 1 from features
      where features.release_id = releases.id and features.artist_id = artists.id
    ))
`
