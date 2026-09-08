import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, LoaderCircle, Sprout } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { registerSchema, type RegisterInput } from '../auth/register-schema'
import { ApiError, apiRequest } from '../services/api'

type RegisteredUser = {
  id: string
  email: string
}

const inputClassName =
  'h-[46px] w-full rounded-[9px] border border-[#cbd7ce] bg-white px-[13px] text-[#17211b] outline-none transition-colors placeholder:text-[#8a9890] hover:border-[#9caf9f] focus-visible:border-[#287a47] focus-visible:ring-4 focus-visible:ring-[#287a47]/15 aria-[invalid=true]:border-[#b44747]'

function getFieldMessage(details: unknown, field: keyof RegisterInput) {
  if (typeof details !== 'object' || details === null || !(field in details)) {
    return undefined
  }

  const messages = (details as Record<string, unknown>)[field]
  return Array.isArray(messages) && typeof messages[0] === 'string'
    ? messages[0]
    : undefined
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '' },
  })
  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) =>
      apiRequest<RegisteredUser>('/api/auth/register', {
        method: 'POST',
        body: input,
      }),
  })

  const onSubmit = handleSubmit(async (input) => {
    setFormError(null)

    try {
      await registerMutation.mutateAsync(input)
      navigate('/login', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'EMAIL_ALREADY_EXISTS') {
          setError('email', {
            message: 'An account with this email already exists.',
          })
          return
        }

        if (error.code === 'VALIDATION_ERROR') {
          const emailMessage = getFieldMessage(error.details, 'email')
          const passwordMessage = getFieldMessage(error.details, 'password')

          if (emailMessage) setError('email', { message: emailMessage })
          if (passwordMessage) setError('password', { message: passwordMessage })
          if (emailMessage || passwordMessage) return
        }
      }

      setFormError('Something went wrong. Please try again.')
    }
  })

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7f4] px-5 py-8 text-[#17211b] max-[480px]:items-start max-[480px]:bg-white max-[480px]:px-4 max-[480px]:py-5">
      <section
        className="w-full max-w-[430px] rounded-2xl border border-[#dfe7e1] bg-white p-8 shadow-[0_12px_32px_rgb(20_48_31_/_8%)] max-[480px]:border-0 max-[480px]:px-1 max-[480px]:py-4 max-[480px]:shadow-none"
        aria-labelledby="register-heading"
      >
        <header className="mb-7 grid gap-7 max-[480px]:mb-[26px] max-[480px]:gap-6">
          <Link
            className="inline-flex w-fit items-center gap-[9px] text-[0.95rem] font-semibold text-[#1d3928] no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#287a47] focus-visible:ring-offset-4"
            to="/"
            aria-label="Habit Shaper home"
          >
            <span
              className="grid size-[34px] place-items-center rounded-[10px] bg-[#287a47] text-white"
              aria-hidden="true"
            >
              <Sprout size={20} strokeWidth={2.25} />
            </span>
            Habit Shaper
          </Link>
          <div>
            <h1
              className="m-0 text-[clamp(1.65rem,5vw,2rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#17211b]"
              id="register-heading"
            >
              Create your account
            </h1>
            <p className="mb-0 mt-[9px] text-[0.95rem] leading-[1.55] text-[#607067]">
              Start building better habits, one day at a time.
            </p>
          </div>
        </header>

        <form className="grid gap-5" onSubmit={onSubmit} noValidate>
          {formError && (
            <div
              className="rounded-[9px] border border-[#edc7c7] bg-[#fff5f5] px-[13px] py-[11px] text-sm leading-[1.45] text-[#7d2929]"
              role="alert"
            >
              {formError}
            </div>
          )}

          <div className="grid gap-2">
            <label
              className="text-sm font-semibold text-[#263b2e]"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className={inputClassName}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p
                className="m-0 text-xs leading-[1.4] text-[#a63838]"
                id="email-error"
                role="alert"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <label
              className="text-sm font-semibold text-[#263b2e]"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                className={`${inputClassName} pr-[46px]`}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={
                  errors.password ? 'password-error' : 'password-help'
                }
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-[7px] top-1/2 grid size-[34px] -translate-y-1/2 cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent p-0 text-[#607067] outline-none hover:bg-[#edf4ef] hover:text-[#214c31] focus-visible:ring-2 focus-visible:ring-[#287a47] focus-visible:ring-offset-2"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            {errors.password ? (
              <p
                className="m-0 text-xs leading-[1.4] text-[#a63838]"
                id="password-error"
                role="alert"
              >
                {errors.password.message}
              </p>
            ) : (
              <p
                className="m-0 text-xs leading-[1.4] text-[#6d7c73]"
                id="password-help"
              >
                8–72 characters
              </p>
            )}
          </div>

          <button
            className="mt-0.5 inline-flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-[9px] border-0 bg-[#287a47] px-[18px] font-semibold text-white outline-none transition hover:bg-[#20683b] active:translate-y-px focus-visible:ring-4 focus-visible:ring-[#287a47]/20 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-[0.68] disabled:hover:bg-[#287a47]"
            type="submit"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending && (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            )}
            {registerMutation.isPending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mb-0 mt-6 text-center text-sm text-[#607067]">
          Already have an account?{' '}
          <Link
            className="font-semibold text-[#20683b] underline underline-offset-[3px] outline-none focus-visible:ring-2 focus-visible:ring-[#287a47] focus-visible:ring-offset-2"
            to="/login"
          >
            Log in
          </Link>
        </p>
      </section>
    </main>
  )
}
