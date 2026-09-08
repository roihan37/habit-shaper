import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Sprout } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { registerSchema, type RegisterInput } from '../auth/register-schema'
import { ApiError, apiRequest } from '../services/api'
import './register-page.css'

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
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-heading">
        <header className="auth-header">
          <Link className="auth-brand" to="/" aria-label="Habit Shaper home">
            <span className="auth-brand-icon" aria-hidden="true">
              <Sprout size={20} strokeWidth={2.25} />
            </span>
            Habit Shaper
          </Link>
          <div>
            <h1 id="register-heading">Create your account</h1>
            <p>Start building better habits, one day at a time.</p>
          </div>
        </header>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          {formError && (
            <div className="form-alert" role="alert">
              {formError}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p className="field-error" id="email-error" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
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
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            {errors.password ? (
              <p className="field-error" id="password-error" role="alert">
                {errors.password.message}
              </p>
            ) : (
              <p className="field-help" id="password-help">
                8–72 characters
              </p>
            )}
          </div>

          <button
            className="submit-button"
            type="submit"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  )
}
