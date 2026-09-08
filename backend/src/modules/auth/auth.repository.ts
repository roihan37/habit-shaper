import { prisma } from "../../database/prisma.js"

export const authRepository = {
  findUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    })
  },

  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    })
  },

  createUser(email: string, passwordHash: string) {
    return prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
      },
    })
  },
}
