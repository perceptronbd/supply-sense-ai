import {
  isEmail,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsOptionalEmailConstraint implements ValidatorConstraintInterface {
  validate(value: string, _args: ValidationArguments) {
    console.log('🔥 CUSTOM EMAIL VALIDATOR CALLED:', value, typeof value);

    if (!value) {
      console.log('✅ Email validation: allowing null/undefined/empty');
      return true;
    }

    return isEmail(value);
  }

  defaultMessage(_args: ValidationArguments) {
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
