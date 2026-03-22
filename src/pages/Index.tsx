import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import PhotoGallery from '@/components/PhotoGallery';
import MessageWall from '@/components/MessageWall';
import Timeline from '@/components/Timeline';

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <Timeline />
      <PhotoGallery />
      <MessageWall />
    </div>
  );
}
