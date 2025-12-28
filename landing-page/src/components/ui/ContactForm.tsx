'use client';
import { addToast, Button, Input, Textarea } from '@heroui/react';
import { Controller, FieldValues, useForm } from 'react-hook-form';

export default function ContactForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      company: '',
      message: '',
    },
  });

  const onSubmit = async (data: FieldValues) => {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        addToast({
          title: 'Message Sent',
          description: 'Your message has been sent successfully!',
          color: 'success',
          variant: 'flat',
        });
        reset();
      } else {
        addToast({
          title: 'Failed to Send',
          description: 'Failed to send your message. Please try again.',
          color: 'danger',
          variant: 'flat',
        });
      }
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Error',
        description: 'Something went wrong. Please try again later.',
        color: 'danger',
        variant: 'flat',
      });
    }
  };

  return (
    <div className="max-w-lg flex-1 mx-auto xl:mx-0">
      <div className="relative overflow-hidden rounded-xl border-1 border-primary-50">
        <div className="contact-us-glow"></div>
        <div className="rounded-xl w-full p-6 backdrop-blur-md bg-background/15">
          <h2 className="text-center text-2xl md:text-3xl font-brand font-bold text-content1-foreground mb-8">
            Schedule A Demo
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                isLoading={isSubmitting}
                variant="solid"
                color="primary"
                className="flex-1 py-3"
              >
                Submit
              </Button>

              <Button type="button" variant="bordered" color="primary" className="flex-1 py-3">
                Reach out
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
