/**
 * An avatar is generated, not picked from a fixed set. The descriptor is all
 * that travels between clients - everyone regenerates the same sprite from it,
 * so nothing has to be uploaded or stored.
 */
export type Gender = 'm' | 'f' | 'n'

export const GENDERS: { value: Gender; label: string }[] = [
  { value: 'f', label: 'Feminine' },
  { value: 'm', label: 'Masculine' },
  { value: 'n', label: 'Neutral' },
]

/** e.g. "f3a7b1c" - one character of gender, then the seed */
export type AvatarDescriptor = string

const SEED_LENGTH = 6
export const AVATAR_PATTERN = /^[mfn][0-9a-f]{6}$/

export function buildAvatar(gender: Gender, seed: number): AvatarDescriptor {
  const hex = (seed >>> 0).toString(16).padStart(SEED_LENGTH, '0').slice(-SEED_LENGTH)
  return `${gender}${hex}`
}

export function isAvatar(value: unknown): value is AvatarDescriptor {
  return typeof value === 'string' && AVATAR_PATTERN.test(value)
}

export function genderOf(avatar: AvatarDescriptor): Gender {
  return (avatar[0] as Gender) || 'n'
}

export function seedOf(avatar: AvatarDescriptor): number {
  return parseInt(avatar.slice(1), 16) || 0
}

/** the texture and animation keys a descriptor owns; must stay alphanumeric */
export function avatarTextureKey(avatar: AvatarDescriptor) {
  return `av${avatar}`
}

export const DEFAULT_AVATAR: AvatarDescriptor = 'n000000'
