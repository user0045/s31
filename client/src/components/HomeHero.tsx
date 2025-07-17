import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAllContent } from '@/hooks/useContentQueries';

const HomeHero = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const { data: allContent } = useAllContent();

  // Get latest content for hero (newest content with "Home Hero" feature - Movies and Web Series seasons)
  const getHeroContent = () => {
    const allContentArray = [
      ...(allContent?.movies || []),
      ...(allContent?.webSeries || [])
    ].filter(content => {
      if (content.content_type === 'Movie') {
        return content.movie?.feature_in?.includes('Home Hero');
      } else if (content.content_type === 'Web Series') {
        // Each webSeries entry now represents a single season
        return content.web_series?.seasons?.[0]?.feature_in?.includes('Home Hero');
      }
      return false;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (allContentArray.length === 0) {
      return {
        id: 1,
        title: "Welcome to StreamVault",
        description: "Discover amazing movies, web series, and shows. Upload your content to get started.",
        rating: "TV-PG",
        year: "2024",
        score: "9.0",
        image: "/placeholder.svg",
        type: "Platform",
        videoUrl: ""
      };
    }

    const content = allContentArray[0];
    let contentData;
    let thumbnailUrl = "";
    let videoUrl = "";

    if (content.content_type === 'Movie') {
      contentData = content.movie;
      thumbnailUrl = contentData?.thumbnail_url || "";
      videoUrl = contentData?.video_url || "";
    } else if (content.content_type === 'Web Series') {
      // Each webSeries entry now contains only one season
      const seasonData = content.web_series?.seasons?.[0];
      contentData = seasonData;
      thumbnailUrl = seasonData?.thumbnail_url || "";
      videoUrl = seasonData?.episodes?.[0]?.video_url || "";
    }

    return {
      id: content.id,
      title: content.title,
      description: contentData?.description || contentData?.season_description || content.description || "No description available",
      rating: contentData?.rating_type || "TV-PG",
      year: contentData?.release_year?.toString() || content.created_at?.split('-')[0] || "2024",
      score: contentData?.rating?.toString() || "8.0",
      image: thumbnailUrl || "/placeholder.svg",
      type: content.content_type === 'Web Series' ? 'series' : content.content_type,
      seasonNumber: content.seasonNumber || 1,
      videoUrl: videoUrl
    };
  };

  const heroContent = getHeroContent();

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;

      const handlePlay = () => {
        if (video && video.isConnected) {
          video.play().catch((error) => {
            if (error.name !== 'AbortError') {
              console.warn('Video autoplay failed:', error);
            }
          });
        }
      };

      // Add a small delay to ensure the video is properly loaded
      const timeoutId = setTimeout(handlePlay, 100);

      return () => {
        clearTimeout(timeoutId);
        if (video && video.isConnected) {
          video.pause();
          video.currentTime = 0;
        }
      };
    }
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handlePlayClick = () => {
    // Get the original database content for navigation
    const originalContent = getOriginalContentData();
    console.log('HomeHero navigating to details with original content:', originalContent);
    
    if (originalContent) {
      const navigationId = originalContent.content_id || originalContent.id;
      navigate(`/details/${navigationId}`, { state: originalContent });
    } else {
      console.warn('No original content found for navigation');
    }
  };

  const handleMoreInfoClick = () => {
    // Get the original database content for navigation
    const originalContent = getOriginalContentData();
    console.log('HomeHero navigating to details with original content:', originalContent);
    
    if (originalContent) {
      const navigationId = originalContent.content_id || originalContent.id;
      navigate(`/details/${navigationId}`, { state: originalContent });
    } else {
      console.warn('No original content found for navigation');
    }
  };

  const getOriginalContentData = () => {
    if (!allContent) return null;

    const allContentArray = [
      ...(allContent?.movies || []),
      ...(allContent?.webSeries || [])
    ].filter(content => {
      if (content.content_type === 'Movie') {
        return content.movie?.feature_in?.includes('Home Hero');
      } else if (content.content_type === 'Web Series') {
        return content.web_series?.seasons?.[0]?.feature_in?.includes('Home Hero');
      }
      return false;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return allContentArray.length > 0 ? allContentArray[0] : null;
  };

  return (
    <div className="relative h-[85vh] w-full overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover hero-video"
        loop
        muted={isMuted}
        playsInline
        onLoadedData={() => {
          if (videoRef.current && videoRef.current.isConnected) {
            videoRef.current.play().catch((error) => {
              if (error.name !== 'AbortError') {
                console.warn('Video autoplay failed:', error);
              }
            });
          }
        }}
        onError={(e) => {
          console.warn('Video error:', e);
        }}
      >
        <source src={heroContent.videoUrl} type="video/mp4" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      </video>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 content-overlay" />

      {/* Content Card */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-6">
          <div
            className={`max-w-lg backdrop-blur-sm rounded-lg p-3 transition-all duration-700 ease-out pointer-events-auto cursor-pointer ${
              isHovered 
                ? 'transform scale-100 opacity-100 bg-transparent backdrop-blur-md' 
                : 'transform scale-[0.6] opacity-40 bg-black/20'
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handlePlayClick}
          >
            <h1 className="text-xl font-thin mb-2 text-foreground animate-fade-in">
              {heroContent.title}
            </h1>

            <div className="flex items-center space-x-2 mb-2 text-xs text-muted-foreground animate-slide-up">
              <span className="bg-primary/20 text-primary px-2 py-1 rounded border border-primary/30 text-xs">
                {heroContent.rating}
              </span>
              {heroContent.type === 'series' && heroContent.seasonNumber && (
                <span className="bg-primary/20 text-primary px-2 py-1 rounded border border-primary/30 text-xs">
                  Season {heroContent.seasonNumber}
                </span>
              )}
              <span className="font-thin">{heroContent.year}</span>
              <div className="flex items-center space-x-1">
                <span className="text-yellow-400">★</span>
                <span className="font-thin">{heroContent.score}</span>
              </div>
            </div>

            <p className="text-xs font-thin text-foreground/90 mb-4 leading-relaxed animate-slide-up">
              {heroContent.description}
            </p>

            <div className="flex justify-center animate-scale-in">
              <Button 
                onClick={handlePlayClick}
                className="bg-transparent backdrop-blur-sm border border-primary/60 text-primary hover:bg-primary hover:text-white hover:scale-105 transition-all duration-300 font-semibold text-base px-12 py-3 min-w-[180px] rounded-lg shadow-lg"
              >
                <Play className="w-5 h-5 mr-3" />
                Play Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mute Toggle */}
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 p-2 backdrop-blur-sm rounded-full hover:bg-card/40 transition-all duration-200"
      >
        {isMuted ? <VolumeX className="w-4 h-4 stroke-1" /> : <Volume2 className="w-4 h-4 stroke-1" />}
      </button>
    </div>
  );
};

export default HomeHero;