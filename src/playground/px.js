// Pexels CDN helper — free-to-use photos (https://www.pexels.com/license/).
// `w`/`h` request resized WebP derivatives; `fit=crop` when both are given.
export const px = (id, w = 800, h) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fm=webp&w=${w}${h ? `&h=${h}&fit=crop` : ""}`;
