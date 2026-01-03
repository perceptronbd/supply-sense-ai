import ContactForm from '../ui/ContactForm';
import SectionWrapper from '../ui/SectionWrapper';

const SECTION_ID = 'contact';

const ContactSection = () => {
  return (
    <SectionWrapper
      id={SECTION_ID}
      size="medium"
      className="xl:flex justify-between gap-16 space-y-12 xl:space-y-0 items-center snap-center min-h-screen py-24 md:py-32 relative overflow-hidden"
    >
      <div className="max-w-xl mx-auto xl:mx-0 relative z-10">
        <h1 className="font-brand text-4xl md:text-5xl lg:text-6xl font-bold text-content1-foreground text-center xl:text-start leading-tight mb-8 drop-shadow-sm">
          Ready to empower <br className="hidden md:block" />
          <span className="text-primary">Your Team?</span>
        </h1>
        <p className="text-lg md:text-xl text-content1-foreground/80 text-center xl:text-start leading-relaxed max-w-lg mx-auto xl:mx-0">
          Experience how Supply Sense transforms operations for leads, distributors, and
          manufacturers with intelligent insights.
        </p>
      </div>

      {/* submit form */}
      <div className="w-full max-w-lg mx-auto xl:mx-0 relative z-10">
        <ContactForm />
      </div>
    </SectionWrapper>
  );
};

export default ContactSection;
