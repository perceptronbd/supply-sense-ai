'use client';
import { Button, Input, Textarea } from '@heroui/react';
import { Controller, FieldValues, useForm } from 'react-hook-form';
import { Icons } from '../icons';

export default function ContactForm() {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = (data: FieldValues) => {
    console.log('Form Data:', data);
    alert('Form submitted successfully!');
    reset();
  };

  return (
    <div className="max-w-lg flex-1 mx-auto xl:mx-0">
      <div className="bg-gradient-to-b from-primary-50 to-primary-200 rounded-xl p-0.5">
        <div className="bg-gradient-to-r from-default-50 via-primary-200 to-default-100 rounded-xl w-full p-6">
          <h2 className="text-center text-2xl md:text-3xl font-brand font-bold text-content1-foreground mb-8">
            Schedule A Demo
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Row 1: Name and Company */}

            {/* Name Field */}
            <Controller
              name="name"
              control={control}
              rules={{
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  label="Name"
                  labelPlacement="inside"
                  placeholder="Enter Your Name"
                  startContent={<Icons.User className="h-5 w-5 text-default-500" />}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message?.toString()}
                  variant="faded"
                  color="primary"
                  classNames={{
                    base: 'w-full',
                    inputWrapper: 'bg-default-100 border-2 border-default-200',
                    input: 'placeholder:text-default-500 focus:outline-none focus:ring-0',
                    label: 'text-primary text-sm',
                  }}
                />
              )}
            />

            {/* Row 2: Email */}
            <Controller
              name="email"
              control={control}
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  label="Email"
                  placeholder="Email address"
                  labelPlacement="inside"
                  startContent={<Icons.Mail className="h-5 w-5 text-default-500" />}
                  isInvalid={!!errors.email}
                  errorMessage={errors.email?.message?.toString()}
                  variant="faded"
                  color="primary"
                  classNames={{
                    base: 'w-full',
                    inputWrapper: 'bg-default-100 border-2 border-default-200',
                    input: 'placeholder:text-default-500 focus:outline-none focus:ring-0',
                    label: 'text-primary text-sm',
                  }}
                />
              )}
            />

            {/*Row 3: Company Field */}
            <Controller
              name="company"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  label="Company"
                  labelPlacement="inside"
                  placeholder="Company Name"
                  startContent={<Icons.Building className="h-5 w-5 text-default-500" />}
                  variant="faded"
                  color="primary"
                  classNames={{
                    base: 'w-full',
                    inputWrapper: 'bg-default-100 border-2 border-default-200',
                    input: 'placeholder:text-default-500 focus:outline-none focus:ring-0',
                    label: 'text-primary text-sm',
                  }}
                />
              )}
            />

            {/*Row 4: Message Field */}
            <Controller
              name="message"
              control={control}
              rules={{
                required: 'Message is required',
                minLength: {
                  value: 10,
                  message: 'Message must be at least 10 characters',
                },
              }}
              render={({ field }) => (
                <Textarea
                  {...field}
                  label="Message"
                  labelPlacement="inside"
                  placeholder="How can we assist you?"
                  startContent={<Icons.MessageSquare className="h-5 w-5 text-default-500" />}
                  isInvalid={!!errors.message}
                  errorMessage={errors.message?.message?.toString()}
                  variant="faded"
                  color="primary"
                  minRows={4}
                  classNames={{
                    base: 'w-full',
                    inputWrapper: 'bg-default-100 border-2 border-default-200',
                    input: 'placeholder:text-default-500 focus:outline-none focus:ring-0',
                    label: 'text-primary text-sm',
                  }}
                />
              )}
            />

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="submit"
                variant="solid"
                color="primary"
                className="flex-1 py-3"
                startContent={<Icons.SendIcon className="h-5 w-5" />}
              >
                Submit
              </Button>

              <Button
                type="button"
                variant="bordered"
                className="flex-1 border-primary py-3 text-primary"
                startContent={<Icons.Phone className="h-5 w-5 text-primary" />}
              >
                Reach out
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
