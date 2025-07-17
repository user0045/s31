

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Star, Play, Calendar, Clock } from 'lucide-react';

const Player = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const episodeId = searchParams.get('episode');
  const content = location.state || {};
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [currentSeasonDetails, setCurrentSeasonDetails] = useState(null);
  const [videoError, setVideoError] = useState(false);

  // Comprehensive debugging
  console.log('=== PLAYER DEBUG INFO ===');
  console.log('Location state:', location.state);
  console.log('Content object:', content);
  console.log('Episode ID from URL:', episodeId);
  console.log('Content.content_type:', content.content_type);
  console.log('========================');

  // Fetch episode details if episodeId is provided
  useEffect(() => {
    const fetchEpisodeDetails = async () => {
      if (episodeId) {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: episodeData, error } = await supabase
            .from('episode')
            .select('*')
            .eq('episode_id', episodeId)
            .single();
          
          if (!error && episodeData) {
            setCurrentEpisode(episodeData);
          }
        } catch (err) {
          console.error('Error fetching episode details:', err);
        }
      }
    };

    fetchEpisodeDetails();
    // Reset video error when episode changes
    setVideoError(false);
  }, [episodeId]);

  // Get season details for web series
  useEffect(() => {
    const fetchSeasonDetails = async () => {
      if (content.content_type === 'Web Series' && content.web_series?.season_id_list) {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const seasonId = content.web_series.season_id_list[0]; // Default to first season
          
          if (seasonId) {
            const { data: seasonData, error } = await supabase
              .from('season')
              .select('*')
              .eq('season_id', seasonId)
              .single();
            
            if (!error && seasonData) {
              setCurrentSeasonDetails(seasonData);
            }
          }
        } catch (err) {
          console.error('Error fetching season details:', err);
        }
      }
    };

    fetchSeasonDetails();
  }, [content]);

  // Get the actual video URL based on content type
  const getVideoUrl = () => {
    console.log('Getting video URL for content:', content);
    console.log('Content type:', content.content_type);
    console.log('Current episode:', currentEpisode);

    // If we have an episode, try to get its video URL
    if (currentEpisode?.video_url) {
      console.log('Episode video URL found:', currentEpisode.video_url);
      return currentEpisode.video_url;
    }

    if (content.content_type === 'Movie' && content.movie?.video_url) {
      console.log('Movie video URL found:', content.movie.video_url);
      return content.movie.video_url;
    } else if (content.content_type === 'Web Series' && content.web_series?.seasons?.[0]?.episodes?.[0]?.video_url) {
      console.log('Web Series video URL found:', content.web_series.seasons[0].episodes[0].video_url);
      return content.web_series.seasons[0].episodes[0].video_url;
    } else if (content.content_type === 'Show' && content.show?.episode_id_list?.length > 0) {
      const showVideoUrl = content.videoUrl || content.video_url;
      console.log('Show video URL found:', showVideoUrl);
      return showVideoUrl;
    }

    // Fallback to any video URL in the content object
    const fallbackUrl = content.videoUrl || content.video_url || content.movie?.video_url;
    console.log('Using fallback video URL:', fallbackUrl);
    return fallbackUrl || '';
  };

  const videoUrl = getVideoUrl();

  console.log('Final video URL for player:', videoUrl, 'for content type:', content.content_type);

  // Process embed code to extract iframe src or return the embed code directly
  const processEmbedCode = (embedCode: string) => {
    if (!embedCode) return { embedUrl: '', isEmbedCode: false };

    // Check if it's an HTML embed code (contains iframe)
    if (embedCode.includes('<iframe') && embedCode.includes('src=')) {
      const srcMatch = embedCode.match(/src=["']([^"']+)["']/);
      if (srcMatch && srcMatch[1]) {
        return { embedUrl: srcMatch[1], isEmbedCode: true };
      }
    }

    // Check if it's a direct URL
    if (embedCode.startsWith('http')) {
      // YouTube URL patterns
      if (embedCode.includes('youtube.com') || embedCode.includes('youtu.be')) {
        let videoId = '';

        if (embedCode.includes('youtu.be/')) {
          videoId = embedCode.split('youtu.be/')[1].split('?')[0];
        } else if (embedCode.includes('youtube.com/watch?v=')) {
          videoId = embedCode.split('v=')[1].split('&')[0];
        } else if (embedCode.includes('youtube.com/embed/')) {
          return { embedUrl: embedCode, isEmbedCode: true };
        }

        if (videoId) {
          return { 
            embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3`, 
            isEmbedCode: true 
          };
        }
      }

      // Vimeo URL patterns
      if (embedCode.includes('vimeo.com')) {
        const videoId = embedCode.split('/').pop()?.split('?')[0];
        if (videoId) {
          return { 
            embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=0&title=0&byline=0&portrait=0&pip=0`, 
            isEmbedCode: true 
          };
        }
      }

      // For direct video files
      if (embedCode.includes('.mp4') || embedCode.includes('.webm') || embedCode.includes('.ogg')) {
        return { embedUrl: embedCode, isEmbedCode: false };
      }

      // For other embed URLs, use directly
      return { embedUrl: embedCode, isEmbedCode: true };
    }

    // If it's already processed embed code or unrecognized format
    return { embedUrl: '', isEmbedCode: false };
  };

  const { embedUrl, isEmbedCode } = processEmbedCode(videoUrl);

  const getContentTypeDisplay = () => {
    switch (content.content_type) {
      case 'Movie': return 'Movie';
      case 'Web Series': return 'Web Series';
      case 'Show': return 'TV Show';
      default: 
        // Fallback for legacy data
        if (content.type === 'series') return 'Web Series';
        if (content.type === 'show') return 'TV Show';
        return content.content_type || content.type || 'Content';
    }
  };

  // Get episode number for web series and shows
  const getEpisodeInfo = () => {
    if (currentEpisode) {
      // Try to extract episode number from title or use a default
      const episodeMatch = currentEpisode.title?.match(/episode\s*(\d+)/i);
      if (episodeMatch) {
        return `Episode ${episodeMatch[1]}`;
      }
      // Fallback: use episode order if available
      return `Episode ${currentEpisode.episode_number || '1'}`;
    }
    return null;
  };

  // Get season number for web series
  const getSeasonInfo = () => {
    if (content.content_type === 'Web Series') {
      if (currentSeasonDetails?.season_number) {
        return `Season ${currentSeasonDetails.season_number}`;
      } else if (content.seasonNumber) {
        return `Season ${content.seasonNumber}`;
      }
      return 'Season 1'; // Default fallback
    }
    return null;
  };

  // Get duration - prioritize episode duration
  const getDuration = () => {
    if (currentEpisode?.duration) {
      return `${currentEpisode.duration} min`;
    }
    if (content.content_type === 'Movie' && content.movie?.duration) {
      return `${content.movie.duration} min`;
    }
    return null;
  };

  // Get description - prioritize episode description
  const getDescription = () => {
    if (currentEpisode?.description) {
      return currentEpisode.description;
    }
    if (content.content_type === 'Movie' && content.movie?.description) {
      return content.movie.description;
    } else if (content.content_type === 'Web Series' && currentSeasonDetails?.season_description) {
      return currentSeasonDetails.season_description;
    } else if (content.content_type === 'Show' && content.show?.description) {
      return content.show.description;
    }
    return content.description || 'No description available';
  };

  // Get rating information
  const getRatingInfo = () => {
    if (content.content_type === 'Movie' && content.movie) {
      return {
        rating_type: content.movie.rating_type,
        rating: content.movie.rating,
        release_year: content.movie.release_year
      };
    } else if (content.content_type === 'Web Series' && currentSeasonDetails) {
      return {
        rating_type: currentSeasonDetails.rating_type,
        rating: currentSeasonDetails.rating,
        release_year: currentSeasonDetails.release_year
      };
    } else if (content.content_type === 'Show' && content.show) {
      return {
        rating_type: content.show.rating_type,
        rating: content.show.rating,
        release_year: content.show.release_year
      };
    }
    return {
      rating_type: content.rating_type || content.rating || 'Not Rated',
      rating: content.score || content.rating || 0,
      release_year: content.year || content.release_year || new Date().getFullYear()
    };
  };

  const ratingInfo = getRatingInfo();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size="sm"
              className="bg-primary/5 backdrop-blur-sm border border-primary/30 text-primary hover:bg-gradient-to-br hover:from-black/30 hover:via-[#0A7D4B]/5 hover:to-black/30 hover:border-primary/20 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Main Content Layout */}
          <div className="space-y-8">
            {/* Video Player Section */}
            <Card className="bg-gradient-to-br from-black/90 via-[#0A7D4B]/20 to-black/90 backdrop-blur-sm border border-border/50 wave-transition relative overflow-hidden">
              {/* Animated Background Waves */}
              <div className="absolute inset-0">
                <div className="player-wave-bg-1"></div>
                <div className="player-wave-bg-2"></div>
                <div className="player-wave-bg-3"></div>
              </div>

              <CardContent className="p-8 relative z-10">
                {/* Video Player */}
                <div className="w-full max-w-4xl mx-auto mb-8">
                  <div className="aspect-video bg-gradient-to-br from-black/95 via-[#0A7D4B]/10 to-black/95 rounded-xl relative border border-primary/20 shadow-2xl overflow-hidden custom-video-container">
                    {embedUrl && !videoError ? (
                      isEmbedCode ? (
                        <div className="relative w-full h-full group">
                          {/* Custom Play Icon Overlay */}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                            <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center backdrop-blur-sm border border-primary/50 shadow-lg">
                              <Play className="w-8 h-8 text-white fill-current ml-1" />
                            </div>
                          </div>
                          
                          <iframe
                            className="w-full h-full rounded-xl custom-video-player"
                            src={embedUrl}
                            title={content.title || 'Video Player'}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            onError={() => setVideoError(true)}
                            style={{
                              filter: 'contrast(1.1) brightness(1.05)',
                              border: 'none',
                              background: 'transparent'
                            }}
                            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                          />
                          
                          {/* Subtle theme-integrated borders */}
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 pointer-events-none"></div>
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 pointer-events-none"></div>
                        </div>
                      ) : (
                        <div className="relative w-full h-full group">
                          {/* Custom Play Icon Overlay for direct videos */}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                            <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center backdrop-blur-sm border border-primary/50 shadow-lg">
                              <Play className="w-8 h-8 text-white fill-current ml-1" />
                            </div>
                          </div>
                          
                          <video
                            className="w-full h-full rounded-xl object-cover custom-video-player"
                            controls
                            poster={content.image || content.thumbnail_url || content.movie?.thumbnail_url}
                            preload="metadata"
                            onError={() => setVideoError(true)}
                            style={{
                              filter: 'contrast(1.1) brightness(1.05)',
                              outline: 'none'
                            }}
                          >
                            <source src={embedUrl} type="video/mp4" />
                            <source src={embedUrl} type="video/webm" />
                            <source src={embedUrl} type="video/ogg" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full rounded-xl bg-gradient-to-br from-black/95 via-[#0A7D4B]/10 to-black/95 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-20 h-20 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                            <Play className="w-8 h-8 text-primary fill-current" />
                          </div>
                          <div className="text-primary text-xl font-semibold mb-2">
                            {videoError ? "Unable to Play Content" : "⚠️ Video Not Available"}
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {videoError ? "The video could not be loaded or played" : "No video embed code found for this content"}
                          </p>
                          {!videoError && (
                            <p className="text-xs text-muted-foreground/70 mt-2">
                              Content Type: {getContentTypeDisplay()}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Information */}
                <div className="max-w-4xl mx-auto space-y-4">
                  {/* Title and Season/Episode Info */}
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h1 className="text-3xl font-bold text-foreground">
                      {content.content_type === 'Web Series' ? content.title : 
                       content.content_type === 'Show' ? content.show?.title || content.title :
                       currentEpisode?.title || content.title}
                    </h1>
                    <div className="flex items-center space-x-3">
                      {content.content_type === 'Web Series' && getSeasonInfo() && (
                        <span className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 px-3 py-1 rounded-md border border-blue-500/30 text-sm font-medium">
                          {getSeasonInfo()}
                        </span>
                      )}
                      {(content.content_type === 'Web Series' || content.content_type === 'Show') && getEpisodeInfo() && (
                        <span className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 px-3 py-1 rounded-md border border-purple-500/30 text-sm font-medium">
                          {getEpisodeInfo()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating and Year Info */}
                  <div className="flex items-center space-x-4 flex-wrap">
                    {ratingInfo.rating_type && (
                      <span className="bg-primary/20 text-primary px-3 py-1 rounded-md border border-primary/30 text-sm font-medium">
                        {ratingInfo.rating_type}
                      </span>
                    )}
                    {ratingInfo.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-foreground text-sm font-medium">
                          {ratingInfo.rating}
                        </span>
                      </div>
                    )}
                    {ratingInfo.release_year && (
                      <span className="text-muted-foreground text-sm font-medium">
                        {ratingInfo.release_year}
                      </span>
                    )}
                    {getDuration() && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground text-sm font-medium">
                          {getDuration()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Description</h3>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      {getDescription()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advertisement Section */}
            <div className="w-full">
              <Card className="bg-gradient-to-br from-black/40 via-[#0A7D4B]/10 to-black/40 backdrop-blur-sm border border-border/30 min-h-[300px]">
                <CardContent className="p-8 flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-muted-foreground/50 text-2xl mb-4">Advertisement Space</div>
                    <div className="text-muted-foreground/30 text-lg">Full Width Banner</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;

