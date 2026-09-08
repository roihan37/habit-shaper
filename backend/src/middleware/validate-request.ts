import type { RequestHandler } from "express"
import { z } from "zod"

type RequestSchemas = {
  body?: z.ZodType
  params?: z.ZodType
  query?: z.ZodType
}

function formatValidationDetails(error: z.ZodError): Record<string, string[]> {
  return error.issues.reduce<Record<string, string[]>>((details, issue) => {
    const field = issue.path.join(".") || "_root"
    details[field] = [...(details[field] ?? []), issue.message]
    return details
  }, {})
}

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (req, res, next) => {
    const body = schemas.body?.safeParse(req.body)
    const params = schemas.params?.safeParse(req.params)
    const query = schemas.query?.safeParse(req.query)

    const failure = [body, params, query].find(
      (result) => result && !result.success,
    )

    if (failure && !failure.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: formatValidationDetails(failure.error),
        },
      })
      return
    }

    if (body?.success) {
      req.body = body.data
    }

    if (params?.success) {
      req.params = params.data as typeof req.params
    }

    if (query?.success) {
      Object.defineProperty(req, "query", {
        value: query.data,
        writable: true,
        enumerable: true,
        configurable: true,
      })
    }

    next()
  }
}
