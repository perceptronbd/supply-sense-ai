import {
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsOptionalEmailConstraint implements ValidatorConstraintInterface {
  validate(email: any) {
    console.log('🔥 CUSTOM EMAIL VALIDATOR CALLED:', email, typeof email);

    // Allow null, undefined, or empty string
    if (email === null || email === undefined || email === '') {
      console.log('✅ Email validation: allowing null/undefined/empty');
      return true;
    }

    // If email is provided, validate format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = typeof email === 'string' && emailRegex.test(email);
    console.log('🧪 Email validation result:', isValid, 'for email:', email);
    return isValid;
  }

  defaultMessage() {
    return 'email must be a valid email address';
  }
}

export function IsOptionalEmail(validationOptions?: ValidationOptions) {
  console.log('🔧 IsOptionalEmail decorator registered');
  return (object: object, propertyName: string) => {
    console.log('🎯 Registering validator for property:', propertyName);
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsOptionalEmailConstraint,
    });
  };
}
