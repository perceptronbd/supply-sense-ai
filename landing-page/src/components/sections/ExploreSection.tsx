import ContactForm from '../ui/ContactForm';
import SectionWrapper from '../ui/SectionWrapper';

const ExploreSection = () => {
  return (
    <SectionWrapper>
      <h1 className="max-w-xl font-display leading-snug text-2xl md:text-4xl font-bold text-content1-foreground text-center mx-auto mb-6">
        Ready to explore it for Your Team?
      </h1>
      <p className="text-content1-foreground max-w-xl mx-auto text-start mb-12">
        Let’s show you how Supply Sense works for operations leads, distributors, and manufacturers.
      </p>

      {/* submit form */}
      <ContactForm />
    </SectionWrapper>
  );
};

export default ExploreSection;
