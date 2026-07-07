import Card from './ui/Card';
import Container from './ui/Container';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';

const highlights = [
  {
    title: 'Fresh sushi',
    text: 'Prepared daily with quality ingredients and careful presentation.',
  },
  {
    title: 'Warm dishes',
    text: 'Grill, fried dishes and Japanese favourites served fresh from the kitchen.',
  },
  {
    title: 'All you can eat',
    text: 'A relaxed dining experience with multiple rounds and plenty of choice.',
  },
];

export default function About() {
  return (
    <Section className="bg-[#070504] text-white">
      <Container>
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionTitle
            subtitle="About DaWu"
            title="Modern Japanese dining in Beverwijk."
            description="DaWu Sushi Fusion brings together fresh sushi, warm kitchen dishes and grill specialties in a stylish and relaxed restaurant setting. Perfect for dinner with family, friends or colleagues."
          />

          <div className="grid gap-5">
            {highlights.map((item, index) => (
              <Card key={item.title}>
                <div className="mb-4 text-sm font-black uppercase tracking-[0.25em] text-zinc-500">
                  0{index + 1}
                </div>

                <h3 className="text-2xl font-black">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-zinc-400">
                  {item.text}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}