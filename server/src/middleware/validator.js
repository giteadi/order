import { body, param, query, validationResult } from 'express-validator';
import { HTTP_STATUS } from '../config/index.js';

/**
 * Handle validation errors
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));
    
    return res.status(HTTP_STATUS.UNPROCESSABLE).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors,
      timestamp: new Date().toISOString(),
    });
  }
  
  next();
}

/**
 * Common validation rules
 */
export const validators = {
  // Auth validations
  login: [
    body('email')
      .optional({ checkFalsy: true })
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email format'),
    body('phone')
      .optional({ checkFalsy: true })
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Invalid phone number'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    handleValidationErrors,
  ],
  
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be 2-100 characters'),
    body('email')
      .optional({ checkFalsy: true })
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email format'),
    body('phone')
      .optional({ checkFalsy: true })
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Invalid phone number (10 digits starting with 6-9)'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),
    handleValidationErrors,
  ],
  
  forgotPassword: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email format'),
    handleValidationErrors,
  ],
  
  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    handleValidationErrors,
  ],
  
  // Order validations
  createOrder: [
    body('tableId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Invalid table ID'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('Order must contain at least one item'),
    body('items.*.productId')
      .isInt({ min: 1 })
      .withMessage('Invalid product ID'),
    body('items.*.quantity')
      .isInt({ min: 1, max: 50 })
      .withMessage('Quantity must be 1-50'),
    body('specialInstructions')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Instructions too long (max 500 chars)'),
    body('paymentMethod')
      .optional()
      .isIn(['counter', 'razorpay'])
      .withMessage('Payment method must be either "counter" or "razorpay"'),
    handleValidationErrors,
  ],
  
  // Cart validations
  addToCart: [
    body('productId')
      .isInt({ min: 1 })
      .withMessage('Invalid product ID'),
    body('quantity')
      .isInt({ min: 1, max: 50 })
      .withMessage('Quantity must be 1-50'),
    handleValidationErrors,
  ],
  
  updateCart: [
    body('quantity')
      .isInt({ min: 0, max: 50 })
      .withMessage('Quantity must be 0-50'),
    handleValidationErrors,
  ],
  
  // Product validations (Admin only)
  createProduct: [
    body('subcategoryId')
      .isInt({ min: 1 })
      .withMessage('Invalid subcategory ID'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be 2-100 characters'),
    body('price')
      .isFloat({ min: 0.01 })
      .withMessage('Price must be greater than 0'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description too long'),
    handleValidationErrors,
  ],
  
  // Pagination validations
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be 1-100'),
    query('sort')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort must be asc or desc'),
    handleValidationErrors,
  ],
  
  // UUID param validation
  uuidParam: [
    param('uuid')
      .isUUID()
      .withMessage('Invalid UUID format'),
    handleValidationErrors,
  ],
  
  // ID param validation
  idParam: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid ID'),
    handleValidationErrors,
  ],
};

export { body, param, query };
