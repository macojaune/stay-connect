/**
 * Custom error class for handling business logic errors
 */
export default class BusinessError extends Error {
  constructor(
    message: string,
    public code: string = 'E_BUSINESS_RULE',
    public details?: any
  ) {
    super(message)
    this.name = 'BusinessError'
  }

  /**
   * Create an error for when a user has already voted
   */
  static duplicateVote(userId: string, releaseId: string) {
    return new BusinessError(
      'User has already voted for this release',
      'E_DUPLICATE_VOTE',
      { userId, releaseId }
    )
  }

  /**
   * Create an error for when a user tries to modify another user's data
   */
  static unauthorized(action: string, resourceType: string, resourceId: string) {
    return new BusinessError(
      `You are not authorized to ${action} this ${resourceType}`,
      'E_UNAUTHORIZED_ACTION',
      { action, resourceType, resourceId }
    )
  }

  /**
   * Create an error for when a resource is not found
   */
  static notFound(resourceType: string, identifier: string | number) {
    return new BusinessError(
      `${resourceType} not found`,
      'E_RESOURCE_NOT_FOUND',
      { resourceType, identifier }
    )
  }

  /**
   * Create an error for when a unique constraint is violated
   */
  static uniqueConstraint(field: string, value: string, resourceType: string) {
    return new BusinessError(
      `${resourceType} with ${field} '${value}' already exists`,
      'E_UNIQUE_CONSTRAINT',
      { field, value, resourceType }
    )
  }

  /**
   * Create an error for when a required relationship is missing
   */
  static missingRelation(resourceType: string, relationName: string, identifier: string) {
    return new BusinessError(
      `Required ${relationName} not found for ${resourceType}`,
      'E_MISSING_RELATION',
      { resourceType, relationName, identifier }
    )
  }

  /**
   * Create an error for when an operation is not allowed
   */
  static operationNotAllowed(operation: string, reason: string) {
    return new BusinessError(
      `Operation '${operation}' is not allowed: ${reason}`,
      'E_OPERATION_NOT_ALLOWED',
      { operation, reason }
    )
  }
}