import Container from './ui/Container';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';
import Card from './ui/Card';
import Button from './ui/Button';

const rules = [
  {
    title: 'Unlimited Rounds',
    value: '10 dishes per person each round',
  },
  {
    title: 'Round Time',
    value: '10 minute cooldown',
  },
  {
    title: 'Dining Time',
    value: '2.5 hours',
  },
  {
    title: 'Freshly Prepared',
    value: 'Every dish made to order',
  },
];

export default function Ayce() {
  return (
    <Section
      className="bg-gradient-to-b from-[#070504] to-[#111111]"
    >
      <Container>
        <SectionTitle
          subtitle="All You Can Eat"
          title="A premium Japanese dining experience."
          description="Enjoy unlimited sushi, grill and warm dishes. Every order is freshly prepared and served in multiple rounds."
        />

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {rules.map((item) => (
            <Card key={item.title}>
              <div className="text-amber-300 text-4xl font-black mb-5">
                ✓
              </div>

              <h3 className="text-2xl font-black">
                {item.title}
              </h3>

              <p className="mt-4 text-zinc-400 leading-7">
                {item.value}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <Button href="#reservation">
            Reserve Your Table
          </Button>
        </div>
      </Container>
    </Section>
  );
}