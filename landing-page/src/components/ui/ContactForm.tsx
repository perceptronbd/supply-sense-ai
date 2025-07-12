'use client';
import { Button, Input, Textarea } from '@heroui/react';
import { Building, Mail, MessageSquare, Phone, Send, User } from 'lucide-react';
import { Controller, FieldValues, useForm } from 'react-hook-form';

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
    <div className="p-4 bg-gradient-to-b from-primary-100/10 to-primary-300/20 rounded-xl">
      <div className="w-full rounded-2xl p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Row 1: Name and Company */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  placeholder="Enter Your Name"
                  startContent={<User className="h-5 w-5 text-secondary" />}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message?.toString()}
                  variant="flat"
                  classNames={{
                    base: 'w-full',
                    inputWrapper: 'bg-bigStone-800',
                    input: 'text-secondary placeholder:text-secondary',
                    label: 'text-secondary',
                  }}
                />
              )}
            />

            {/* Company Field */}
            <Controller
              name="company"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  label="Company"
                  placeholder="Company Name"
                  startContent={<Building className="h-5 w-5 text-secondary" />}
                  variant="flat"
                  classNames={{
                    base: 'w-full',
                    inputWrapper: 'bg-bigStone-800',
                    input: 'text-secondary placeholder:text-secondary',
                    label: 'text-secondary',
                  }}
                />
              )}
            />
          </div>

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
                startContent={<Mail className="h-5 w-5 text-secondary" />}
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message?.toString()}
                variant="flat"
                classNames={{
                  base: 'w-full',
                  inputWrapper: 'bg-bigStone-800',
                  input: 'text-secondary placeholder:text-secondary',
                  label: 'text-secondary',
                }}
              />
            )}
          />

          {/*Row 3: Message Field */}
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
                placeholder="How can we assist you?"
                startContent={<MessageSquare className="h-5 w-5 text-secondary" />}
                isInvalid={!!errors.message}
                errorMessage={errors.message?.message?.toString()}
                variant="flat"
                minRows={4}
                classNames={{
                  base: 'w-full',
                  inputWrapper: 'bg-bigStone-800',
                  input: 'text-secondary placeholder:text-secondary resize-none',
                  label: 'text-secondary',
                }}
              />
            )}
          />

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              type="submit"
              variant="solid"
              color="secondary"
              className="flex-1 py-3"
              startContent={<Send className="h-5 w-5" />}
            >
              Submit
            </Button>

            <Button
              type="button"
              variant="bordered"
              className="flex-1 border-secondary py-3"
              startContent={<Phone className="h-5 w-5" />}
            >
              Reach out
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
