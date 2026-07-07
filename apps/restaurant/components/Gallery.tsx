import Container from './ui/Container';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';

const images = [
  'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1200',
  'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=1200',
  'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?q=80&w=1200',
  'https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=1200',
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1200',
  'https://images.unsplash.com/photo-1563612116625-3012372fccce?q=80&w=1200',
];

export default function Gallery() {
  return (
    <Section className="bg-[#111111] text-white">
      <Container>
        <SectionTitle
          subtitle="Gallery"
          title="A taste of DaWu."
          description="Fresh sushi, warm dishes and a modern dining atmosphere."
        />

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image}
              className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 ${
                index === 0 || index === 5 ? 'md:col-span-2' : ''
              }`}
            >
              <div
                className="h-[320px] bg-cover bg-center transition duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${image})` }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70" />
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}