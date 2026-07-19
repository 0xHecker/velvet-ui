// Pexels CDN helper — free-to-use photos (https://www.pexels.com/license/).
// `w`/`h` request resized, compressed derivatives; `fit=crop` when both given.
export const px = (id, w = 800, h) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}${h ? `&h=${h}&fit=crop` : ""}`;
