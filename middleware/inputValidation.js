import { body, param, query, validationResult } from 'express-validator'

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    })
  }
  next()
}

// User registration validation
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be 2-50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be 2-50 characters'),
  body('role')
    .optional()
    .isIn(['Admin', 'Staff', 'Customer'])
    .withMessage('Role must be Admin, Staff, or Customer'),
  handleValidationErrors
]

// Parcel creation validation
export const validateParcelCreation = [
  body('trackingId')
    .isLength({ min: 10, max: 20 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Tracking ID must be 10-20 alphanumeric characters'),
  body('courier')
    .isIn(['FreightSight', 'DHL', 'FedEx', 'UPS', 'USPS', 'Aramex', 'Royal Mail'])
    .withMessage('Invalid courier'),
  body('sender.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Sender name is required'),
  body('sender.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid sender email is required'),
  body('receiver.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Receiver name is required'),
  body('receiver.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid receiver email is required'),
  body('weight')
    .optional()
    .matches(/^\d+(\.\d+)?\s?(kg|g|lb|oz)?$/i)
    .withMessage('Invalid weight format'),
  body('dimensions')
    .optional()
    .matches(/^\d+x\d+x\d+\s?(cm|in)?$/i)
    .withMessage('Dimensions must be in format: LxWxH (cm/in)'),
  handleValidationErrors
]

// Parcel update validation
export const validateParcelUpdate = [
  body('status')
    .optional()
    .isIn(['Pending', 'In Transit', 'Out for Delivery', 'Delivered', 'Delayed', 'Returned'])
    .withMessage('Invalid status'),
  body('currentLocation')
    .optional()
    .isObject()
    .withMessage('Current location must be an object'),
  body('estimatedDelivery')
    .optional()
    .isISO8601()
    .withMessage('Estimated delivery must be a valid date'),
  handleValidationErrors
]

// Tracking ID parameter validation
export const validateTrackingId = [
  param('trackingId')
    .isLength({ min: 10, max: 20 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Invalid tracking ID format'),
  handleValidationErrors
]

// Scheduled update validation
export const validateScheduledUpdate = [
  body('trackingId')
    .isLength({ min: 10, max: 20 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Invalid tracking ID format'),
  body('scheduledTime')
    .isISO8601()
    .withMessage('Scheduled time must be a valid future date'),
  body('location')
    .isObject()
    .withMessage('Location must be an object'),
  body('status')
    .isIn(['In Transit', 'Out for Delivery', 'Delivered'])
    .withMessage('Invalid scheduled status'),
  handleValidationErrors
]
