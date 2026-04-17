// Utility to generate secure temporary passwords for new portal users

export function generateTemporaryPassword(): string {
  const length = 12
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const lowercase = "abcdefghjkmnpqrstuvwxyz"
  const numbers = "23456789"
  const special = "!@#$%&*"

  // Ensure at least one of each type
  let password = ""
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill the rest randomly
  const allChars = uppercase + lowercase + numbers + special
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
}

export { generateTemporaryPassword as generatePassword }
