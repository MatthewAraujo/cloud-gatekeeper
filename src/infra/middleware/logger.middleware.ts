import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name)

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now()
    const { method, originalUrl, ip, headers } = req
    const userAgent = headers['user-agent'] || 'Unknown'
    const requestId = this.generateRequestId()
    // Store reference to 'this' for use in arrow function below
    const middleware = this

    // Log incoming request
    this.logger.log(
      `🚀 ${method} ${originalUrl} - IP: ${ip} - User-Agent: ${userAgent} - RequestID: ${requestId}`
    )

    // Log request body for non-GET requests (excluding sensitive data)
    if (method !== 'GET' && req.body) {
      const sanitizedBody = this.sanitizeRequestBody(req.body)
      this.logger.debug(`📦 Request Body: ${JSON.stringify(sanitizedBody)}`)
    }

    // Override res.end to capture response data
    const originalEnd = res.end
    res.end = (chunk?: any, encoding?: any): Response => {
      const endTime = Date.now()
      const duration = endTime - startTime
      const { statusCode } = res

      // Determine log level based on status code
      const logLevel = middleware.getLogLevel(statusCode)
      const emoji = middleware.getStatusEmoji(statusCode)

      middleware.logger[logLevel](
        `${emoji} ${method} ${originalUrl} - Status: ${statusCode} - Duration: ${duration}ms - RequestID: ${requestId}`
      )

      // Log response body for errors (excluding sensitive data)
      if (statusCode >= 400 && chunk) {
        try {
          const responseBody = chunk.toString()
          const sanitizedResponse = middleware.sanitizeResponseBody(responseBody)
          middleware.logger.debug(`📦 Response Body: ${sanitizedResponse}`)
        } catch (error) {
          middleware.logger.debug('📦 Response Body: [Unable to parse]')
        }
      }

      // Call original end method
      return originalEnd.call(res, chunk, encoding)
    }

    next()
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getLogLevel(statusCode: number): 'log' | 'warn' | 'error' {
    if (statusCode >= 500) return 'error'
    if (statusCode >= 400) return 'warn'
    return 'log'
  }

  private getStatusEmoji(statusCode: number): string {
    if (statusCode >= 500) return '💥'
    if (statusCode >= 400) return '⚠️'
    if (statusCode >= 300) return '🔄'
    if (statusCode >= 200) return '✅'
    return '❓'
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') return body

    const sanitized = { ...body }
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization']

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized
  }

  private sanitizeResponseBody(responseBody: string): string {
    try {
      const parsed = JSON.parse(responseBody)
      const sanitized = this.sanitizeRequestBody(parsed)
      return JSON.stringify(sanitized)
    } catch {
      // If not JSON, return as is but limit length
      return responseBody.length > 500 ? `${responseBody.substring(0, 500)}...` : responseBody
    }
  }
} 