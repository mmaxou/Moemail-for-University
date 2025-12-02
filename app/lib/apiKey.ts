import { auth } from "./auth"

export const getUserId = async () => {
  const session = await auth()
  return session?.user.id
}
