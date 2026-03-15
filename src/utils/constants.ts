export const PATH_TREES_PHOTOS = 'trees_photos/';

export const JWT_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};
