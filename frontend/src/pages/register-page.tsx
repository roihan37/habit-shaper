import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, LoaderCircle, Sprout } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { registerSchema, type RegisterInput } from '../auth/register-schema'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { ApiError, apiRequest } from '../services/api'

type RegisteredUser = {
  id: string
  email: string
}

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
      console.log(error)
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
    <main className="grid min-h-screen place-items-center bg-background px-5 py-8 text-foreground max-[480px]:items-start max-[480px]:bg-card max-[480px]:px-4 max-[480px]:py-5">
      <Card
        className="w-full max-w-[440px] rounded-2xl shadow-[0_12px_32px_rgb(20_48_31_/_7%)] max-[480px]:border-0 max-[480px]:shadow-none"
        aria-labelledby="register-heading"
      >
        <CardHeader className="gap-7 p-8 pb-7 max-[480px]:gap-6 max-[480px]:px-1 max-[480px]:pb-6 max-[480px]:pt-4">
          <Link
            className="inline-flex w-fit items-center gap-2.5 rounded-sm text-[0.95rem] font-semibold text-foreground no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
            to="/"
            aria-label="Habit Shaper home"
          >
            <span
              className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
              aria-hidden="true"
            >
              <Sprout size={20} strokeWidth={2.25} />
            </span>
            Habit Shaper
          </Link>
          <div>
            <h1
              className="m-0 text-[clamp(1.65rem,5vw,2rem)] font-semibold leading-tight tracking-tight text-foreground"
              id="register-heading"
            >
              Create your account
            </h1>
            <CardDescription className="mb-0 mt-2 text-[0.95rem] leading-relaxed">
              Start building better habits, one day at a time.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8 max-[480px]:px-1 max-[480px]:pb-4">
          <form className="grid gap-5" onSubmit={onSubmit} noValidate>
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                className="h-11 rounded-lg bg-card"
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
                  className="m-0 text-xs leading-relaxed text-destructive"
                  id="email-error"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  className="h-11 rounded-lg bg-card pr-11"
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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
              {errors.password ? (
                <p
                  className="m-0 text-xs leading-relaxed text-destructive"
                  id="password-error"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              ) : (
                <p
                  className="m-0 text-xs leading-relaxed text-muted-foreground"
                  id="password-help"
                >
                  8–72 characters
                </p>
              )}
            </div>

            <Button
              className="mt-0.5 h-11 w-full rounded-lg font-semibold"
              type="submit"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending && (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              )}
              {registerMutation.isPending
                ? 'Creating account…'
                : 'Create account'}
            </Button>
          </form>

          <p className="mb-0 mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              className="rounded-sm font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              to="/login"
            >
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
