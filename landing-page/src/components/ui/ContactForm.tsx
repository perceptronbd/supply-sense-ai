'use client';
import { addToast, Button, Input, Textarea } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
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
    <div className="flex-1 mx-auto max-w-lg xl:mx-0">
      <div className="overflow-hidden relative rounded-xl border-1 border-primary-50">
        <div className="contact-us-glow"></div>
        <div className="p-6 w-full rounded-xl backdrop-blur-md bg-background/15">
          <h2 className="mb-8 text-2xl font-bold text-center md:text-3xl font-brand text-content1-foreground">
            Schedule A Demo
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Row 1: Name and Company */}

            {/* Name Field */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  label="Name"
                  labelPlacement="inside"
                  placeholder="Enter Your Name"
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message}
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
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  label="Email"
                  placeholder="Email address"
                  labelPlacement="inside"
                  isInvalid={!!errors.email}
                  errorMessage={errors.email?.message}
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
                  value={field.value ?? ''}
                  type="text"
                  label="Company"
                  labelPlacement="inside"
                  placeholder="Company Name (Optional)"
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
              render={({ field }) => (
                <Textarea
                  {...field}
                  label="Message"
                  labelPlacement="inside"
                  placeholder="How can we assist you?"
                  isInvalid={!!errors.message}
                  errorMessage={errors.message?.message}
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
            <div className="flex pt-4">
              <Button
                type="submit"
                isLoading={isSubmitting}
                variant="solid"
                color="primary"
                className="py-3 w-full font-semibold shadow-lg transition-shadow text-medium hover:shadow-primary/25"
              >
                Submit Request
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
