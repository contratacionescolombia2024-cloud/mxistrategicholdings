
/**
 * Comprehensive error handling utility for game systems
 * Provides centralized error logging, user-friendly messages, and recovery strategies
 */

import { Alert } from 'react-native';

export interface GameError {
  code: string;
  message: string;
  userMessage: string;
  recoverable: boolean;
  context?: any;
}

export class GameErrorHandler {
  private static errors: GameError[] = [];
  private static maxErrors = 50;

  /**
   * Log an error with context
   */
  static logError(error: any, context: string, additionalInfo?: any): GameError {
    const timestamp = new Date().toISOString();
    const errorCode = this.generateErrorCode(context);
    
    const gameError: GameError = {
      code: errorCode,
      message: error?.message || String(error),
      userMessage: this.getUserFriendlyMessage(error, context),
      recoverable: this.isRecoverable(error),
      context: {
        timestamp,
        context,
        ...additionalInfo,
        stack: error?.stack,
      },
    };

    // Log to console with detailed information
    console.error(`[GameError ${errorCode}] ${context}:`, {
      message: gameError.message,
      recoverable: gameError.recoverable,
      context: gameError.context,
    });

    // Store error
    this.errors.push(gameError);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    return gameError;
  }

  /**
   * Handle an error and show appropriate UI feedback
   */
  static handleError(
    error: any,
    context: string,
    options?: {
      showAlert?: boolean;
      onRetry?: () => void;
      onCancel?: () => void;
      additionalInfo?: any;
    }
  ): GameError {
    const gameError = this.logError(error, context, options?.additionalInfo);

    if (options?.showAlert !== false) {
      const buttons: any[] = [];

      if (gameError.recoverable && options?.onRetry) {
        buttons.push({
          text: 'Reintentar',
          onPress: options.onRetry,
        });
      }

      buttons.push({
        text: options?.onCancel ? 'Cancelar' : 'OK',
        style: 'cancel',
        onPress: options?.onCancel,
      });

      Alert.alert('Error', gameError.userMessage, buttons);
    }

    return gameError;
  }

  /**
   * Generate a unique error code
   */
  private static generateErrorCode(context: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    const contextCode = context.substring(0, 3).toUpperCase();
    return `${contextCode}-${timestamp}-${random}`;
  }

  /**
   * Get user-friendly error message
   */
  private static getUserFriendlyMessage(error: any, context: string): string {
    const errorMessage = error?.message || String(error);

    // Database errors
    if (errorMessage.includes('violates foreign key constraint')) {
      return 'Error de integridad de datos. Por favor contacta al soporte.';
    }
    if (errorMessage.includes('duplicate key value')) {
      return 'Ya existe un registro con estos datos.';
    }
    if (errorMessage.includes('permission denied')) {
      return 'No tienes permisos para realizar esta acción.';
    }
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      return 'Error de configuración de base de datos. Contacta al soporte.';
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
    }
    if (errorMessage.includes('timeout')) {
      return 'La operación tardó demasiado. Intenta de nuevo.';
    }

    // Game-specific errors
    if (context.includes('join') || context.includes('session')) {
      return 'No se pudo unir al juego. Intenta de nuevo o selecciona otro juego.';
    }
    if (context.includes('balance') || context.includes('MXI')) {
      return 'Error al procesar tu saldo. Verifica que tengas suficiente MXI.';
    }
    if (context.includes('participant')) {
      return 'Error al registrar tu participación. Intenta de nuevo.';
    }
    if (context.includes('prize') || context.includes('winner')) {
      return 'Error al procesar el premio. Contacta al soporte con tu código de sesión.';
    }

    // Generic fallback
    return `Ocurrió un error inesperado. Por favor intenta de nuevo.\n\nSi el problema persiste, contacta al soporte.`;
  }

  /**
   * Determine if an error is recoverable
   */
  private static isRecoverable(error: any): boolean {
    const errorMessage = error?.message || String(error);

    // Non-recoverable errors
    if (errorMessage.includes('permission denied')) return false;
    if (errorMessage.includes('does not exist')) return false;
    if (errorMessage.includes('violates foreign key constraint')) return false;

    // Recoverable errors
    if (errorMessage.includes('network')) return true;
    if (errorMessage.includes('timeout')) return true;
    if (errorMessage.includes('fetch')) return true;

    // Default to recoverable
    return true;
  }

  /**
   * Get all logged errors
   */
  static getErrors(): GameError[] {
    return [...this.errors];
  }

  /**
   * Clear all logged errors
   */
  static clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    total: number;
    recoverable: number;
    nonRecoverable: number;
    byContext: Record<string, number>;
  } {
    const stats = {
      total: this.errors.length,
      recoverable: 0,
      nonRecoverable: 0,
      byContext: {} as Record<string, number>,
    };

    this.errors.forEach((error) => {
      if (error.recoverable) {
        stats.recoverable++;
      } else {
        stats.nonRecoverable++;
      }

      const context = error.context?.context || 'unknown';
      stats.byContext[context] = (stats.byContext[context] || 0) + 1;
    });

    return stats;
  }
}

/**
 * Async wrapper with automatic error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string,
  options?: {
    showAlert?: boolean;
    onError?: (error: GameError) => void;
    additionalInfo?: any;
  }
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const gameError = GameErrorHandler.handleError(error, context, {
      showAlert: options?.showAlert,
      additionalInfo: options?.additionalInfo,
    });

    if (options?.onError) {
      options.onError(gameError);
    }

    return null;
  }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries || 3;
  const initialDelay = options?.initialDelay || 1000;
  const maxDelay = options?.maxDelay || 10000;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed for ${context}. Retrying in ${delay}ms...`);

        if (options?.onRetry) {
          options.onRetry(attempt + 1, error);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw GameErrorHandler.logError(
    lastError,
    `${context} (after ${maxRetries} retries)`,
    { maxRetries, initialDelay, maxDelay }
  );
}
