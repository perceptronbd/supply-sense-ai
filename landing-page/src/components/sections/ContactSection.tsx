import ContactForm from '../ui/ContactForm';
import SectionWrapper from '../ui/SectionWrapper';

const SECTION_ID = 'contact';

const ContactSection = () => {
  return (
    <SectionWrapper
      id={SECTION_ID}
      size="medium"
      className="xl:flex justify-between gap-10 space-y-10 items-center"
    >
      <div className="max-w-xl mx-auto xl:mx-0">
        <h1 className="font-brand text-3xl md:text-4xl font-bold text-content1-foreground text-center mx-auto xl:text-start xl:mx-0 mb-6 max-w-md">
          Ready to explore it for Your Team?
        </h1>
        <p className="text-content1-foreground mx-auto text-center xl:text-start xl:mx-0 mb-12 max-w-md pr-5">
          Let’s show you how Supply Sense works for operations leads, distributors, and
          manufacturers.
        </p>
      </div>

      {/* submit form */}
      <ContactForm />
    </SectionWrapper>
  );
};

export default ContactSection;
