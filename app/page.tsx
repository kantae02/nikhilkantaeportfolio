import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Reel from '@/components/Reel';
import Credits from '@/components/Credits';
import Gallery from '@/components/Gallery';
import StageBorn from '@/components/StageBorn';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import MotionProvider from '@/components/MotionProvider';
import { getPublicPhotos } from '@/lib/photos';
import { getCredits, getSiteContent, getVideos } from '@/lib/content';
import { resolvePhotos } from '@/lib/featured';

// ISR: rebuilt at most every 5 minutes, and immediately when the admin
// changes anything (the API routes call revalidatePath('/')).
export const revalidate = 300;

export default async function HomePage() {
  const [uploaded, content, credits, videos] = await Promise.all([
    getPublicPhotos(),
    getSiteContent(),
    getCredits(),
    getVideos(),
  ]);
  const { gallery, portrait, stagePhoto, heroPhoto } = resolvePhotos(uploaded);

  // Section numbers follow what's actually shown (Credits hides when empty).
  const sections = ['about', 'reel', ...(credits.length > 0 ? ['credits'] : []), 'gallery', 'stage', 'contact'];
  const index = (id: string) => String(sections.indexOf(id) + 1).padStart(2, '0');

  return (
    <MotionProvider>
      <CustomCursor />
      <Navbar instagram={content.contact.instagram} showCredits={credits.length > 0} />
      <main>
        <Hero taglines={content.taglines} motto={content.heroMotto} photo={heroPhoto} settings={content.imageSettings.hero} />
        <About index={index('about')} photo={portrait} content={content} />
        <Reel index={index('reel')} videos={videos} />
        {credits.length > 0 && <Credits index={index('credits')} credits={credits} />}
        <Gallery index={index('gallery')} photos={gallery} />
        <StageBorn index={index('stage')} photo={stagePhoto} quote={content.stageQuote} settings={content.imageSettings.stage} />
        <Contact index={index('contact')} contact={content.contact} pdfUrl={content.portfolioPdfUrl} />
      </main>
      <Footer contact={content.contact} youtubeId={videos[0]?.youtube_id} />
    </MotionProvider>
  );
}
