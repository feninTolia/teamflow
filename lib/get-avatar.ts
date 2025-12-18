export function getAvatar(
  userPicture: string | null | undefined,
  userEmail: string
) {
  return userPicture ?? `https://avatar.vercel.sh/${userEmail}`;
}
